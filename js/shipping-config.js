/* ==================================================
   包装预设与包裹计算（用于向 Shippo 实时询价）
   ==================================================
   下面这些重量/尺寸都是【行业经验估算值】，不是实际称重量出来的数据。
   等有了真实包装材料的重量/尺寸后，只需要把这个文件里的数字改成真实值，
   不用动任何其它代码（app.js、后台、Shippo 那边都不用改），
   前台下次询价会自动用新数字重新计算，改完记得连同这个文件一起重新发布网站。

   单位统一：重量 = 克(g)，尺寸 = 厘米(cm)。
   古董家具不在这里配置——它每件都是独一无二的实物，运费走人工核算/货代对接，
   不接入这里的自动询价（见 computeParcelForCart 里的 needsManualQuote 判断）。
*/
const PACKAGING_PRESETS = {
  // 穿戴甲：按购买套数分档，气泡信封 → 小纸盒 → 中纸盒
  nails: {
    netWeightPerUnitG: 60, // 一套穿戴甲（含零售小盒）的行业经验净重
    tiers: [
      { maxQty: 2, packageWeightG: 15, dims: { l: 17, w: 12, h: 3 } }, // 气泡信封
      { maxQty: 6, packageWeightG: 50, dims: { l: 20, w: 15, h: 8 } }, // 小纸盒
      { maxQty: Infinity, packageWeightG: 100, dims: { l: 25, w: 20, h: 10 } } // 中纸盒
    ]
  },
  // 亚克力立牌/卡通制品：整体不超过 A4（约21×29.7cm），板厚3-5mm，
  // 支架约5cm高但通常拆下/平放运输，所以打包后仍按扁平件估算
  merch: {
    netWeightPerUnitG: 70, // 按 A4 内中等面积、约4mm厚的亚克力估算的单件净重
    tiers: [
      { maxQty: 1, packageWeightG: 40, dims: { l: 25, w: 20, h: 3 } }, // 硬质平邮信封
      { maxQty: Infinity, packageWeightG: 80, dims: { l: 32, w: 25, h: 6 } } // 小纸盒（多件叠放）
    ]
  }
};

// 根据购物车内容算出一个"打包后"的包裹（重量 + 外部尺寸），供询价接口使用。
// cartItems 的每一项需要带 category 字段（'nails' / 'merch' / 'furniture'）。
//
// 简化处理：
// - 古董家具数量本来就是1件且每件独一无二，不参与自动询价，标记 needsManualQuote。
// - 如果购物车里穿戴甲和亚克力制品同时存在，合并成一个包裹（更贴近真实打包习惯），
//   外包装尺寸取两者中较大的那一档，重量两边净重相加。
function computeParcelForCart(cartItems) {
  const nailsQty = cartItems.filter(i => i.category === 'nails').reduce((s, i) => s + i.qty, 0);
  const merchQty = cartItems.filter(i => i.category === 'merch').reduce((s, i) => s + i.qty, 0);
  const hasFurniture = cartItems.some(i => i.category === 'furniture');

  if (nailsQty === 0 && merchQty === 0) {
    return { parcel: null, hasFurniture, needsManualQuote: hasFurniture };
  }

  function pickTier(category, qty) {
    const cfg = PACKAGING_PRESETS[category];
    const tier = cfg.tiers.find(t => qty <= t.maxQty);
    return { cfg, tier };
  }

  let weightG = 0;
  let dims;

  if (nailsQty > 0 && merchQty === 0) {
    const { cfg, tier } = pickTier('nails', nailsQty);
    weightG = tier.packageWeightG + cfg.netWeightPerUnitG * nailsQty;
    dims = tier.dims;
  } else if (merchQty > 0 && nailsQty === 0) {
    const { cfg, tier } = pickTier('merch', merchQty);
    weightG = tier.packageWeightG + cfg.netWeightPerUnitG * merchQty;
    dims = tier.dims;
  } else {
    // 穿戴甲 + 亚克力制品混装：外包装用亚克力那档的尺寸（通常更大更能装下），重量两边相加
    const nailsTier = pickTier('nails', nailsQty);
    const merchTier = pickTier('merch', merchQty);
    weightG = merchTier.tier.packageWeightG
      + nailsTier.cfg.netWeightPerUnitG * nailsQty
      + merchTier.cfg.netWeightPerUnitG * merchQty;
    dims = merchTier.tier.dims;
  }

  return {
    parcel: { weightG: Math.ceil(weightG), length: dims.l, width: dims.w, height: dims.h },
    hasFurniture,
    needsManualQuote: hasFurniture
  };
}
