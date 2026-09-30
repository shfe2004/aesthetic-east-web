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

let tryonEditorProdId = null;
let tryonEditorImageUrl = null;
let tryonEditorImagesList = [];
let tryonEditorImg = null;
let tryonEditorQuads = {};
let tryonEditorActiveFinger = 'thumb';
let tryonEditorCanvasEl = null;
let tryonEditorCtx = null;
let tryonEditorDrag = null;

function tryonEditorBuildModal() {
  let modal = document.getElementById('modal-tryon-editor');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'modal-tryon-editor';
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
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

      <div class="border rounded-lg overflow-hidden bg-stone-100 flex justify-center">
        <canvas id="tryon-editor-canvas" style="touch-action:none; cursor:crosshair; max-width:100%;"></canvas>
      </div>

      <div class="flex justify-between items-center pt-2 border-t">
        <button onclick="resetTryonEditorFinger()" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold border border-gray-300">
          <i class="fa-solid fa-rotate-left"></i> 重置当前手指的框
        </button>
        <div class="flex gap-3">
          <button onclick="closeTryonEditorModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">取消</button>
          <button onclick="saveTryonEditorConfig()" id="tryon-editor-save-btn" class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm">保存框图</button>
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
      <img src="${url}" class="w-14 h-14 object-cover block">
    </button>
  `).join('');
}

function selectTryonEditorImage(url) {
  return new Promise((resolve) => {
    tryonEditorImageUrl = url;
    renderTryonEditorImagePicker();
    const img = new Image();
    img.onload = () => {
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
    img.onerror = () => {
      console.warn('[tryon-editor] 参考图加载失败:', url);
      alert('这张参考图加载失败，换一张试试。');
      resolve();
    };
    img.src = url;
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
    const active = f.key === tryonEditorActiveFinger;
    const color = TRYON_EDITOR_COLORS[f.key];
    const style = active
      ? `background:${color}; color:#fff; border-color:${color};`
      : `background:#fff; color:${color}; border-color:${color};`;
    return `<button onclick="switchTryonEditorFinger('${f.key}')" class="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors" style="${style}">${f.label}${configured ? ' ✓' : ''}</button>`;
  }).join('');
}

function switchTryonEditorFinger(finger) {
  tryonEditorActiveFinger = finger;
  ensureTryonEditorFingerQuad(finger);
  renderTryonEditorFingerTabs();
  drawTryonEditor();
}

function resetTryonEditorFinger() {
  delete tryonEditorQuads[tryonEditorActiveFinger];
  ensureTryonEditorFingerQuad(tryonEditorActiveFinger);
  renderTryonEditorFingerTabs();
  drawTryonEditor();
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
      .update({ tryon_source_image_url: tryonEditorImageUrl, tryon_nail_quads: tryonEditorQuads })
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
