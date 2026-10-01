// js/tryon-editor.js
// 后台"虚拟试戴 - 框图工具"：管理员在商品已有的一张"整卡"照片上，给拇指/食指/中指/
// 无名指/小指分别手动框出一个代表性的指甲区域（4个角点可以自由拖动/旋转，不是固定网格），
// 保存后前台试戴功能会优先用这里框出来的精确区域，而不是把整张商品图硬贴到手模上。
//
// 设计上呼应用户提出的真实生产约束：
// 1. 十个指甲是手工粘在卡片上的，位置不整齐、大小形状因手指和厂家而异——所以这里的框
//    是完全自由的四边形（4个角点独立可拖），不是固定矩形或网格。
// 2. 每种设计只需要挑 5 根手指的代表性指甲框一次（不需要标全部10个物理指甲）。
// 3. 没有框过的手指，试戴时自动回退到整图贴纸方案（见 js/tryon.js），不会报错或留白。
//
// 坐标存储：统一存成"相对于参考图片原始宽高的比例"（0~1），不存像素值，见
// sql/add_tryon_card_config.sql 里的说明——这样以后换参考图分辨率也不用重新标定。

const TRYON_EDITOR_FINGERS = [
  { key: 'thumb', label: '拇指' },
  { key: 'index', label: '食指' },
  { key: 'middle', label: '中指' },
  { key: 'ring', label: '无名指' },
  { key: 'pinky', label: '小指' }
];

const TRYON_EDITOR_COLORS = {
  thumb: '#e74c3c',
  index: '#2ecc71',
  middle: '#3498db',
  ring: '#f1c40f',
  pinky: '#9b59b6'
};

// 指甲形状蒙版的选项列表（跟 js/tryon.js 里的 TRYON_NAIL_SHAPE_LIST 保持一致，这里单独
// 拷贝一份，跟框图工具其它部分一样，不依赖前台渲染文件）
const TRYON_EDITOR_SHAPE_LIST = [
  { key: 'square', label: '方头' },
  { key: 'round', label: '圆头' },
  { key: 'oval', label: '椭圆' },
  { key: 'almond', label: '杏仁形' },
  { key: 'coffin', label: '棺材形' },
  { key: 'stiletto', label: '尖头' }
];

// 跟 js/tryon.js 的 tryonNailShapeWidthProfile/tryonNailShapePoints/tryonBilinearQuad
// 完全同样的算法，这里拷贝一份只是为了在框图时实时预览形状蒙版会裁成什么样子，
// 方便管理员照着这个轮廓去调整四个角点，让框跟指甲真实边缘对得更准。
function tryonEditorShapeWidthProfile(shapeKey) {
  const W0 = 0.46;
  switch (shapeKey) {
    case 'round':
      return (t) => (t <= 0.7 ? W0 : W0 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.7) / 0.3, 2))));
    case 'oval':
      return (t) => (t <= 0.5 ? W0 : W0 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.5) / 0.5, 2))));
    case 'almond':
      return (t) => (t <= 0.35 ? W0 : W0 * Math.pow(Math.max(0, 1 - (t - 0.35) / 0.65), 0.85));
    case 'stiletto':
      return (t) => (t <= 0.15 ? W0 : W0 * Math.pow(Math.max(0, 1 - (t - 0.15) / 0.85), 1.3));
    case 'coffin': {
      const taper = (t) => (t <= 0.25 ? W0 : W0 * Math.pow(Math.max(0, 1 - (t - 0.25) / 0.75), 1.0));
      const flatFrom = taper(0.88);
      return (t) => (t >= 0.88 ? flatFrom : taper(t));
    }
    case 'square':
    default:
      return () => W0;
  }
}

function tryonEditorShapePoints(shapeKey) {
  const widthFn = tryonEditorShapeWidthProfile(shapeKey);
  const N = 36;
  const left = [], right = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = widthFn(t);
    left.push([0.5 - w, t]);
    right.push([0.5 + w, t]);
  }
  return left.concat(right.reverse());
}

function tryonEditorBilinearQuad(u, v, quad) {
  const [tl, tr, br, bl] = quad;
  const x = (1 - u) * (1 - v) * tl[0] + u * (1 - v) * tr[0] + u * v * br[0] + (1 - u) * v * bl[0];
  const y = (1 - u) * (1 - v) * tl[1] + u * (1 - v) * tr[1] + u * v * br[1] + (1 - u) * v * bl[1];
  return [x, y];
}

let tryonEditorProdId = null;
let tryonEditorImageUrl = null;
let tryonEditorImagesList = [];
let tryonEditorImg = null;
let tryonEditorQuads = {};
let tryonEditorCutouts = {}; // { finger: 抠图结果PNG的公开链接 } —— 方案C：浏览器端AI自动抠图
let tryonEditorNailShape = 'square'; // 指甲形状蒙版，见 sql/add_tryon_nail_shape.sql
let tryonEditorNailShapeFlip = false;
let tryonEditorActiveFinger = 'thumb';
let tryonEditorCanvasEl = null;
let tryonEditorCtx = null;
let tryonEditorDrag = null;
let tryonEditorBgRemovalFn = null; // 缓存动态加载的AI抠图函数，避免重复加载模型

function tryonEditorBuildModal() {
  let modal = document.getElementById('modal-tryon-editor');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'modal-tryon-editor';
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b pb-3">
        <h3 class="text-base font-bold text-gray-900">虚拟试戴 · 指甲框图 — <span id="tryon-editor-prod-id" class="text-stone-700 font-mono"></span></h3>
        <button onclick="closeTryonEditorModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>

      <div class="text-xs text-gray-500 bg-stone-50 border border-stone-200 rounded-lg p-3 leading-relaxed">
        1. 先选一张"整卡"参考图片；2. 依次点开下面每根手指的标签，把彩色方框的四个角点拖到那根手指对应的指甲区域上（可以自由旋转/变形，不需要是正方形）；3. 方框内部可以整体拖动移动位置；4. 五根手指不需要全部框完才能保存，没框的手指试戴时会自动用整张商品图代替。
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1.5">参考图片（框图用的"整卡"照片）</label>
        <div id="tryon-editor-image-picker" class="flex gap-2 flex-wrap"></div>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1.5">选择要框的手指</label>
        <div id="tryon-editor-finger-tabs" class="flex gap-2 flex-wrap"></div>
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1.5">这批指甲大概是什么形状？（贴图时会按这个形状裁掉方框四个角，画布上会实时预览轮廓，照着调整角点即可）</label>
        <div id="tryon-editor-shape-picker" class="flex gap-2 flex-wrap items-center"></div>
      </div>

      <div class="border rounded-lg overflow-hidden bg-stone-100 flex justify-center">
        <canvas id="tryon-editor-canvas" style="touch-action:none; cursor:crosshair; max-width:100%;"></canvas>
      </div>

      <div class="flex items-center gap-3 flex-wrap bg-stone-50 border border-stone-200 rounded-lg p-3">
        <button onclick="runTryonEditorCutout()" id="tryon-editor-cutout-btn" class="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm">
          <i class="fa-solid fa-wand-magic-sparkles"></i> AI自动抠图
        </button>
        <button onclick="runTryonEditorColorCutout()" id="tryon-editor-colorcut-btn" class="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm">
          <i class="fa-solid fa-droplet"></i> 按颜色去背景
        </button>
        <button onclick="openTryonEditorTouchup()" id="tryon-editor-touchup-btn" class="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm">
          <i class="fa-solid fa-paintbrush"></i> 手动精修
        </button>
        <button onclick="clearTryonEditorCutout()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold border border-stone-300">
          清除当前手指的抠图
        </button>
        <img id="tryon-editor-cutout-preview" class="hidden h-12 w-12 object-contain border rounded" style="background-image:repeating-conic-gradient(#ddd 0 25%, #fff 0 50%); background-size:10px 10px;" alt="抠图预览">
        <span id="tryon-editor-cutout-status" class="text-xs text-gray-500"></span>
        <span class="text-[11px] text-gray-400 w-full">"AI自动抠图"和"按颜色去背景"碰到参考图是实拍手部照片（背景是皮肤/卡片，不是干净纯色）时，经常识别不准——要么把图案本身当成背景抠掉，要么连指甲周围的背景一起留下来、位置方向也会跟着跑偏。这种情况最可靠的是点"手动精修"，自己用画笔沿着指甲的真实边缘把背景手动擦掉（如果已经跑过AI或颜色方法，会在那个结果基础上继续修，不用从头来）。效果都不满意可以点"清除当前手指的抠图"退回矩形框图方案。</span>
      </div>

      <div class="flex justify-between items-center pt-2 border-t">
        <button onclick="resetTryonEditorFinger()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold border border-stone-300">
          <i class="fa-solid fa-rotate-left"></i> 重置当前手指的框
        </button>
        <div class="flex gap-3">
          <button onclick="closeTryonEditorModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">取消</button>
          <button onclick="saveTryonEditorConfig()" id="tryon-editor-save-btn" class="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-sm">保存框图</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

async function openTryonEditorModal(prodId) {
  const item = (typeof lastLoadedProducts !== 'undefined' ? lastLoadedProducts : []).find(p => p.id === prodId);
  if (!item) return;

  tryonEditorBuildModal();

  tryonEditorProdId = prodId;
  tryonEditorActiveFinger = 'thumb';
  tryonEditorDrag = null;

  // 深拷贝已有配置，避免中途取消时把改动残留到列表缓存里
  let existingQuads = {};
  const raw = item.tryon_nail_quads;
  if (raw) {
    try {
      existingQuads = JSON.parse(JSON.stringify(typeof raw === 'string' ? JSON.parse(raw) : raw));
    } catch (e) { existingQuads = {}; }
  }
  tryonEditorQuads = existingQuads || {};

  let existingCutouts = {};
  const rawCutouts = item.tryon_nail_cutouts;
  if (rawCutouts) {
    try {
      existingCutouts = JSON.parse(JSON.stringify(typeof rawCutouts === 'string' ? JSON.parse(rawCutouts) : rawCutouts));
    } catch (e) { existingCutouts = {}; }
  }
  tryonEditorCutouts = existingCutouts || {};
  tryonEditorNailShape = item.tryon_nail_shape || 'square';
  tryonEditorNailShapeFlip = !!item.tryon_nail_shape_flip;

  document.getElementById('tryon-editor-prod-id').innerText = prodId;

  // 拉这个商品的所有画廊图片，供选用哪张当"整卡"参考图
  let images = [];
  try {
    const { data, error } = await supabaseClient
      .from('product_images')
      .select('*')
      .eq('product_id', prodId)
      .order('display_order', { ascending: true });
    if (!error && data) images = data.map(r => r.image_url).filter(Boolean);
  } catch (e) {
    console.warn('[tryon-editor] 加载商品图片失败:', e);
  }
  if (images.length === 0 && item.spin_image) images = [item.spin_image];
  tryonEditorImagesList = images;

  if (images.length === 0) {
    alert('这个商品还没有任何图片，请先在"编辑信息"里上传一张商品照片，再来框图。');
    return;
  }

  const initialUrl = (item.tryon_source_image_url && images.includes(item.tryon_source_image_url))
    ? item.tryon_source_image_url
    : images[0];

  tryonEditorCanvasEl = document.getElementById('tryon-editor-canvas');
  tryonEditorCtx = tryonEditorCanvasEl ? tryonEditorCanvasEl.getContext('2d') : null;
  if (tryonEditorCanvasEl && !tryonEditorCanvasEl.dataset.boundEvents) {
    tryonEditorCanvasEl.addEventListener('pointerdown', tryonEditorPointerDown);
    tryonEditorCanvasEl.addEventListener('pointermove', tryonEditorPointerMove);
    tryonEditorCanvasEl.addEventListener('pointerup', tryonEditorPointerUp);
    tryonEditorCanvasEl.addEventListener('pointercancel', tryonEditorPointerUp);
    tryonEditorCanvasEl.dataset.boundEvents = '1';
  }

  renderTryonEditorImagePicker();
  await selectTryonEditorImage(initialUrl);
  renderTryonEditorFingerTabs();
  renderTryonEditorCutoutPreview();
  renderTryonEditorShapePicker();

  document.getElementById('modal-tryon-editor').classList.remove('hidden');
}

function closeTryonEditorModal() {
  document.getElementById('modal-tryon-editor')?.classList.add('hidden');
  tryonEditorDrag = null;
}

function renderTryonEditorImagePicker() {
  const wrap = document.getElementById('tryon-editor-image-picker');
  if (!wrap) return;
  wrap.innerHTML = tryonEditorImagesList.map((url, i) => `
    <button onclick="selectTryonEditorImage(tryonEditorImagesList[${i}])" class="border-2 rounded-lg overflow-hidden ${url === tryonEditorImageUrl ? 'border-amber-600' : 'border-transparent hover:border-stone-300'}" title="用这张图框图">
      <img src="${url}" class="w-16 h-16 object-cover block">
    </button>
  `).join('');
}

function renderTryonEditorShapePicker() {
  const wrap = document.getElementById('tryon-editor-shape-picker');
  if (!wrap) return;
  const shapeBtns = TRYON_EDITOR_SHAPE_LIST.map(s => `
    <button onclick="setTryonEditorShape('${s.key}')" class="px-3 py-1.5 rounded-lg text-xs font-bold border ${s.key === tryonEditorNailShape ? 'bg-stone-900 hover:bg-stone-800 text-white border-stone-900' : 'bg-stone-100 hover:bg-stone-200 text-gray-900 border-stone-300'}">
      ${s.label}
    </button>
  `).join('');
  wrap.innerHTML = shapeBtns + `
    <label class="text-xs font-bold text-gray-500 flex items-center gap-1.5">
      <input type="checkbox" id="tryon-editor-shape-flip" onchange="toggleTryonEditorShapeFlip(this.checked)" ${tryonEditorNailShapeFlip ? 'checked' : ''}>
      翻转指甲方向
    </label>
  `;
}

function setTryonEditorShape(shapeKey) {
  tryonEditorNailShape = shapeKey;
  renderTryonEditorShapePicker();
  drawTryonEditor();
}

function toggleTryonEditorShapeFlip(checked) {
  tryonEditorNailShapeFlip = !!checked;
  drawTryonEditor();
}

function selectTryonEditorImage(url) {
  return new Promise((resolve) => {
    tryonEditorImageUrl = url;
    renderTryonEditorImagePicker();

    const finishLoad = (img) => {
      const MAX_W = 640;
      const naturalW = img.naturalWidth || img.width || 1;
      const naturalH = img.naturalHeight || img.height || 1;
      const scale = naturalW > MAX_W ? MAX_W / naturalW : 1;
      tryonEditorCanvasEl.width = Math.round(naturalW * scale);
      tryonEditorCanvasEl.height = Math.round(naturalH * scale);
      tryonEditorImg = img;
      ensureTryonEditorFingerQuad(tryonEditorActiveFinger);
      drawTryonEditor();
      resolve();
    };

    // "自动抠图"要从画布上把像素数据读出来再传给AI模型，这要求画完图的画布是"跨域许可"的
    // （浏览器安全限制：画了一张没有明确允许跨域读取的图片之后，画布会被标记为"受污染"，
    // 禁止导出像素数据，报错 "Tainted canvases may not be exported"）。所以这里先带着
    // crossOrigin 权限请求加载——Supabase 的公开图片链接默认就支持这个，正常情况下不会有影响。
    const imgCors = new Image();
    imgCors.crossOrigin = 'anonymous';
    imgCors.onload = () => finishLoad(imgCors);
    imgCors.onerror = () => {
      // 极少数图片来源不支持跨域权限加载时，退回普通加载方式——这样至少框图/预览功能
      // 还能正常用，只是这张图没法用"自动抠图"（点击时会给出明确提示，不会是浏览器报错）。
      console.warn('[tryon-editor] 带跨域权限加载参考图失败，退回普通模式（这张图的自动抠图功能将不可用）:', url);
      const imgPlain = new Image();
      imgPlain.onload = () => finishLoad(imgPlain);
      imgPlain.onerror = () => {
        console.warn('[tryon-editor] 参考图加载失败:', url);
        alert('这张参考图加载失败，换一张试试。');
        resolve();
      };
      imgPlain.src = url;
    };
    imgCors.src = url;
  });
}

function tryonEditorDefaultQuad(finger) {
  const idx = Math.max(0, TRYON_EDITOR_FINGERS.findIndex(f => f.key === finger));
  const cx = 0.14 + idx * 0.18;
  const halfW = 0.055, y0 = 0.08, y1 = 0.30;
  return [[cx - halfW, y0], [cx + halfW, y0], [cx + halfW, y1], [cx - halfW, y1]];
}

function ensureTryonEditorFingerQuad(finger) {
  if (!tryonEditorQuads[finger]) {
    tryonEditorQuads[finger] = tryonEditorDefaultQuad(finger);
  }
}

function renderTryonEditorFingerTabs() {
  const wrap = document.getElementById('tryon-editor-finger-tabs');
  if (!wrap) return;
  wrap.innerHTML = TRYON_EDITOR_FINGERS.map(f => {
    const configured = !!tryonEditorQuads[f.key];
    const hasCutout = !!tryonEditorCutouts[f.key];
    const active = f.key === tryonEditorActiveFinger;
    const color = TRYON_EDITOR_COLORS[f.key];
    const style = active
      ? `background:${color}; color:#fff; border-color:${color};`
      : `background:#fff; color:${color}; border-color:${color};`;
    const badge = hasCutout ? ' 🪄' : (configured ? ' ✓' : '');
    return `<button onclick="switchTryonEditorFinger('${f.key}')" class="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors" style="${style}">${f.label}${badge}</button>`;
  }).join('');
}

function switchTryonEditorFinger(finger) {
  tryonEditorActiveFinger = finger;
  ensureTryonEditorFingerQuad(finger);
  renderTryonEditorFingerTabs();
  renderTryonEditorCutoutPreview();
  drawTryonEditor();
}

function resetTryonEditorFinger() {
  delete tryonEditorQuads[tryonEditorActiveFinger];
  ensureTryonEditorFingerQuad(tryonEditorActiveFinger);
  renderTryonEditorFingerTabs();
  drawTryonEditor();
}

function renderTryonEditorCutoutPreview() {
  const img = document.getElementById('tryon-editor-cutout-preview');
  const statusEl = document.getElementById('tryon-editor-cutout-status');
  const url = tryonEditorCutouts[tryonEditorActiveFinger];
  if (img) {
    if (url) {
      img.src = url;
      img.classList.remove('hidden');
    } else {
      img.classList.add('hidden');
      img.src = '';
    }
  }
  if (statusEl) {
    statusEl.innerText = url ? '这根手指已有抠图，试戴会优先用它。' : '这根手指还没抠图，试戴会用矩形框图/整图代替。';
  }
}

function clearTryonEditorCutout() {
  delete tryonEditorCutouts[tryonEditorActiveFinger];
  renderTryonEditorCutoutPreview();
  renderTryonEditorFingerTabs();
}

// 方案C核心：把当前手指框出来的区域（带一点余量）从原图上裁下来，交给浏览器端AI模型
// 抠掉背景，只留下指甲图案本身（不规则轮廓、四周透明），再上传到 Supabase 拿到公开链接。
// 全程在管理员自己的浏览器里跑，不经过任何服务器，第一次用会下载一次模型文件（几MB，
// 浏览器会缓存），之后同一台电脑上用会快很多。
async function tryonEditorLoadBgRemoval() {
  if (tryonEditorBgRemovalFn) return tryonEditorBgRemovalFn;
  const mod = await import('https://esm.sh/@imgly/background-removal@1.5.8');
  tryonEditorBgRemovalFn = mod.removeBackground;
  return tryonEditorBgRemovalFn;
}

// 共用：按这根手指框出来的区域，从原始分辨率的参考图上截一块矩形裁剪画布。
// paddingRatio 控制额外留多少边（0 表示贴着框边缘裁，不留边）。
// 跟 js/tryon.js 里 tryonDrawTriangle 完全同样的三点仿射变换算法（这里单独拷贝一份，
// 避免框图工具这个文件依赖前台渲染文件，两边各自独立、互不影响）。
function tryonEditorWarpTriangle(ctx, img, srcPts, dstPts) {
  const [x0, y0] = srcPts[0], [x1, y1] = srcPts[1], [x2, y2] = srcPts[2];
  const [X0, Y0] = dstPts[0], [X1, Y1] = dstPts[1], [X2, Y2] = dstPts[2];
  const denom = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
  if (Math.abs(denom) < 1e-6) return;
  const a = (X0 * (y1 - y2) + X1 * (y2 - y0) + X2 * (y0 - y1)) / denom;
  const b = (Y0 * (y1 - y2) + Y1 * (y2 - y0) + Y2 * (y0 - y1)) / denom;
  const c = (X0 * (x2 - x1) + X1 * (x0 - x2) + X2 * (x1 - x0)) / denom;
  const d = (Y0 * (x2 - x1) + Y1 * (x0 - x2) + Y2 * (x1 - x0)) / denom;
  const e = (X0 * (x1 * y2 - x2 * y1) + X1 * (x2 * y0 - x0 * y2) + X2 * (x0 * y1 - x1 * y0)) / denom;
  const f = (Y0 * (x1 * y2 - x2 * y1) + Y1 * (x2 * y0 - x0 * y2) + Y2 * (x0 * y1 - x1 * y0)) / denom;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dstPts[0][0], dstPts[0][1]);
  ctx.lineTo(dstPts[1][0], dstPts[1][1]);
  ctx.lineTo(dstPts[2][0], dstPts[2][1]);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

// 重要修正：框出来的框可以是任意旋转/倾斜的四边形（不是"正着摆"的矩形），之前这里直接按
// 四个角点的最小/最大坐标截一个"正的"矩形出来——框一旦是斜的，这个矩形就会比实际框大一圈、
// 还带着别的东西（这就是"选框外的部分也被选中"的原因），而且抠图结果当成"一张普通矩形图"
// 贴回手模型时，也丢失了原来框的旋转角度，导致贴歪、贴偏（这就是"方向/位置不对"的原因）。
//
// 现在改成：用跟框图裁剪同样的仿射变换，把这个四边形本身"拉直"成一张方方正正的矩形图
// （四个角点严格对应框的四个角，不多不少），抠图在这张拉直后的图上做；之后试戴贴图时，
// 把这张矩形图当"普通设计图"贴到手模对应的框里，效果就会跟矩形框图方案的贴合角度完全一致。
// paddingRatio 控制整体按四边形自己的中心放大一点点（不是简单扩大外接矩形），留一点点边给
// AI 一点上下文，又不会把框外的东西牵连进来。
function tryonEditorCropToCanvas(quadFrac, paddingRatio) {
  const naturalW = tryonEditorImg.naturalWidth || tryonEditorImg.width;
  const naturalH = tryonEditorImg.naturalHeight || tryonEditorImg.height;
  const srcQuad = quadFrac.map(([fx, fy]) => [fx * naturalW, fy * naturalH]);

  const cx = (srcQuad[0][0] + srcQuad[1][0] + srcQuad[2][0] + srcQuad[3][0]) / 4;
  const cy = (srcQuad[0][1] + srcQuad[1][1] + srcQuad[2][1] + srcQuad[3][1]) / 4;
  const expanded = srcQuad.map(([x, y]) => [cx + (x - cx) * (1 + paddingRatio), cy + (y - cy) * (1 + paddingRatio)]);

  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const outW = Math.max(8, Math.round((dist(expanded[0], expanded[1]) + dist(expanded[3], expanded[2])) / 2));
  const outH = Math.max(8, Math.round((dist(expanded[0], expanded[3]) + dist(expanded[1], expanded[2])) / 2));
  const dstQuad = [[0, 0], [outW, 0], [outW, outH], [0, outH]];

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = outW;
  cropCanvas.height = outH;
  const ctx = cropCanvas.getContext('2d');
  tryonEditorWarpTriangle(ctx, tryonEditorImg, [expanded[0], expanded[1], expanded[2]], [dstQuad[0], dstQuad[1], dstQuad[2]]);
  tryonEditorWarpTriangle(ctx, tryonEditorImg, [expanded[0], expanded[2], expanded[3]], [dstQuad[0], dstQuad[2], dstQuad[3]]);
  return cropCanvas;
}

// 共用：把抠图/去背景的结果上传到 Supabase（跟商品图片同一个 bucket），存到这根手指名下
async function tryonEditorUploadCutout(finger, blob, methodTag) {
  const fileName = `tryon_cutout_${methodTag}_${tryonEditorProdId}_${finger}_${Date.now()}.png`;
  const { error: uploadError } = await supabaseClient.storage
    .from('product-media')
    .upload(fileName, blob, { contentType: 'image/png', upsert: true });
  if (uploadError) throw uploadError;
  const { data: publicUrlData } = supabaseClient.storage.from('product-media').getPublicUrl(fileName);
  tryonEditorCutouts[finger] = publicUrlData.publicUrl;
  renderTryonEditorCutoutPreview();
  renderTryonEditorFingerTabs();
}

async function runTryonEditorCutout() {
  const finger = tryonEditorActiveFinger;
  const quad = tryonEditorQuads[finger];
  if (!quad || !tryonEditorImg) {
    alert('先把这根手指的框拖到指甲位置上，再做自动抠图。');
    return;
  }
  if (!tryonEditorImg.crossOrigin) {
    alert('这张参考图片不支持跨域读取，暂时没法自动抠图。换一张参考图片试试，或者继续用矩形框图方案。');
    return;
  }

  const btn = document.getElementById('tryon-editor-cutout-btn');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  const statusEl = document.getElementById('tryon-editor-cutout-status');

  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '处理中…（第一次用要下载AI模型，稍等几秒到几十秒）'; }
    if (statusEl) statusEl.innerText = '';

    // 留一点点边（6%）给AI模型一点点上下文，但不留太多——留太多卡片背景反而容易让它
    // 把指甲图案本身也误判成"背景"的一部分（尤其是卡片底色和图案颜色深浅接近的时候）。
    const cropCanvas = tryonEditorCropToCanvas(quad, 0.06);
    const removeBackground = await tryonEditorLoadBgRemoval();
    const cropBlob = await new Promise(resolve => cropCanvas.toBlob(resolve, 'image/png'));
    const resultBlob = await removeBackground(cropBlob);
    await tryonEditorUploadCutout(finger, resultBlob, 'ai');
  } catch (err) {
    console.error('[tryon-editor] 自动抠图失败:', err);
    alert('自动抠图失败：' + (err && err.message ? err.message : err) + '\n\n常见原因是网络问题导致AI模型下载失败。这根手指会继续用矩形框图方案，不影响其它手指，也可以稍后重试，或者试试旁边的"按颜色去背景"。');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalBtnHtml; }
  }
}

// "按颜色去背景"：不用AI，纯色值判断——从裁剪区域最外面一圈像素采样出"卡片底色"
// （取中位数，比平均值更不容易被角落里混进来的一点点指甲图案带偏），然后把跟这个颜色
// 相近的像素都变透明，中间留一个过渡带做羽化，避免生硬的锯齿边。
// 这是经典计算机视觉的"色度抠图"思路，不依赖AI判断"什么是前景/背景"，所以碰到卡片底色
// 和指甲图案深浅接近、AI容易把图案本身也当成背景抠掉的情况，这个方法反而更可靠——
// 代价是如果卡片底色本身不均匀（比如有渐变、反光），效果会打折扣，两个工具可以都试试看。
function tryonEditorColorCutoutProcess(cropCanvas) {
  const w = cropCanvas.width, h = cropCanvas.height;
  const ctx = cropCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const borderSamples = [];
  const margin = Math.max(1, Math.round(Math.min(w, h) * 0.04));
  for (let x = 0; x < w; x++) {
    for (let t = 0; t < margin; t++) {
      let i = (t * w + x) * 4;
      borderSamples.push([data[i], data[i + 1], data[i + 2]]);
      i = ((h - 1 - t) * w + x) * 4;
      borderSamples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let t = 0; t < margin; t++) {
      let i = (y * w + t) * 4;
      borderSamples.push([data[i], data[i + 1], data[i + 2]]);
      i = (y * w + (w - 1 - t)) * 4;
      borderSamples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const median = (arr) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const bgR = median(borderSamples.map(s => s[0]));
  const bgG = median(borderSamples.map(s => s[1]));
  const bgB = median(borderSamples.map(s => s[2]));

  const THRESHOLD = 42; // 容差：越大，去掉的颜色范围越宽
  const FEATHER = 24;   // 羽化宽度：透明到不透明之间的柔和过渡
  for (let p = 0; p < data.length; p += 4) {
    const dr = data[p] - bgR, dg = data[p + 1] - bgG, db = data[p + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    let alpha;
    if (dist <= THRESHOLD) alpha = 0;
    else if (dist >= THRESHOLD + FEATHER) alpha = 255;
    else alpha = Math.round(((dist - THRESHOLD) / FEATHER) * 255);
    data[p + 3] = Math.min(data[p + 3], alpha);
  }
  ctx.putImageData(imageData, 0, 0);
}

async function runTryonEditorColorCutout() {
  const finger = tryonEditorActiveFinger;
  const quad = tryonEditorQuads[finger];
  if (!quad || !tryonEditorImg) {
    alert('先把这根手指的框拖到指甲位置上，再做去背景。');
    return;
  }
  if (!tryonEditorImg.crossOrigin) {
    alert('这张参考图片不支持跨域读取，暂时没法去背景。换一张参考图片试试，或者继续用矩形框图方案。');
    return;
  }

  const btn = document.getElementById('tryon-editor-colorcut-btn');
  const originalBtnHtml = btn ? btn.innerHTML : '';

  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '处理中…'; }

    // 按颜色去背景不需要留边——留边只会把更多卡片底色框进来，贴着框边缘裁，
    // 让采样到的"卡片底色"更准
    const cropCanvas = tryonEditorCropToCanvas(quad, 0);
    tryonEditorColorCutoutProcess(cropCanvas);
    const resultBlob = await new Promise(resolve => cropCanvas.toBlob(resolve, 'image/png'));
    await tryonEditorUploadCutout(finger, resultBlob, 'color');
  } catch (err) {
    console.error('[tryon-editor] 按颜色去背景失败:', err);
    alert('按颜色去背景失败：' + (err && err.message ? err.message : err));
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalBtnHtml; }
  }
}

// 共用：带跨域权限加载一张图片（手动精修要把已有抠图结果画到画布上继续编辑，
// 编辑完还要导出成 PNG，这两步都要求图片是带跨域许可加载的，否则画布会被"污染"，
// 导出时报错，参见 selectTryonEditorImage 里同样的说明）。
function tryonEditorLoadImageCORS(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// 方案E：手动精修——AI 和按颜色两种自动抠图本质上都是在"猜"哪里是背景、哪里是指甲，
// 碰到参考图是实拍手部照片（背景是皮肤、反光、阴影，不是干净的纯色卡片）时，这两种猜测
// 都容易出错：要么把图案误判成背景抠掉，要么背景没抠干净、位置方向也跟着错。
// 手动精修彻底绕开"猜"——管理员直接用画笔沿着指甲的真实边缘手动擦除背景，擦多少、
// 擦哪里完全由人眼判断，不依赖任何算法，所以不管参考图多复杂都能做到完全准确。
let tryonEditorTouchup = null;

function tryonEditorBuildTouchupOverlay() {
  let overlay = document.getElementById('tryon-touchup-overlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'tryon-touchup-overlay';
  overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden';
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b pb-3">
        <h3 class="text-base font-bold text-gray-900">手动精修抠图 — <span id="tryon-touchup-finger-label" class="text-stone-700"></span></h3>
        <button onclick="closeTryonEditorTouchup()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>

      <div class="text-xs text-gray-500 bg-stone-50 border border-stone-200 rounded-lg p-3 leading-relaxed">
        用"擦除刷"沿着指甲的真实边缘，把外面的背景（卡片/皮肤）手动涂掉；涂多了用"恢复刷"找回来，或者点"撤销"。指甲内部的图案不用管，保持不透明就行，只需要处理最外面那一圈边缘。
      </div>

      <div class="flex items-center gap-3 flex-wrap bg-stone-50 border border-stone-200 rounded-lg p-3">
        <button id="tryon-touchup-mode-erase" onclick="setTryonTouchupMode('erase')" class="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm">
          <i class="fa-solid fa-eraser"></i> 擦除刷
        </button>
        <button id="tryon-touchup-mode-restore" onclick="setTryonTouchupMode('restore')" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold border border-stone-300">
          <i class="fa-solid fa-paintbrush"></i> 恢复刷
        </button>
        <label class="text-xs font-bold text-gray-500 flex items-center gap-2">
          笔刷大小
          <input id="tryon-touchup-size" type="range" min="4" max="60" value="16" oninput="tryonEditorTouchup && (tryonEditorTouchup.brushSize = parseInt(this.value,10))">
        </label>
        <button onclick="undoTryonTouchup()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold border border-stone-300">
          <i class="fa-solid fa-rotate-left"></i> 撤销
        </button>
        <button onclick="resetTryonTouchup()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold border border-stone-300">
          重置为原图
        </button>
      </div>

      <div class="border rounded-lg overflow-hidden bg-stone-100 flex justify-center">
        <canvas id="tryon-touchup-canvas" style="touch-action:none; cursor:crosshair; max-width:100%; background-image:repeating-conic-gradient(#ddd 0 25%, #fff 0 50%); background-size:16px 16px;"></canvas>
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t">
        <button onclick="closeTryonEditorTouchup()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">取消</button>
        <button onclick="saveTryonEditorTouchup()" id="tryon-touchup-save-btn" class="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-sm">完成并保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const canvasEl = overlay.querySelector('#tryon-touchup-canvas');
  canvasEl.addEventListener('pointerdown', tryonTouchupPointerDown);
  canvasEl.addEventListener('pointermove', tryonTouchupPointerMove);
  canvasEl.addEventListener('pointerup', tryonTouchupPointerUp);
  canvasEl.addEventListener('pointercancel', tryonTouchupPointerUp);
  return overlay;
}

async function openTryonEditorTouchup() {
  const finger = tryonEditorActiveFinger;
  const quad = tryonEditorQuads[finger];
  if (!quad || !tryonEditorImg) {
    alert('先把这根手指的框拖到指甲位置上，再做手动精修。');
    return;
  }
  if (!tryonEditorImg.crossOrigin) {
    alert('这张参考图片不支持跨域读取，暂时没法手动精修导出结果。换一张参考图片试试，或者继续用矩形框图方案。');
    return;
  }

  tryonEditorBuildTouchupOverlay();

  // 留一点点边（15%），方便管理员看清指甲真实边缘在哪里再动手擦——这圈边会在管理员
  // 自己擦除背景的过程中被清理掉，不会残留在最终结果里。
  const workCanvas = tryonEditorCropToCanvas(quad, 0.15);
  const w = workCanvas.width, h = workCanvas.height;

  const canvasEl = document.getElementById('tryon-touchup-canvas');
  canvasEl.width = w;
  canvasEl.height = h;
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // 如果这根手指已经跑过AI或按颜色抠图，就在那个结果基础上继续手动修，不用从零开始擦
  // 一整圈背景；加载失败（比如链接已经失效）就从没处理过的干净原图开始。
  const existingUrl = tryonEditorCutouts[finger];
  let startedFromExisting = false;
  if (existingUrl) {
    try {
      const existingImg = await tryonEditorLoadImageCORS(existingUrl);
      ctx.drawImage(existingImg, 0, 0, w, h);
      startedFromExisting = true;
    } catch (e) {
      console.warn('[tryon-editor] 加载已有抠图失败，手动精修将从原图开始:', e);
    }
  }
  if (!startedFromExisting) {
    ctx.drawImage(workCanvas, 0, 0);
  }

  tryonEditorTouchup = {
    finger,
    workCanvas,
    canvasEl,
    ctx,
    mode: 'erase',
    brushSize: 16,
    painting: false,
    lastPos: null,
    history: []
  };

  document.getElementById('tryon-touchup-finger-label').innerText =
    (TRYON_EDITOR_FINGERS.find(f => f.key === finger) || {}).label || finger;
  document.getElementById('tryon-touchup-size').value = '16';
  setTryonTouchupMode('erase');

  document.getElementById('tryon-touchup-overlay').classList.remove('hidden');
}

function closeTryonEditorTouchup() {
  document.getElementById('tryon-touchup-overlay')?.classList.add('hidden');
  tryonEditorTouchup = null;
}

function setTryonTouchupMode(mode) {
  if (!tryonEditorTouchup) return;
  tryonEditorTouchup.mode = mode;
  const eraseBtn = document.getElementById('tryon-touchup-mode-erase');
  const restoreBtn = document.getElementById('tryon-touchup-mode-restore');
  const activeCls = 'px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm';
  const inactiveCls = 'px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold border border-stone-300';
  if (eraseBtn) eraseBtn.className = mode === 'erase' ? activeCls : inactiveCls;
  if (restoreBtn) restoreBtn.className = mode === 'restore' ? activeCls : inactiveCls;
}

// 在画布某一点"盖一个笔刷印章"：擦除刷用 destination-out 直接把这个圆形区域的透明度
// 清零（不管原来是什么颜色）；恢复刷反过来，从干净的原图 workCanvas 里把这个圆形区域
// 的像素（包括透明度）原样找回来。
function tryonTouchupStampAt(x, y) {
  const t = tryonEditorTouchup;
  if (!t) return;
  const r = t.brushSize;
  t.ctx.save();
  t.ctx.beginPath();
  t.ctx.arc(x, y, r, 0, Math.PI * 2);
  if (t.mode === 'erase') {
    t.ctx.globalCompositeOperation = 'destination-out';
    t.ctx.fill();
  } else {
    t.ctx.clip();
    t.ctx.drawImage(t.workCanvas, 0, 0);
  }
  t.ctx.restore();
}

// 鼠标/手指移动较快时，两次 pointermove 之间间隔的距离可能比笔刷半径还大，只在端点盖
// 印章会留下一串孤立的圆点、中间漏掉——这里沿线补齐，保证画出来是连续的一条笔触。
function tryonTouchupStampLine(x0, y0, x1, y1) {
  const t = tryonEditorTouchup;
  if (!t) return;
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const step = Math.max(1, t.brushSize / 3);
  const steps = Math.max(1, Math.ceil(dist / step));
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    tryonTouchupStampAt(x0 + (x1 - x0) * p, y0 + (y1 - y0) * p);
  }
}

function tryonTouchupGetPos(e) {
  const canvasEl = tryonEditorTouchup.canvasEl;
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = canvasEl.width / rect.width;
  const scaleY = canvasEl.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function tryonTouchupPushHistory() {
  const t = tryonEditorTouchup;
  if (!t) return;
  t.history.push(t.ctx.getImageData(0, 0, t.canvasEl.width, t.canvasEl.height));
  if (t.history.length > 20) t.history.shift(); // 限制撤销步数，避免占用太多内存
}

function tryonTouchupPointerDown(e) {
  if (!tryonEditorTouchup) return;
  e.preventDefault();
  tryonTouchupPushHistory();
  const pos = tryonTouchupGetPos(e);
  tryonTouchupStampAt(pos.x, pos.y);
  tryonEditorTouchup.lastPos = pos;
  tryonEditorTouchup.painting = true;
  tryonEditorTouchup.canvasEl.setPointerCapture(e.pointerId);
}

function tryonTouchupPointerMove(e) {
  if (!tryonEditorTouchup || !tryonEditorTouchup.painting) return;
  e.preventDefault();
  const pos = tryonTouchupGetPos(e);
  const last = tryonEditorTouchup.lastPos;
  tryonTouchupStampLine(last.x, last.y, pos.x, pos.y);
  tryonEditorTouchup.lastPos = pos;
}

function tryonTouchupPointerUp() {
  if (tryonEditorTouchup) tryonEditorTouchup.painting = false;
}

function undoTryonTouchup() {
  const t = tryonEditorTouchup;
  if (!t || t.history.length === 0) return;
  t.ctx.putImageData(t.history.pop(), 0, 0);
}

function resetTryonTouchup() {
  const t = tryonEditorTouchup;
  if (!t) return;
  tryonTouchupPushHistory();
  t.ctx.clearRect(0, 0, t.canvasEl.width, t.canvasEl.height);
  t.ctx.drawImage(t.workCanvas, 0, 0);
}

async function saveTryonEditorTouchup() {
  const t = tryonEditorTouchup;
  if (!t) return;
  const saveBtn = document.getElementById('tryon-touchup-save-btn');
  try {
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = '保存中...'; }
    const blob = await new Promise(resolve => t.canvasEl.toBlob(resolve, 'image/png'));
    await tryonEditorUploadCutout(t.finger, blob, 'manual');
    closeTryonEditorTouchup();
  } catch (err) {
    console.error('[tryon-editor] 手动精修保存失败:', err);
    alert('保存失败：' + (err && err.message ? err.message : err));
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = '完成并保存'; }
  }
}

function drawTryonEditor() {
  if (!tryonEditorCtx || !tryonEditorImg) return;
  const w = tryonEditorCanvasEl.width, h = tryonEditorCanvasEl.height;
  tryonEditorCtx.clearRect(0, 0, w, h);
  tryonEditorCtx.drawImage(tryonEditorImg, 0, 0, w, h);

  TRYON_EDITOR_FINGERS.forEach(f => {
    const quad = tryonEditorQuads[f.key];
    if (!quad) return;
    const pxQuad = quad.map(([fx, fy]) => [fx * w, fy * h]);
    const isActive = f.key === tryonEditorActiveFinger;
    const color = TRYON_EDITOR_COLORS[f.key];

    tryonEditorCtx.save();
    tryonEditorCtx.beginPath();
    pxQuad.forEach(([x, y], i) => (i === 0 ? tryonEditorCtx.moveTo(x, y) : tryonEditorCtx.lineTo(x, y)));
    tryonEditorCtx.closePath();
    tryonEditorCtx.lineWidth = isActive ? 3 : 1.5;
    tryonEditorCtx.strokeStyle = color;
    tryonEditorCtx.globalAlpha = isActive ? 0.95 : 0.5;
    tryonEditorCtx.stroke();
    if (isActive) {
      tryonEditorCtx.globalAlpha = 0.16;
      tryonEditorCtx.fillStyle = color;
      tryonEditorCtx.fill();
    }
    tryonEditorCtx.restore();

    if (isActive) {
      // 预览一下这个形状蒙版实际会裁成什么样子——虚线画在框内部，方便管理员照着
      // 这个轮廓去调整四个角点，让框跟指甲真实边缘对得更准，而不是凭感觉瞎调。
      const shapePts = tryonEditorShapePoints(tryonEditorNailShape);
      tryonEditorCtx.save();
      tryonEditorCtx.beginPath();
      shapePts.forEach(([u, vRaw], i) => {
        const v = tryonEditorNailShapeFlip ? 1 - vRaw : vRaw;
        const [px, py] = tryonEditorBilinearQuad(u, v, pxQuad);
        if (i === 0) tryonEditorCtx.moveTo(px, py); else tryonEditorCtx.lineTo(px, py);
      });
      tryonEditorCtx.closePath();
      tryonEditorCtx.setLineDash([4, 3]);
      tryonEditorCtx.lineWidth = 1.5;
      tryonEditorCtx.strokeStyle = '#ffffff';
      tryonEditorCtx.stroke();
      tryonEditorCtx.restore();

      pxQuad.forEach(([x, y]) => {
        tryonEditorCtx.beginPath();
        tryonEditorCtx.arc(x, y, 8, 0, Math.PI * 2);
        tryonEditorCtx.fillStyle = '#fff';
        tryonEditorCtx.fill();
        tryonEditorCtx.lineWidth = 2;
        tryonEditorCtx.strokeStyle = color;
        tryonEditorCtx.stroke();
      });
    }
  });
}

function tryonEditorGetPos(e) {
  const rect = tryonEditorCanvasEl.getBoundingClientRect();
  const scaleX = tryonEditorCanvasEl.width / rect.width;
  const scaleY = tryonEditorCanvasEl.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function tryonEditorClamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function tryonEditorPointInPolygon(pos, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > pos.y) !== (yj > pos.y)) && (pos.x < (xj - xi) * (pos.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function tryonEditorPointerDown(e) {
  if (!tryonEditorImg) return;
  const pos = tryonEditorGetPos(e);
  const finger = tryonEditorActiveFinger;
  const quad = tryonEditorQuads[finger];
  if (!quad) return;
  const w = tryonEditorCanvasEl.width, h = tryonEditorCanvasEl.height;
  const pxQuad = quad.map(([fx, fy]) => [fx * w, fy * h]);
  const HIT_R = 16;

  for (let i = 0; i < 4; i++) {
    const [px, py] = pxQuad[i];
    if (Math.hypot(pos.x - px, pos.y - py) <= HIT_R) {
      tryonEditorDrag = { mode: 'corner', index: i };
      tryonEditorCanvasEl.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
  }

  if (tryonEditorPointInPolygon(pos, pxQuad)) {
    tryonEditorDrag = { mode: 'move', lastX: pos.x, lastY: pos.y };
    tryonEditorCanvasEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
}

function tryonEditorPointerMove(e) {
  if (!tryonEditorDrag) return;
  e.preventDefault();
  const pos = tryonEditorGetPos(e);
  const finger = tryonEditorActiveFinger;
  const quad = tryonEditorQuads[finger];
  if (!quad) return;
  const w = tryonEditorCanvasEl.width, h = tryonEditorCanvasEl.height;

  if (tryonEditorDrag.mode === 'corner') {
    const fx = tryonEditorClamp01(pos.x / w);
    const fy = tryonEditorClamp01(pos.y / h);
    quad[tryonEditorDrag.index] = [fx, fy];
  } else if (tryonEditorDrag.mode === 'move') {
    const dx = (pos.x - tryonEditorDrag.lastX) / w;
    const dy = (pos.y - tryonEditorDrag.lastY) / h;
    const newQuad = quad.map(([fx, fy]) => [fx + dx, fy + dy]);
    if (newQuad.every(([fx, fy]) => fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
      tryonEditorQuads[finger] = newQuad;
    }
    tryonEditorDrag.lastX = pos.x;
    tryonEditorDrag.lastY = pos.y;
  }
  drawTryonEditor();
}

function tryonEditorPointerUp() {
  tryonEditorDrag = null;
}

async function saveTryonEditorConfig() {
  if (!tryonEditorProdId) return;
  const saveBtn = document.getElementById('tryon-editor-save-btn');
  const configuredCount = TRYON_EDITOR_FINGERS.filter(f => tryonEditorQuads[f.key]).length;

  if (configuredCount < TRYON_EDITOR_FINGERS.length) {
    const proceed = confirm(`还有 ${TRYON_EDITOR_FINGERS.length - configuredCount} 根手指没有框图，没框的手指试戴时会自动用整张商品图代替（效果比较粗糙）。确定现在保存吗？`);
    if (!proceed) return;
  }

  try {
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = '保存中...'; }
    const { error } = await supabaseClient
      .from('products')
      .update({
        tryon_source_image_url: tryonEditorImageUrl,
        tryon_nail_quads: tryonEditorQuads,
        tryon_nail_cutouts: tryonEditorCutouts,
        tryon_nail_shape: tryonEditorNailShape,
        tryon_nail_shape_flip: tryonEditorNailShapeFlip
      })
      .eq('id', tryonEditorProdId);
    if (error) throw error;

    if (typeof logAdminActivity === 'function') {
      logAdminActivity('product_update_tryon_quads', `id: ${tryonEditorProdId}`);
      if (typeof loadAdminActivityLog === 'function') loadAdminActivityLog();
    }

    alert('试戴框图保存成功！');
    closeTryonEditorModal();
    if (typeof loadAdminProducts === 'function') loadAdminProducts();
  } catch (err) {
    console.error('保存试戴框图失败:', err);
    alert('保存失败：' + err.message);
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = '保存框图'; }
  }
}
