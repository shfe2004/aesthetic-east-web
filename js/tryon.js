// js/tryon.js
// "虚拟试戴" 功能：把某款穿戴甲的商品图，用 Canvas 贴合到一张固定的手模照片上，
// 让顾客不用摄像头/上传自己的手，就能大致看看这款设计"戴在手上"是什么效果，
// 点缩略图可以随时切换试别的款式。
//
// 原理：手模照片上每根手指的指甲位置，是 js/tryon-config.js 里人工标定好的一个四边形（4个角点）。
// 每次切换设计时，把该商品的图片当作一张矩形"贴纸"，通过数学上的仿射变换（把矩形拆成两个三角形分别计算），
// 挤压/拉伸/旋转成贴合指甲四边形的形状，画到手模图对应位置上。
//
// 现阶段的已知局限（跟用户讨论过，先低成本验证效果，后续视反馈决定是否升级）：
// 1. 用的是商品的正常展示图（不是专门拍摄的"平铺指甲图案"素材），所以贴上去以后，
//    图片里其他不相关的内容（比如整只手、包装盒边缘）也会被一起挤压进指甲形状里，
//    可能出现变形、看起来不自然的情况——这是意料之中的效果上限，不是bug。
// 2. 手模照片和标定坐标是人工估算的，不是像素级精确，如果测试后发现哪根手指明显贴歪了，
//    告诉我具体哪根手指、偏移方向，我可以直接在 js/tryon-config.js 里调整对应的坐标数字。
// 3. 如果以后想要更逼真的效果，需要为每款设计准备"平铺正面指甲图案图"素材，到时候可以在
//    后台给每个商品单独配置一张"试戴专用图"，而不是复用商品主图——这是升级版方案，现在先跳过。

let tryonCanvasEl = null;
let tryonCtx = null;
let tryonHandImgEl = null;
let tryonCurrentItemId = null;
let tryonHandLoadPromise = null;
const tryonImageCache = {};

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

// 老的"整图当贴纸"方案：把整张设计图当成一张矩形贴纸，贴到 quad（4个角点）里。
// 没有在后台框图配置过的商品，仍然走这条路径（低保真但零配置成本）。
function tryonDrawDesignOnZone(ctx, designImg, quad) {
  const w = designImg.naturalWidth || designImg.width;
  const h = designImg.naturalHeight || designImg.height;
  if (!w || !h) return;
  const src = [[0, 0], [w, 0], [w, h], [0, h]];
  tryonDrawQuadToQuad(ctx, designImg, src, quad);
}

// options（可选）：{ tryonSourceImageUrl, tryonNailQuads, tryonNailCutouts } —— 来自后台
// "框图工具"/"自动抠图"的配置（见 sql/add_tryon_card_config.sql、sql/add_tryon_cutouts_column.sql）。
// 每根手指按下面优先级独立选用效果最好的一档，某一档缺失或加载失败都会自动降级到下一档，
// 保证任何商品（不管处理到哪一步）都能正常展示试戴效果，不会报错或留白：
//   1. tryonNailCutouts[手指] —— AI抠图结果（PNG，指甲真实轮廓，四周透明），效果最好
//   2. tryonNailQuads[手指] + tryonSourceImageUrl —— 矩形框图裁剪，有方形边缘，效果一般
//   3. 都没有 —— 整张商品图当贴纸，效果最粗糙，兜底
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

  for (const zone of TRYON_NAIL_ZONES) {
    let drawn = false;

    // 第一档：AI抠图结果
    const cutoutUrl = cutouts ? cutouts[zone.finger] : null;
    if (cutoutUrl) {
      try {
        const cutoutImg = await tryonLoadImage(cutoutUrl);
        tryonDrawDesignOnZone(tryonCtx, cutoutImg, zone.quad);
        drawn = true;
      } catch (e) {
        console.warn('[tryon] 抠图加载失败，这根手指回退到下一档:', zone.finger, cutoutUrl, e);
      }
    }

    // 第二档：矩形框图裁剪
    if (!drawn) {
      const fingerQuadFrac = (cardImg && quads) ? quads[zone.finger] : null;
      if (Array.isArray(fingerQuadFrac) && fingerQuadFrac.length === 4) {
        const cw = cardImg.naturalWidth || cardImg.width;
        const ch = cardImg.naturalHeight || cardImg.height;
        if (cw && ch) {
          const srcQuad = tryonQuadFractionToPixel(fingerQuadFrac, cw, ch);
          tryonDrawQuadToQuad(tryonCtx, cardImg, srcQuad, zone.quad);
          drawn = true;
        }
      }
    }

    // 第三档：整图贴纸兜底
    if (!drawn) {
      tryonDrawDesignOnZone(tryonCtx, designImg, zone.quad);
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
  tryonRenderCanvas(tryonGetImageForItem(item), { tryonSourceImageUrl: item.tryonSourceImageUrl, tryonNailQuads: item.tryonNailQuads, tryonNailCutouts: item.tryonNailCutouts });
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
  tryonRenderCanvas(tryonGetImageForItem(item), { tryonSourceImageUrl: item.tryonSourceImageUrl, tryonNailQuads: item.tryonNailQuads, tryonNailCutouts: item.tryonNailCutouts });
}
