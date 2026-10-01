// js/tryon-hand-calibrator.js
// 虚拟试戴 · 手模型指甲位置标定工具
//
// 跟 js/tryon-editor.js（给每个商品框"要用哪一块指甲图案"）是两件不同的事：这个工具管的是
// "贴图框在手模型照片上应该画在哪、多大、什么角度"——也就是手模型本身的5个指甲位置坐标
// （js/tryon-config.js 的 TRYON_NAIL_ZONES），这是全站共用的一份坐标，不是每个商品单独配置。
//
// 之前这份坐标是人工估算的，不够精确，所以贴上去的指甲长短/宽窄/方向经常跟手模型照片里
// 真实的指甲对不上。这个工具让管理员可以直接在手模型照片上拖动调整5个框，精确对齐真实
// 指甲的位置、大小、角度，保存后前台立刻生效（存在 site_settings.tryon_hand_zones，见
// sql/add_tryon_hand_zones_column.sql），不需要改代码、不需要重新发布。
//
// 坐标存储：跟商品框图工具一样，统一存成相对手模型原图宽高的 0~1 比例坐标。

const TRYON_CALIB_FINGERS = [
  { key: 'thumb', label: '拇指' },
  { key: 'index', label: '食指' },
  { key: 'middle', label: '中指' },
  { key: 'ring', label: '无名指' },
  { key: 'pinky', label: '小指' }
];

const TRYON_CALIB_COLORS = {
  thumb: '#e74c3c',
  index: '#2ecc71',
  middle: '#3498db',
  ring: '#f1c40f',
  pinky: '#9b59b6'
};

let tryonCalibZones = {}; // { finger: [[fx,fy]x4] }，0~1比例坐标
let tryonCalibActiveFinger = 'thumb';
let tryonCalibImg = null;
let tryonCalibCanvasEl = null;
let tryonCalibCtx = null;
let tryonCalibDrag = null;

function tryonCalibBuildModal() {
  let modal = document.getElementById('modal-tryon-calibrator');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'modal-tryon-calibrator';
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b pb-3">
        <h3 class="text-base font-bold text-gray-900">虚拟试戴 · 手模型指甲位置标定</h3>
        <button onclick="closeTryonHandCalibrator()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>

      <div class="text-xs text-gray-500 bg-stone-50 border border-stone-200 rounded-lg p-3 leading-relaxed">
        这5个方框是所有商品共用的"贴图位置"，不是针对某一个商品。依次点下面的手指标签，把对应颜色的方框四个角点拖到照片里这根手指真实指甲的实际边缘上（可以自由旋转/拉伸，不需要是正方形），框内部可以整体拖动。调好之后保存，所有商品的试戴效果都会跟着更准。
      </div>

      <div>
        <label class="block text-xs font-bold text-gray-500 mb-1.5">选择要调整的手指</label>
        <div id="tryon-calib-finger-tabs" class="flex gap-2 flex-wrap"></div>
      </div>

      <div class="border rounded-lg overflow-hidden bg-stone-100 flex justify-center">
        <canvas id="tryon-calib-canvas" style="touch-action:none; cursor:crosshair; max-width:100%;"></canvas>
      </div>

      <div class="flex justify-between items-center pt-2 border-t">
        <button onclick="resetTryonCalibFinger()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold border border-stone-300">
          <i class="fa-solid fa-rotate-left"></i> 这根手指恢复默认位置
        </button>
        <div class="flex gap-3">
          <button onclick="closeTryonHandCalibrator()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">取消</button>
          <button onclick="saveTryonHandCalib()" id="tryon-calib-save-btn" class="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-sm">保存标定结果</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

// 把 js/tryon-config.js 里硬编码的默认像素坐标，换算成这个工具统一使用的 0~1 比例坐标，
// 当作没标定过时的起点（而不是从空白开始，省得每次都要从零拖5个框）。
function tryonCalibDefaultZonesFraction() {
  const w = TRYON_HAND_IMAGE.width, h = TRYON_HAND_IMAGE.height;
  const out = {};
  TRYON_NAIL_ZONES.forEach(z => {
    out[z.finger] = z.quad.map(([x, y]) => [x / w, y / h]);
  });
  return out;
}

async function openTryonHandCalibrator() {
  tryonCalibBuildModal();
  tryonCalibActiveFinger = 'thumb';
  tryonCalibDrag = null;

  // 先用默认坐标兜底，再尝试读已经保存过的标定结果（如果有的话）覆盖上去
  tryonCalibZones = tryonCalibDefaultZonesFraction();
  try {
    const { data, error } = await supabaseClient.from('site_settings').select('tryon_hand_zones').eq('id', 1).single();
    if (!error && data && Array.isArray(data.tryon_hand_zones)) {
      data.tryon_hand_zones.forEach(saved => {
        if (saved && saved.finger && Array.isArray(saved.quad) && saved.quad.length === 4) {
          tryonCalibZones[saved.finger] = saved.quad;
        }
      });
    }
  } catch (e) {
    console.warn('[tryon-hand-calibrator] 读取已保存的标定结果失败，使用默认坐标:', e);
  }

  tryonCalibCanvasEl = document.getElementById('tryon-calib-canvas');
  tryonCalibCtx = tryonCalibCanvasEl ? tryonCalibCanvasEl.getContext('2d') : null;
  if (tryonCalibCanvasEl && !tryonCalibCanvasEl.dataset.boundEvents) {
    tryonCalibCanvasEl.addEventListener('pointerdown', tryonCalibPointerDown);
    tryonCalibCanvasEl.addEventListener('pointermove', tryonCalibPointerMove);
    tryonCalibCanvasEl.addEventListener('pointerup', tryonCalibPointerUp);
    tryonCalibCanvasEl.addEventListener('pointercancel', tryonCalibPointerUp);
    tryonCalibCanvasEl.dataset.boundEvents = '1';
  }

  await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 640;
      const naturalW = img.naturalWidth || img.width || 1;
      const naturalH = img.naturalHeight || img.height || 1;
      const scale = naturalW > MAX_W ? MAX_W / naturalW : 1;
      tryonCalibCanvasEl.width = Math.round(naturalW * scale);
      tryonCalibCanvasEl.height = Math.round(naturalH * scale);
      tryonCalibImg = img;
      resolve();
    };
    img.onerror = () => { alert('手模型照片加载失败。'); resolve(); };
    img.src = TRYON_HAND_IMAGE.src;
  });

  renderTryonCalibFingerTabs();
  drawTryonCalib();
  document.getElementById('modal-tryon-calibrator').classList.remove('hidden');
}

function closeTryonHandCalibrator() {
  document.getElementById('modal-tryon-calibrator')?.classList.add('hidden');
  tryonCalibDrag = null;
}

function renderTryonCalibFingerTabs() {
  const wrap = document.getElementById('tryon-calib-finger-tabs');
  if (!wrap) return;
  wrap.innerHTML = TRYON_CALIB_FINGERS.map(f => {
    const isActive = f.key === tryonCalibActiveFinger;
    const color = TRYON_CALIB_COLORS[f.key];
    return `
      <button onclick="switchTryonCalibFinger('${f.key}')" class="px-3 py-1.5 rounded-lg text-xs font-bold border ${isActive ? 'bg-stone-900 hover:bg-stone-800 text-white border-stone-900' : 'bg-stone-100 hover:bg-stone-200 text-gray-900 border-stone-300'}" style="box-shadow: inset 0 -3px 0 ${color};">
        ${f.label}
      </button>
    `;
  }).join('');
}

function switchTryonCalibFinger(finger) {
  tryonCalibActiveFinger = finger;
  renderTryonCalibFingerTabs();
  drawTryonCalib();
}

function resetTryonCalibFinger() {
  const defaults = tryonCalibDefaultZonesFraction();
  tryonCalibZones[tryonCalibActiveFinger] = defaults[tryonCalibActiveFinger];
  drawTryonCalib();
}

function drawTryonCalib() {
  if (!tryonCalibCtx || !tryonCalibImg) return;
  const w = tryonCalibCanvasEl.width, h = tryonCalibCanvasEl.height;
  tryonCalibCtx.clearRect(0, 0, w, h);
  tryonCalibCtx.drawImage(tryonCalibImg, 0, 0, w, h);

  TRYON_CALIB_FINGERS.forEach(f => {
    const quad = tryonCalibZones[f.key];
    if (!quad) return;
    const pxQuad = quad.map(([fx, fy]) => [fx * w, fy * h]);
    const isActive = f.key === tryonCalibActiveFinger;
    const color = TRYON_CALIB_COLORS[f.key];

    tryonCalibCtx.save();
    tryonCalibCtx.beginPath();
    pxQuad.forEach(([x, y], i) => (i === 0 ? tryonCalibCtx.moveTo(x, y) : tryonCalibCtx.lineTo(x, y)));
    tryonCalibCtx.closePath();
    tryonCalibCtx.lineWidth = isActive ? 3 : 1.5;
    tryonCalibCtx.strokeStyle = color;
    tryonCalibCtx.globalAlpha = isActive ? 0.95 : 0.5;
    tryonCalibCtx.stroke();
    if (isActive) {
      tryonCalibCtx.globalAlpha = 0.16;
      tryonCalibCtx.fillStyle = color;
      tryonCalibCtx.fill();
    }
    tryonCalibCtx.restore();

    if (isActive) {
      pxQuad.forEach(([x, y]) => {
        tryonCalibCtx.beginPath();
        tryonCalibCtx.arc(x, y, 8, 0, Math.PI * 2);
        tryonCalibCtx.fillStyle = '#fff';
        tryonCalibCtx.fill();
        tryonCalibCtx.lineWidth = 2;
        tryonCalibCtx.strokeStyle = color;
        tryonCalibCtx.stroke();
      });
    }
  });
}

function tryonCalibGetPos(e) {
  const rect = tryonCalibCanvasEl.getBoundingClientRect();
  const scaleX = tryonCalibCanvasEl.width / rect.width;
  const scaleY = tryonCalibCanvasEl.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function tryonCalibClamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function tryonCalibPointInPolygon(pos, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > pos.y) !== (yj > pos.y)) && (pos.x < (xj - xi) * (pos.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function tryonCalibPointerDown(e) {
  if (!tryonCalibImg) return;
  const pos = tryonCalibGetPos(e);
  const finger = tryonCalibActiveFinger;
  const quad = tryonCalibZones[finger];
  if (!quad) return;
  const w = tryonCalibCanvasEl.width, h = tryonCalibCanvasEl.height;
  const pxQuad = quad.map(([fx, fy]) => [fx * w, fy * h]);
  const HIT_R = 16;

  for (let i = 0; i < 4; i++) {
    const [px, py] = pxQuad[i];
    if (Math.hypot(pos.x - px, pos.y - py) <= HIT_R) {
      tryonCalibDrag = { mode: 'corner', index: i };
      tryonCalibCanvasEl.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
  }

  if (tryonCalibPointInPolygon(pos, pxQuad)) {
    tryonCalibDrag = { mode: 'move', lastX: pos.x, lastY: pos.y };
    tryonCalibCanvasEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
}

function tryonCalibPointerMove(e) {
  if (!tryonCalibDrag) return;
  e.preventDefault();
  const pos = tryonCalibGetPos(e);
  const finger = tryonCalibActiveFinger;
  const quad = tryonCalibZones[finger];
  if (!quad) return;
  const w = tryonCalibCanvasEl.width, h = tryonCalibCanvasEl.height;

  if (tryonCalibDrag.mode === 'corner') {
    const fx = tryonCalibClamp01(pos.x / w);
    const fy = tryonCalibClamp01(pos.y / h);
    quad[tryonCalibDrag.index] = [fx, fy];
  } else if (tryonCalibDrag.mode === 'move') {
    const dx = (pos.x - tryonCalibDrag.lastX) / w;
    const dy = (pos.y - tryonCalibDrag.lastY) / h;
    const newQuad = quad.map(([fx, fy]) => [fx + dx, fy + dy]);
    if (newQuad.every(([fx, fy]) => fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
      tryonCalibZones[finger] = newQuad;
    }
    tryonCalibDrag.lastX = pos.x;
    tryonCalibDrag.lastY = pos.y;
  }
  drawTryonCalib();
}

function tryonCalibPointerUp() {
  tryonCalibDrag = null;
}

async function saveTryonHandCalib() {
  const saveBtn = document.getElementById('tryon-calib-save-btn');
  const payload = TRYON_CALIB_FINGERS.map(f => ({ finger: f.key, quad: tryonCalibZones[f.key] }));

  try {
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = '保存中...'; }
    const { error } = await supabaseClient.from('site_settings').upsert({ id: 1, tryon_hand_zones: payload });
    if (error) throw error;

    if (typeof tryonApplyHandZonesOverride === 'function') {
      tryonApplyHandZonesOverride(payload); // 当前这个管理页面如果之后要预览，立刻生效
    }
    if (typeof logAdminActivity === 'function') {
      logAdminActivity('tryon_hand_zones_update', '手模型指甲位置标定');
      if (typeof loadAdminActivityLog === 'function') loadAdminActivityLog();
    }

    alert('手模型标定结果保存成功！所有商品的试戴效果都会用上这份新坐标。');
    closeTryonHandCalibrator();
  } catch (err) {
    console.error('保存手模型标定失败:', err);
    alert('保存失败：' + err.message);
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = '保存标定结果'; }
  }
}
