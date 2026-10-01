// js/tryon.js
// "虚拟试戴" 功能：把某款穿戴甲的商品图，用 Canvas 贴合到一张固定的手模照片上，
// 让顾客不用摄像头/上传自己的手，就能大致看看这款设计"戴在手上"是什么效果，
// 点缩略图可以随时切换试别的款式。
//
// 原理：手模照片上每根手指的指甲位置，是 js/tryon-config.js 里标定好的一个四边形（4个角点，
// 可以在后台"手模型指甲位置标定"工具里可视化调整，见 js/tryon-hand-calibrator.js）。
// 配置过"框图工具"/自动抠图的商品（见 js/tryon-editor.js），贴图时会先把对应内容按它自己
// 真实的长宽比例"拉直"好，再整体等比缩放+旋转贴到手模型指根位置——不做独立的x/y拉伸，
// 所以长指甲贴出来就是长、窄指甲贴出来就是窄，不同设计之间的长短宽窄差异是真实的。
// 没有配置过的商品，仍然走最老的"整张商品图当贴纸、直接拉伸贴满框"方案兜底，见下面
// tryonRenderCanvas 第三档。

let tryonCanvasEl = null;
let tryonCtx = null;
let tryonHandImgEl = null;
let tryonCurrentItemId = null;
let tryonHandLoadPromise = null;
const tryonImageCache = {};

// 手模型上每根手指的实际贴图位置——默认用 js/tryon-config.js 里硬编码的 TRYON_NAIL_ZONES
// （人工估算标定，不是像素级精确）。后台"手模型标定工具"保存过结果后（见
// sql/add_tryon_hand_zones_column.sql），会在站点配置加载时调用 tryonApplyHandZonesOverride
// 把这里替换成管理员自己可视化标定过的精确坐标，不需要改代码/重新发布就能让前台生效。
let TRYON_ACTIVE_ZONES = TRYON_NAIL_ZONES;

function tryonApplyHandZonesOverride(savedZones) {
  if (!Array.isArray(savedZones) || savedZones.length === 0) return;
  try {
    const w = TRYON_HAND_IMAGE.width, h = TRYON_HAND_IMAGE.height;
    const merged = TRYON_NAIL_ZONES.map(zone => {
      const saved = savedZones.find(s => s.finger === zone.finger);
      if (!saved || !Array.isArray(saved.quad) || saved.quad.length !== 4) return zone;
      const quad = saved.quad.map(([fx, fy]) => [fx * w, fy * h]);
      return Object.assign({}, zone, { quad });
    });
    TRYON_ACTIVE_ZONES = merged;
  } catch (e) {
    console.warn('[tryon] 手模型标定数据格式异常，使用默认坐标:', e);
  }
}

function tryonLoadImage(src) {
  if (tryonImageCache[src]) return tryonImageCache[src];
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
  tryonImageCache[src] = p;
  return p;
}

function tryonEnsureHandLoaded() {
  if (!tryonHandLoadPromise) {
    tryonHandLoadPromise = tryonLoadImage(TRYON_HAND_IMAGE.src);
  }
  return tryonHandLoadPromise;
}

// 把 srcPts（源图上的3个点）仿射映射到 dstPts（画布上的3个点），并只在这个三角形范围内画图
function tryonDrawTriangle(ctx, img, srcPts, dstPts) {
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

// 通用版本：把 srcImg 上的任意四边形区域（srcQuad，4个角点，像素坐标）拆成两个三角形，
// 分别仿射贴到目标 dstQuad（4个角点）里。这是"框图方案"的核心——源不再局限于整张图片，
// 而是图片里的任意一块四边形区域（比如从整卡照片上框出来的一颗指甲）。
function tryonDrawQuadToQuad(ctx, img, srcQuad, dstQuad) {
  tryonDrawTriangle(ctx, img, [srcQuad[0], srcQuad[1], srcQuad[2]], [dstQuad[0], dstQuad[1], dstQuad[2]]);
  tryonDrawTriangle(ctx, img, [srcQuad[0], srcQuad[2], srcQuad[3]], [dstQuad[0], dstQuad[2], dstQuad[3]]);
}

// 把 0~1 的比例坐标（存进数据库的格式，见 sql/add_tryon_card_config.sql）转换成
// 某张具体图片（已知实际宽高）上的像素坐标
function tryonQuadFractionToPixel(quadFrac, imgW, imgH) {
  return quadFrac.map(([fx, fy]) => [fx * imgW, fy * imgH]);
}

// ========== 指甲形状蒙版（见 sql/add_tryon_nail_shape.sql） ==========
// 不管贴上去的内容来自哪一档（AI抠图/矩形框图/整图兜底），方框终归是方的，而真实指甲
// 是圆头/方头/棺材形/杏仁形等各种带弧度的形状——框画得再贴合，四个角也必然会比指甲
// 实际轮廓多出一小块，这就是"框外的背景也被带进来了"的根本原因，而且这个原因对每张图
// 都是一样的、完全可预测，不需要靠AI去"猜"每张图的背景再去抠。
// 所以这里不对每张图做任何像素分析，而是给每个商品配一个固定的"指甲形状"（圆头/方头/
// 棺材形...），贴图时统一按这个形状裁掉方框四个角——零计算成本、效果100%可预测，
// 一次配置可以直接套用到成百上千张图，不存在"规模化"的问题。
const TRYON_NAIL_SHAPE_LIST = [
  { key: 'square', label: '方头' },
  { key: 'round', label: '圆头' },
  { key: 'oval', label: '椭圆' },
  { key: 'almond', label: '杏仁形' },
  { key: 'coffin', label: '棺材形' },
  { key: 'stiletto', label: '尖头' }
];

// t: 0（指根/甲缘，贴着皮肤那一端）~ 1（甲尖，指甲的自由边）；返回半宽（0~0.5之间，
// 相对单位正方形）。指根端统一留直边不收窄——这一端实际上会被皮肤盖住一部分，形状
// 在这里差异不明显，也省得每个形状都要单独处理两端。
function tryonNailShapeWidthProfile(shapeKey) {
  const W0 = 0.46; // 主体半宽，四边留一点点余量，方便把源图框边缘也顺带裁掉一点
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
      const flatFrom = taper(0.88); // 棺材形在接近甲尖处截断收窄，变成一段平的尖端，而不是收到一个尖点
      return (t) => (t >= 0.88 ? flatFrom : taper(t));
    }
    case 'square':
    default:
      return () => W0;
  }
}

// 把某个形状的轮廓采样成一圈闭合多边形顶点（单位正方形坐标：x 是指甲宽度方向 0~1，
// y 是指根(0)→甲尖(1) 方向），先沿左边缘走一遍，再沿右边缘走回来，首尾相接。
function tryonNailShapePoints(shapeKey) {
  const widthFn = tryonNailShapeWidthProfile(shapeKey);
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

// 双线性插值：把单位正方形里的一个点 (u, v) 映射到目标四边形（[左上,右上,右下,左下]）
// 里的实际像素坐标。不要求四边形是严格的矩形/平行四边形，对手模图上那种带一点点透视感
// 的指甲框近似效果已经足够好，拿来算"形状蒙版"的裁剪边界完全够用。
function tryonBilinearQuad(u, v, quad) {
  const [tl, tr, br, bl] = quad;
  const x = (1 - u) * (1 - v) * tl[0] + u * (1 - v) * tr[0] + u * v * br[0] + (1 - u) * v * bl[0];
  const y = (1 - u) * (1 - v) * tl[1] + u * (1 - v) * tr[1] + u * v * br[1] + (1 - u) * v * bl[1];
  return [x, y];
}

// flip：如果某个商品的手模框标定方向和这里默认约定的"指根在上(y=0)/甲尖在下(y=1)"刚好
// 相反，勾一下"翻转指甲方向"就行，不用重新标定框。
function tryonClipNailShape(ctx, destQuad, shapeKey, flip) {
  const pts = tryonNailShapePoints(shapeKey || 'square');
  ctx.beginPath();
  pts.forEach(([u, vRaw], i) => {
    const v = flip ? 1 - vRaw : vRaw;
    const [px, py] = tryonBilinearQuad(u, v, destQuad);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.clip();
}

// 老的"整图当贴纸"方案：把整张设计图当成一张矩形贴纸，贴到 quad（4个角点）里。
// 没有在后台框图配置过的商品，仍然走这条路径（低保真但零配置成本）。
function tryonDrawDesignOnZone(ctx, designImg, quad) {
  const w = designImg.naturalWidth || designImg.width;
  const h = designImg.naturalHeight || designImg.height;
  if (!w || !h) return;
  const src = [[0, 0], [w, 0], [w, h], [0, h]];
  tryonDrawQuadToQuad(ctx, designImg, src, quad);
}

// ========== 等比贴图（不拉伸变形，保留每款设计本身真实的长宽比例） ==========
// 之前框图/抠图这两档，都是直接把素材仿射拉伸贴满手模型上那个固定的框——框多长就拉多长、
// 框多宽就压多宽，不同设计的指甲贴上去之后，长短宽窄看起来都差不多（被"捏"成了手模型
// 本身指甲的形状），这跟商品真实的长短宽窄效果不符。
//
// 改成：先把素材（框图裁剪/抠图结果）按它自己的真实长宽比例"拉直"好，再整体等比缩放+
// 旋转，贴到手模型指根位置，缩放比例只按"贴图宽度要跟手模型这根手指的指根宽度对上"来算，
// 长度完全由素材自己的比例决定——长指甲就会自然地显长，窄指甲就会自然地显窄，不同设计
// 之间的长短宽窄差异就是真实的，不会被强行揉成同一个形状。

// 把 srcQuad（可能是任意旋转的四边形）"拉直"成一张保留真实长宽比例的矩形画布——
// 跟 js/tryon-editor.js 的 tryonEditorCropToCanvas 完全同样的算法，这里是前台渲染用，
// 单独拷贝一份（两边一贯互不依赖的做法）。
function tryonStraightenQuadToCanvas(img, srcQuad, paddingRatio) {
  const cx = (srcQuad[0][0] + srcQuad[1][0] + srcQuad[2][0] + srcQuad[3][0]) / 4;
  const cy = (srcQuad[0][1] + srcQuad[1][1] + srcQuad[2][1] + srcQuad[3][1]) / 4;
  const expanded = srcQuad.map(([x, y]) => [cx + (x - cx) * (1 + paddingRatio), cy + (y - cy) * (1 + paddingRatio)]);

  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const outW = Math.max(8, Math.round((dist(expanded[0], expanded[1]) + dist(expanded[3], expanded[2])) / 2));
  const outH = Math.max(8, Math.round((dist(expanded[0], expanded[3]) + dist(expanded[1], expanded[2])) / 2));
  const dstQuad = [[0, 0], [outW, 0], [outW, outH], [0, outH]];

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  tryonDrawTriangle(ctx, img, [expanded[0], expanded[1], expanded[2]], [dstQuad[0], dstQuad[1], dstQuad[2]]);
  tryonDrawTriangle(ctx, img, [expanded[0], expanded[2], expanded[3]], [dstQuad[0], dstQuad[2], dstQuad[3]]);
  return canvas;
}

// 指甲形状蒙版的轮廓点，换算成某块素材自己的实际像素宽高（而不是单位正方形）——
// 这个形状是素材自己局部坐标系里的裁剪范围，跟它最终贴到手模型哪个位置、旋转多少度无关。
function tryonNailShapePointsPx(shapeKey, w, h) {
  return tryonNailShapePoints(shapeKey).map(([u, v]) => [u * w, v * h]);
}

// 把一块已经按真实比例"拉直"好的素材（content，宽 contentW、高 contentH，局部坐标
// y=0 是指根端、y=contentH 是甲尖端），整体等比缩放+旋转，贴到手模型 destQuad 对应的
// 指根位置、按指根→甲尖方向摆正——不做任何独立的 x/y 方向拉伸，贴图保持素材自己真实的
// 长宽比例。flip：手模型这个框标定方向反了的话翻一下，翻的是"贴到手模型的哪一头"，
// 不影响素材自己形状蒙版的朝向（那是素材自己局部坐标系的事，两者无关）。
function tryonPlaceContentOnZone(ctx, content, contentW, contentH, destQuad, shapeKey, flip, widthFitRatio) {
  if (!contentW || !contentH) return;
  const base0 = destQuad[0], base1 = destQuad[1]; // 指根两端（约定：框的"上边"）
  const tip0 = destQuad[3], tip1 = destQuad[2];   // 甲尖两端（框的"下边"）
  const baseCenter = [(base0[0] + base1[0]) / 2, (base0[1] + base1[1]) / 2];
  const tipCenter = [(tip0[0] + tip1[0]) / 2, (tip0[1] + tip1[1]) / 2];
  const destWidth = Math.hypot(base1[0] - base0[0], base1[1] - base0[1]);
  if (!destWidth) return;

  let dirX = tipCenter[0] - baseCenter[0], dirY = tipCenter[1] - baseCenter[1];
  const dirLen = Math.hypot(dirX, dirY) || 1;
  dirX /= dirLen; dirY /= dirLen;
  let anchor = baseCenter;
  if (flip) {
    dirX = -dirX; dirY = -dirY;
    anchor = tipCenter;
  }
  const perpX = -dirY, perpY = dirX; // 垂直于"指根→甲尖"方向，也就是指甲宽度方向

  const scale = (destWidth * (widthFitRatio || 1)) / contentW;
  const a = perpX * scale, b = perpY * scale; // 局部 x（宽度方向）映射到画布的系数
  const c = dirX * scale, d = dirY * scale;   // 局部 y（指根→甲尖方向）映射到画布的系数
  const e = anchor[0] - a * (contentW / 2);
  const f = anchor[1] - b * (contentW / 2);

  ctx.save();
  const shapePts = tryonNailShapePointsPx(shapeKey, contentW, contentH);
  ctx.beginPath();
  shapePts.forEach(([x, y], i) => {
    const px = a * x + c * y + e, py = b * x + d * y + f;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.clip();

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(content, 0, 0, contentW, contentH);
  ctx.restore();
}

// options（可选）：{ tryonSourceImageUrl, tryonNailQuads, tryonNailCutouts, tryonNailShape,
// tryonNailShapeFlip } —— 来自后台"框图工具"/"自动抠图"的配置（见
// sql/add_tryon_card_config.sql、sql/add_tryon_cutouts_column.sql、sql/add_tryon_nail_shape.sql）。
// 每根手指按下面优先级独立选用效果最好的一档，某一档缺失或加载失败都会自动降级到下一档，
// 保证任何商品（不管处理到哪一步）都能正常展示试戴效果，不会报错或留白：
//   1. tryonNailCutouts[手指] —— AI/颜色/手动抠图结果，等比贴图，效果最好
//   2. tryonNailQuads[手指] + tryonSourceImageUrl —— 矩形框图裁剪，等比贴图，效果其次
//   3. 都没有 —— 整张商品图直接拉伸贴满框，效果最粗糙，兜底
async function tryonRenderCanvas(designSrc, options) {
  if (!tryonCtx) return;
  options = options || {};
  const hand = await tryonEnsureHandLoaded();
  tryonCanvasEl.width = TRYON_HAND_IMAGE.width;
  tryonCanvasEl.height = TRYON_HAND_IMAGE.height;
  tryonCtx.clearRect(0, 0, tryonCanvasEl.width, tryonCanvasEl.height);
  tryonCtx.drawImage(hand, 0, 0, TRYON_HAND_IMAGE.width, TRYON_HAND_IMAGE.height);

  if (!designSrc) return;
  let designImg;
  try {
    designImg = await tryonLoadImage(designSrc);
  } catch (e) {
    console.warn('[tryon] design image failed to load:', designSrc, e);
    return;
  }

  // 有配置的话，尝试把"整卡"参考图也加载好；加载失败就当没配置处理（框图这一档整体跳过）
  let cardImg = null;
  const quads = options.tryonNailQuads;
  const cardUrl = options.tryonSourceImageUrl;
  if (quads && cardUrl) {
    try {
      cardImg = await tryonLoadImage(cardUrl);
    } catch (e) {
      console.warn('[tryon] card reference image failed to load, falling back:', cardUrl, e);
      cardImg = null;
    }
  }
  const cutouts = options.tryonNailCutouts;
  const shapeKey = options.tryonNailShape || 'square';
  const shapeFlip = !!options.tryonNailShapeFlip;

  for (const zone of TRYON_ACTIVE_ZONES) {
    let drawn = false;

    // 第一档：AI/颜色/手动抠图结果——这些本来就是从框出来的区域"拉直"裁出来的（见
    // js/tryon-editor.js 的 tryonEditorCropToCanvas），本身已经保留了真实长宽比例，
    // 直接按它自己的宽高等比贴上去，不再拉伸变形。
    const cutoutUrl = cutouts ? cutouts[zone.finger] : null;
    if (cutoutUrl) {
      try {
        const cutoutImg = await tryonLoadImage(cutoutUrl);
        const cw = cutoutImg.naturalWidth || cutoutImg.width;
        const ch = cutoutImg.naturalHeight || cutoutImg.height;
        if (cw && ch) {
          tryonPlaceContentOnZone(tryonCtx, cutoutImg, cw, ch, zone.quad, shapeKey, shapeFlip, 1);
          drawn = true;
        }
      } catch (e) {
        console.warn('[tryon] 抠图加载失败，这根手指回退到下一档:', zone.finger, cutoutUrl, e);
      }
    }

    // 第二档：矩形框图——先把框出来的（可能是旋转过的）四边形区域拉直成一张保留真实
    // 长宽比例的矩形，再跟第一档一样等比贴上去。
    if (!drawn) {
      const fingerQuadFrac = (cardImg && quads) ? quads[zone.finger] : null;
      if (Array.isArray(fingerQuadFrac) && fingerQuadFrac.length === 4) {
        const cw0 = cardImg.naturalWidth || cardImg.width;
        const ch0 = cardImg.naturalHeight || cardImg.height;
        if (cw0 && ch0) {
          const srcQuad = tryonQuadFractionToPixel(fingerQuadFrac, cw0, ch0);
          const straightCanvas = tryonStraightenQuadToCanvas(cardImg, srcQuad, 0);
          tryonPlaceContentOnZone(tryonCtx, straightCanvas, straightCanvas.width, straightCanvas.height, zone.quad, shapeKey, shapeFlip, 1);
          drawn = true;
        }
      }
    }

    // 第三档：整图贴纸兜底——用的是商品普通展示图，不是专门拍的平铺指甲图案，没有
    // "真实指甲比例"可言，继续用老办法直接拉伸贴满框（这一档本来就是效果上限最低的
    // 兜底方案，配置过框图/抠图的商品不会走到这里）。
    if (!drawn) {
      tryonCtx.save();
      tryonClipNailShape(tryonCtx, zone.quad, shapeKey, shapeFlip);
      tryonDrawDesignOnZone(tryonCtx, designImg, zone.quad);
      tryonCtx.restore();
    }
  }
}

function tryonGetImageForItem(item) {
  if (!item) return '';
  return (item.images && item.images.length > 0) ? item.images[0] : (item.spinImage || '');
}

function renderTryOnThumbs() {
  const wrap = document.getElementById('tryon-thumbs');
  if (!wrap || !window.productsData) return;
  wrap.innerHTML = window.productsData.nails.map(n => {
    const img = tryonGetImageForItem(n);
    const active = n.id === tryonCurrentItemId;
    return `
      <button onclick="switchTryOnDesign('${n.id}')" class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${active ? 'border-amber-600' : 'border-transparent hover:border-stone-300'} transition-all bg-stone-100">
        <img src="${img}" class="w-full h-full object-cover">
      </button>
    `;
  }).join('');
}

function openTryOnModal(itemId) {
  if (!window.productsData) return;
  const item = window.productsData.nails.find(n => n.id === itemId);
  if (!item) return;
  if (!tryonCanvasEl) {
    tryonCanvasEl = document.getElementById('tryon-canvas');
    tryonCtx = tryonCanvasEl ? tryonCanvasEl.getContext('2d') : null;
  }
  tryonCurrentItemId = itemId;
  document.getElementById('modal-tryon')?.classList.remove('hidden');
  renderTryOnThumbs();
  tryonRenderCanvas(tryonGetImageForItem(item), { tryonSourceImageUrl: item.tryonSourceImageUrl, tryonNailQuads: item.tryonNailQuads, tryonNailCutouts: item.tryonNailCutouts, tryonNailShape: item.tryonNailShape, tryonNailShapeFlip: item.tryonNailShapeFlip });
}

function closeTryOnModal() {
  document.getElementById('modal-tryon')?.classList.add('hidden');
}

function switchTryOnDesign(itemId) {
  if (!window.productsData) return;
  const item = window.productsData.nails.find(n => n.id === itemId);
  if (!item) return;
  tryonCurrentItemId = itemId;
  renderTryOnThumbs();
  tryonRenderCanvas(tryonGetImageForItem(item), { tryonSourceImageUrl: item.tryonSourceImageUrl, tryonNailQuads: item.tryonNailQuads, tryonNailCutouts: item.tryonNailCutouts, tryonNailShape: item.tryonNailShape, tryonNailShapeFlip: item.tryonNailShapeFlip });
}
