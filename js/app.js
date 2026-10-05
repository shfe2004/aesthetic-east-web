/* =================================================_
   Aesthetic East - 前台全功能控制脚本 (毫米mm与英寸in实时换算版)
   ================================================= */

// 语言状态：优先读取 localStorage 里保存的选择（与后台管理页共用同一个 key，切换一次全站同步）
let currentLang = localStorage.getItem('site_lang') || 'en';
let cart = [];
// 购物车里每一项的实时库存核对结果：key 是购物车项自己的 cartItemId，value 是
// { qtyAvailable, sufficient }，由 refreshCartStockStatus() 向后端 check_cart_stock 这个
// RPC 查询后填充。这样库存不够能在购物车里就提醒顾客，不用等到结算最后一步才发现
// （最后一步的 create_order_with_stock_check 仍然保留，作为真正下单时的最终防线）。
let cartStockStatus = {};
let cartStockCheckSeq = 0;
// 当前订单选中的快递方式（点击"计算运费"后由 Shippo 返回，顾客选一个后存在这里）
let selectedShippingRate = null;
let currentShippoShipmentId = null;
// 这次询价用的包裹重量/尺寸（见 js/shipping-config.js 的 computeParcelForCart），跟着订单
// 一起存下来——后台"生成运单"时如果发现这次报价已经过期，需要拿这份包裹信息重新问一次价。
let currentShippingParcel = null;
// Shippo 地址校验结果：地址询价成功，但 Shippo 认为这个收货地址不太对（比如找不到唯一匹配、
// 门牌号/公寓号有疑问）时是 true——不直接拦死下单（Shippo 的校验本身偶尔会有误判），
// 而是要求顾客勾选"我已确认地址无误"之后才能继续付款，见 processPayment() 里的检查。
let addressValidationFailed = false;
// 结算税率，从后台 site_settings 里读，读不到时兜底用 8%（跟原来硬编码的值保持一致）
let siteTaxRate = 0.08;
// 满额包邮门槛（$），从后台 site_settings.free_shipping_threshold 里读；null 表示没开启这个功能
let siteFreeShippingThreshold = null;
// 穿戴甲手工制作视频的地址，读到了才显示这个模块；真正开始加载视频文件延迟到它滚动进可视区域时
let nailsVideoUrl = null;
let activeSelections = {};
let isSpinning = false;
let spinStartX = 0;
let currentRotationY = 0;
let zoomScale = 1;
let zoomTranslateX = 0;
let zoomTranslateY = 0;
let isZoomDragging = false;
let zoomStartX = 0;
let zoomStartY = 0;

// 当前正在查看尺寸指南的商品 ID
let currentDimensionProductId = null;

// 当前正在查看穿戴甲尺码对照的商品 ID
let currentSizeGuideProductId = null;

// 穿戴甲行业参考尺码对照表（单位 mm，指甲床最宽处宽度）。
// 商家没有针对某个尺码/某根手指填写自定义值时，用这份数据兜底显示，仅供参考，具体以到手实物为准。
const NAIL_STANDARD_SIZE_CHART = {
  XS: { thumb: 13.0, index: 10.0, middle: 10.5, ring: 10.0, pinky: 8.0 },
  S:  { thumb: 14.5, index: 11.0, middle: 11.5, ring: 11.0, pinky: 8.5 },
  M:  { thumb: 16.0, index: 12.0, middle: 13.0, ring: 12.0, pinky: 9.5 },
  L:  { thumb: 17.5, index: 13.5, middle: 14.5, ring: 13.5, pinky: 10.5 }
};
const NAIL_SIZE_FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'];

// 全站唯一的双语翻译字典（原先 index.html 底部还有一份重复的 translations 字典，
// 两处都用 `let currentLang` 在全局作用域声明，浏览器解析第二个 <script> 时会直接抛出
// "Identifier 'currentLang' has already been declared" 的 SyntaxError，导致那整段内联脚本
// 完全不执行——这就是横幅/Hero文案/结算表单/footer 等大部分文字点"中文/EN"按钮没反应的真正原因。
// 现在把两份字典合并成这一份，index.html 里重复的那段内联脚本已经删除。
const i18n = {
  en: {
    topBanner: "✨ Free US Shipping on Nails & Merch over $50 | White-Glove Freight for Antiques",
    adminBtn: "Admin",
    heroTag: "Curated Asian Aesthetics",
    heroTitle: "Handcrafted Press-Ons & Timeless Chinese Antiques",
    heroDesc: "Bringing oriental craftsmanship and pop art into modern American homes.",
    nailsSectionTitle: "Handcrafted Press-On Nails",
    nailsSubTitle: "Click image to enlarge · View custom size specs inside",
    merchSectionTitle: "Original Acrylic Merch",
    merchSubTitle: "High definition printing & standees",
    furnitureSectionTitle: "Restored Antique Furniture",
    furnitureSubTitle: "Authentic 19th-century craftsmanship",
    loadingText: "Loading...",
    noItemsInFilter: "No items yet.",
    cartTitle: "Shopping Bag",
    cartEmpty: "Your cart is empty.",
    subtotalLabel: "Subtotal",
    checkoutBtn: "Proceed to Checkout",
    dimModalTitle: "Product Dimensions",
    unitConversionLabel: "Unit Conversion:",
    closeBtn: "Close",
    shippingCheckoutTitle: "Shipping & Checkout",
    placeholderFirstName: "First Name *",
    placeholderLastName: "Last Name *",
    placeholderEmail: "Email Address *",
    placeholderPhone: "Phone (10 digits) *",
    placeholderAddress: "Street Address (e.g., 123 Main St) *",
    placeholderAddress2: "Apt / Suite / Unit (optional)",
    addressHouseNumberWarning: "Please include a house/building number (e.g., \"123 Main St\"), not just the street name.",
    addressValidationWarningDefault: "We couldn't confirm this exact address. Please double-check it before continuing.",
    addressValidationOverrideLabel: "I've double-checked and this address is correct — continue anyway.",
    addressValidationBlockedAlert: "We couldn't verify your shipping address. Please check the box confirming it's correct, or fix the address above, before placing your order.",
    placeholderCity: "City *",
    selectState: "Select State *",
    placeholderZip: "Zip (5 digits) *",
    taxLabel: "Est. Tax (8%):",
    totalLabel: "Total:",
    payBtn: "Complete Payment (Test Mode)",
    processingBtn: "Processing...",
    successTitle: "Thank You for Your Order!",
    successDesc: "Order confirmation has been generated for",
    continueShoppingBtn: "Continue Shopping",
    footerSub: "Mobile-First Dynamic E-Commerce Storefront",
    sizeGuide: "Size Guide",
    calcShippingBtn: "Recalculate Shipping",
    calculatingShippingBtn: "Calculating...",
    shippingLabel: "Shipping:",
    chooseShippingPrompt: "Select a shipping option:",
    shippingAutoHint: "Shipping cost will appear automatically once your address is complete.",
    manualShippingNote: "This order contains antique furniture — shipping cost will be quoted manually and confirmed with you after checkout.",
    shippingCalcError: "Could not get shipping rates. Please check your address and try again.",
    shippingNotCalculatedYet: "Please finish entering your address so we can calculate shipping before completing payment.",
    fillAddressFirst: "Please fill in your address, city, state and zip first.",
    soldOutBtn: "Sold Out",
    variantSoldOutAlert: "Sorry, this option is currently sold out or you have reached the available stock.",
    orderFailedGeneric: "Order failed, please adjust the quantity and try again.",
    cartStockInsufficientOne: "Only 1 left in stock",
    cartStockInsufficientMany: "Only {n} left in stock",
    cartStockOutOfStock: "Out of stock",
    cartStockWarningBanner: "Some items in your bag exceed available stock. Please adjust the quantity before checkout.",
    checkingStockBtn: "Checking stock...",
    nailsVideoCaption: "Handmade, start to finish",
    tryOnBtn: "Try On",
    tryonModalTitle: "Virtual Try-On",
    tryonDisclaimer: "Simulated preview on a standard hand model — actual color, shine and fit may vary from real nails.",
    tryonSwitchLabel: "Try another design:",
    tryonLoadError: "Could not load this design's preview image.",
    freeShippingAppliedMsg: "🎉 Your order qualifies for free US shipping!",
    tieredPricingFromLabel: "from"
  },
  zh: {
    topBanner: "✨ 穿戴甲与周边满$50免美国境内运费 | 古董家具专享专业白手套物流配送",
    adminBtn: "管理后台",
    heroTag: "精选东方美学",
    heroTitle: "手工精制穿戴甲与流光岁月的东方古董",
    heroDesc: "将东方手工艺与现代波普艺术完美融入北美现代家居生活。",
    nailsSectionTitle: "纯手工定制穿戴甲",
    nailsSubTitle: "点击图片放大 · 内含标准与定制尺寸规格指南",
    merchSectionTitle: "原创动漫与艺术周边",
    merchSubTitle: "高清数码印花与精品亚克力立牌",
    furnitureSectionTitle: "经典修复古董家具",
    furnitureSubTitle: "传承十九世纪正宗东方木作工艺",
    loadingText: "加载中...",
    noItemsInFilter: "暂无商品。",
    cartTitle: "购物袋",
    cartEmpty: "您的购物车是空的。",
    subtotalLabel: "小计",
    checkoutBtn: "前往结账",
    dimModalTitle: "商品尺寸与规格",
    unitConversionLabel: "单位换算：",
    closeBtn: "关闭",
    shippingCheckoutTitle: "配送与结算信息",
    placeholderFirstName: "名 (First Name) *",
    placeholderLastName: "姓 (Last Name) *",
    placeholderEmail: "电子邮箱 (Email) *",
    placeholderPhone: "手机号码 (10位数字) *",
    placeholderAddress: "详细街道地址 *",
    placeholderAddress2: "公寓/门牌号 Apt/Suite/Unit（选填）",
    addressHouseNumberWarning: "请填写门牌号（例如 \"123 Main St\"），不能只写街道名。",
    addressValidationWarningDefault: "系统无法确认这个地址是否准确，请再检查一遍再继续。",
    addressValidationOverrideLabel: "我已经核对过，这个地址没问题——仍要继续。",
    addressValidationBlockedAlert: "系统无法核实这个收货地址。请勾选确认地址无误，或修改上面的地址后再下单。",
    placeholderCity: "城市 (City) *",
    selectState: "选择州 (State) *",
    placeholderZip: "邮编 (5位数字) *",
    taxLabel: "预估税费 (8%):",
    totalLabel: "总计:",
    payBtn: "确认支付 (测试模式)",
    processingBtn: "处理中...",
    successTitle: "感谢您的订购！",
    successDesc: "订单确认信已成功生成，收件人：",
    continueShoppingBtn: "继续购物",
    footerSub: "移动优先的高性能动态电商前台",
    sizeGuide: "尺寸指南",
    calcShippingBtn: "重新计算运费",
    calculatingShippingBtn: "计算中...",
    shippingLabel: "运费：",
    chooseShippingPrompt: "请选择一种快递方式：",
    shippingAutoHint: "地址填写完整后将自动显示运费。",
    manualShippingNote: "此订单包含古董家具，运费将在下单后由客服人工核算并与您确认。",
    shippingCalcError: "获取运费失败，请检查地址信息后重试。",
    shippingNotCalculatedYet: "请先填写完整地址以便计算运费，再完成支付。",
    fillAddressFirst: "请先填写详细地址、城市、州和邮编。",
    soldOutBtn: "已售罄",
    variantSoldOutAlert: "抱歉，这个选项目前缺货，或者已经达到现有库存上限。",
    orderFailedGeneric: "下单失败，请调整购买数量后重试。",
    cartStockInsufficientOne: "仅剩 1 件库存",
    cartStockInsufficientMany: "仅剩 {n} 件库存",
    cartStockOutOfStock: "已无库存",
    cartStockWarningBanner: "购物车内有商品数量超过现有库存，请先调整数量再结算。",
    checkingStockBtn: "正在核对库存...",
    nailsVideoCaption: "纯手工制作全过程",
    tryOnBtn: "虚拟试戴",
    tryonModalTitle: "虚拟试戴",
    tryonDisclaimer: "此效果为在标准手模上的模拟贴图预览，实际颜色、光泽与佩戴效果可能与真实产品略有差异。",
    tryonSwitchLabel: "试试其他款式：",
    tryonLoadError: "该款式的预览图片加载失败。",
    freeShippingAppliedMsg: "🎉 您的订单已达到包邮门槛，本单免美国境内运费！",
    tieredPricingFromLabel: "起"
  }
};

// ===================== 网站访问统计（来源 + 地理位置）=====================
// 每次打开首页只记一次，交给后端 /api/track-visit 存进 Supabase 的 site_visits 表，
// 供后台"网站访问统计"板块汇总展示。地理位置在后端通过 Vercel 自带的请求头直接拿到，
// 这里前台只需要负责判断"这个访客是从哪个渠道点进来的"。
//
// 判断逻辑分两层：
// 1. 先看浏览器 UA 里有没有 Instagram/FBAN/FBAV/TikTok 这些"App 内置浏览器"的特征字符串——
//    顾客从 IG/FB/TikTok App 里直接点链接打开时，用的是这些 App 自带的内置浏览器，
//    这种情况下 document.referrer 经常是空的，必须靠 UA 识别，单看 referrer 会漏判。
// 2. UA 没命中的话，再看 document.referrer 的域名：instagram.com/facebook.com/tiktok.com 归到
//    对应渠道；google/bing/duckduckgo 等搜索引擎归到"搜索"；referrer 为空归到"直接访问"
//    （比如直接输入网址、或者从浏览器收藏夹/书签打开）；其余有 referrer 但域名对不上以上几种的，
//    归到"其它网站引荐"，并记下具体域名，方便以后发现新的重要来源渠道。
function classifyTrafficSource() {
  const ua = navigator.userAgent || '';
  if (/Instagram/i.test(ua)) return { source: 'instagram', referralDomain: null };
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return { source: 'facebook', referralDomain: null };
  if (/TikTok|musical_ly/i.test(ua)) return { source: 'tiktok', referralDomain: null };

  const referrer = document.referrer || '';
  if (!referrer) return { source: 'direct', referralDomain: null };

  let host = '';
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { host = ''; }

  if (!host) return { source: 'direct', referralDomain: null };
  if (host.includes('instagram.com')) return { source: 'instagram', referralDomain: null };
  if (host.includes('facebook.com') || host.includes('fb.com')) return { source: 'facebook', referralDomain: null };
  if (host.includes('tiktok.com')) return { source: 'tiktok', referralDomain: null };
  if (/google\.|bing\.com|duckduckgo\.com|yahoo\./.test(host)) return { source: 'search', referralDomain: null };
  // 同站内部跳转（比如从首页跳到自己的另一个页面）不算外部引荐，当作直接访问
  if (host === location.hostname) return { source: 'direct', referralDomain: null };
  return { source: 'referral', referralDomain: host };
}

function trackSiteVisit() {
  try {
    const { source, referralDomain } = classifyTrafficSource();
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true, // 页面可能在请求完成前就被关闭/跳转，keepalive 让请求仍能发出去
      body: JSON.stringify({
        path: location.pathname,
        referrer: document.referrer || '',
        source,
        referralDomain
      })
    }).catch(() => {}); // 统计功能失败不应该影响正常顾客浏览购物，安静忽略即可
  } catch (err) {
    console.error('访问统计上报失败:', err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSiteDynamicConfig();
  const cloudData = await fetchProductsIndependentJoin();
  if (cloudData) {
    window.productsData = cloudData;
  }
  initSelections();
  renderPage();
  setupZoomEvents();
  setupSpin360Events();
  setupNailsVideoLazyPlay();
  setupShippingAutoCalc();
  trackSiteVisit();
  scrollToDeepLinkedProduct();
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeZoomModal();
      close360Modal();
      closeSizeModal();
      closeDimensionsModal();
    }
  });
});

// 独立并发查询 products、nail_options、product_images，全面组装尺寸与属性
async function fetchProductsIndependentJoin() {
  try {
    const [prodRes, optRes, imgRes, stockAvailRes, categoriesRes, subtypesRes, tierGroupsRes, tierTiersRes] = await Promise.all([
      supabaseClient.from("products").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("nail_options").select("*"),
      supabaseClient.from("product_images").select("*"),
      // 只读"有没有货"的布尔视图，读不到具体库存数字（见 sql/add_nail_stock_public_view.sql）
      supabaseClient.from("nail_variant_availability").select("*"),
      // 分类列表和子类型标签：见 sql/add_categories_system.sql。旧数据库没跑过这份 SQL 时
      // 查询会失败，这里不阻断整个页面——categoriesData 为空数组时，下面 renderCategorySections()
      // 会什么都不画，只是亚克力/家具/以后新增的分类栏目不显示，穿戴甲那个写死的栏目不受影响。
      supabaseClient.from("categories").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      supabaseClient.from("product_subtypes").select("*").order("display_order", { ascending: true }),
      // 阶梯定价分组：见 sql/add_tiered_pricing_groups.sql，旧数据库没跑过这份 SQL 时查询会失败，
      // 这里同样不阻断整个页面——没有分组数据，所有商品就都按原价/折扣价算
      supabaseClient.from("tiered_pricing_groups").select("*"),
      supabaseClient.from("tiered_pricing_tiers").select("*").order("min_qty", { ascending: true })
    ]);
    if (prodRes.error) throw prodRes.error;
    const products = prodRes.data || [];
    const nailOptions = optRes.data || [];
    const productImages = imgRes.data || [];
    // 视图可能还没建（旧数据库没跑过那份 SQL），查询失败时不阻断整个页面，只是不做缺货判断
    const stockAvailRows = (!stockAvailRes.error && stockAvailRes.data) ? stockAvailRes.data : [];
    window.categoriesData = (!categoriesRes.error && categoriesRes.data) ? categoriesRes.data : [];
    window.subtypesData = (!subtypesRes.error && subtypesRes.data) ? subtypesRes.data : [];
    const tierGroupRows = (!tierGroupsRes.error && tierGroupsRes.data) ? tierGroupsRes.data : [];
    const tierTierRows = (!tierTiersRes.error && tierTiersRes.data) ? tierTiersRes.data : [];
    // 阶梯定价分组速查表：groupId -> 排好序的价目表（见 sql/add_tiered_pricing_groups.sql）。
    // 购物车计算时按"商品所属的分组"查这里的价目表，不再是商品自己带一份价目表。
    window.tieredPricingGroups = {};
    tierGroupRows.forEach(g => {
      window.tieredPricingGroups[g.id] = {
        categoryId: g.category_id,
        tiers: tierTierRows.filter(t => t.group_id === g.id).map(t => ({ minQty: parseInt(t.min_qty, 10), unitPrice: parseFloat(t.unit_price) }))
      };
    });
    // 分类默认折扣：商品自己没设置折扣时的兜底值，按分类 id 建个速查表
    const categoryDefaultDiscount = {};
    window.categoriesData.forEach(c => { categoryDefaultDiscount[c.id] = c.default_discount_percent; });
    const nails = [];
    const merch = [];
    const furniture = [];
    // 通用的"按分类归好类的商品"——包含上面三个分类，也包含后台"分类管理"里新建的
    // 任何其它分类（比如首饰），renderCategorySections() 就是靠这个画出对应栏目的
    const byCategory = {};
    // 按商品 ID 能直接查到完整数据的速查表，购物车小计/阶梯定价计算用这个，
    // 不用每次都去 productsData[category] 里遍历数组查找
    window.productsById = {};

    products.forEach(item => {
      const nailOpt = nailOptions.find(o => o.product_id === item.id) || {};
      const parsedShapes = robustParseSpec(nailOpt.shapes);
      const parsedSizes = robustParseSpec(nailOpt.sizes);
      const parsedSizeChart = robustParseSizeChart(nailOpt.size_chart);

      // 把这个商品的库存可售状态拼成 { 甲型: { 尺寸: true/false } } 方便渲染时查
      const stockMap = {};
      stockAvailRows.filter(r => r.product_id === item.id).forEach(r => {
        if (!stockMap[r.shape]) stockMap[r.shape] = {};
        stockMap[r.shape][r.size] = !!r.in_stock;
      });

      const imgs = productImages
        .filter(img => img.product_id === item.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map(img => img.image_url);

      const formattedItem = {
        id: item.id,
        title: item.title_en || item.title || '',
        subtitle: item.subtitle_en || item.subtitle || '',
        price: parseFloat(item.price || 0),
        tagKey: item.tag_key || 'New',
        tagClass: item.tag_class || 'bg-stone-900 text-white',
        spinImage: item.spin_image || '',
        images: imgs.length > 0 ? imgs : (item.spin_image ? [item.spin_image] : []),
        shapes: parsedShapes,
        sizes: parsedSizes,
        stockMap: stockMap,
        // 亚克力制品/古董家具用的总库存（穿戴甲走上面按甲型+尺寸的 stockMap，这个字段对穿戴甲没意义）
        stockQuantity: parseInt(item.stock_quantity || 0, 10),
        // 穿戴甲专属：商家自定义的指围尺码对照表（可能只填了部分尺码/部分手指，其余用行业标准兜底）
        sizeChart: parsedSizeChart,
        // 全品类通用的长宽高尺寸字段（后台维护的毫米 mm 数据）
        length: parseFloat(item.length || 0),
        width: parseFloat(item.width || 0),
        height: parseFloat(item.height || 0),
        // 虚拟试戴"框图方案"：后台用框图工具配置过的商品才会有这两个字段，
        // 没配置过的（null）前台会自动回退到整图贴纸的老方案，见 js/tryon.js
        tryonSourceImageUrl: item.tryon_source_image_url || '',
        tryonNailQuads: item.tryon_nail_quads || null,
        // 方案C：浏览器端AI抠图的结果（每根手指一张透明背景PNG），见 sql/add_tryon_cutouts_column.sql
        tryonNailCutouts: item.tryon_nail_cutouts || null,
        // 指甲形状蒙版：贴图时按这个形状裁掉方框四个角，见 sql/add_tryon_nail_shape.sql
        tryonNailShape: item.tryon_nail_shape || 'square',
        tryonNailShapeFlip: !!item.tryon_nail_shape_flip,
        // 子类型（分类内部的筛选标签，比如"首饰"分类下的耳环/项链），见 sql/add_categories_system.sql；
        // 穿戴甲/亚克力/家具这三个现有分类目前都不用这个字段，值会是 null
        subtypeId: item.subtype_id || null,
        // 折扣/阶梯定价：见 sql/add_discount_tiered_pricing_shipping.sql 和 sql/add_tiered_pricing_groups.sql
        // discountPercent：商品自己设置过折扣（哪怕是 0）就用商品自己的，否则用所属分类的默认折扣，
        // 两者都没设置就是 null（不打折）。如果这件商品加入了阶梯定价分组，折扣会被完全忽略——
        // 这里不提前清空 discountPercent，交给下面统一计价的 computeUnitPriceForQty() 处理，
        // 这样其它只是想单纯显示"折扣信息"的地方也能查到商品本来配置的折扣是多少。
        discountPercent: (item.discount_percent !== null && item.discount_percent !== undefined)
          ? parseFloat(item.discount_percent)
          : (categoryDefaultDiscount[item.category_id] !== null && categoryDefaultDiscount[item.category_id] !== undefined)
            ? parseFloat(categoryDefaultDiscount[item.category_id])
            : null,
        // 这件商品所属的阶梯定价分组（没有就是 null）。同一个分组里的商品，购物车里的数量
        // 会合并计算来决定用哪一档单价——不再是只看这一件商品自己买了几件。
        tieredPricingGroupId: item.tiered_pricing_group_id || null
      };

      if (item.category_id === 'nails') nails.push(formattedItem);
      if (item.category_id === 'merch') merch.push(formattedItem);
      if (item.category_id === 'furniture') furniture.push(formattedItem);
      if (!byCategory[item.category_id]) byCategory[item.category_id] = [];
      byCategory[item.category_id].push(formattedItem);
      window.productsById[item.id] = formattedItem;
    });

    console.log("【组装成功】全品类商品及尺寸加载完毕:", { nails, merch, furniture, byCategory });
    // 把 byCategory 里每个分类都展开成顶层字段（productsData.jewelry、productsData.merch...），
    // 这样 addSimpleToCart(category, id) 这些已有函数不用改一行代码，就能直接支持
    // 后台"分类管理"里新建的任何分类——它们读的就是 window.productsData[category]
    return Object.assign({ nails, merch, furniture }, byCategory);
  } catch (err) {
    console.error("加载数据库商品出错:", err);
    return null;
  }
}

// ============================================================
// 折扣 / 阶梯定价 的统一计价逻辑（见 sql/add_discount_tiered_pricing_shipping.sql）
// 全站只有这一处算"这件商品该卖多少钱"，购物车小计、购物车抽屉里每一行的显示、
// 结算页小计都调这几个函数，避免到处各写一套算法算出不一样的结果。
// ============================================================

// productItem：window.productsById[productId] 查出来的完整商品数据；
// qty：这个商品用来匹配阶梯定价档位的数量——如果这款商品属于某个"阶梯定价分组"
// (tieredPricingGroupId)，这个数量应该是"同一个分组里所有商品在购物车里加起来的总件数"
// （由 buildQtyByGroupMap 算出来），不再只是这一款商品自己买了几件；
// 如果商品不属于任何分组，这个数量就是这款商品自己的总件数，走的是普通折扣逻辑。
function computeUnitPriceForQty(productItem, qty) {
  if (!productItem) return 0;
  const basePrice = parseFloat(productItem.price) || 0;
  const groupId = productItem.tieredPricingGroupId;
  const group = groupId && window.tieredPricingGroups ? window.tieredPricingGroups[groupId] : null;
  const tiers = group ? group.tiers : [];
  if (tiers.length > 0) {
    // 阶梯定价优先于折扣、完全忽略折扣：找到"门槛数量 <= qty"里门槛最高的那一档
    let applicable = null;
    tiers.forEach(tier => {
      if (qty >= tier.minQty) applicable = tier;
    });
    // 买的数量还没达到最低那一档的门槛（比如最低档是买2件，但购物车里只有1件），
    // 这种情况按原价算，不套用任何一档
    return applicable ? applicable.unitPrice : basePrice;
  }
  const discountPercent = productItem.discountPercent;
  if (discountPercent !== null && discountPercent !== undefined && !isNaN(discountPercent)) {
    return basePrice * (1 - discountPercent / 100);
  }
  return basePrice;
}

// 按 productId 把购物车里所有行的数量加总——商品没有加入阶梯定价分组时，
// 折扣逻辑仍然是"看这款商品自己买了几件"（目前折扣本身不分档，这个总数暂时没用在计价上，
// 只是保留给 getCartItemUnitPrice 在找不到分组时做兜底）。
function buildQtyByProductMap(cartItems) {
  const map = {};
  cartItems.forEach(item => { map[item.productId] = (map[item.productId] || 0) + item.qty; });
  return map;
}

// 按"阶梯定价分组"把购物车里所有商品的数量加总——同一个分组里不管是哪几款商品、
// 各买了几件，统统加在一起去匹配这个分组的价目表。不属于任何分组的商品不会出现在这个表里。
function buildQtyByGroupMap(cartItems) {
  const map = {};
  cartItems.forEach(item => {
    const productItem = window.productsById ? window.productsById[item.productId] : null;
    const groupId = productItem ? productItem.tieredPricingGroupId : null;
    if (!groupId) return;
    map[groupId] = (map[groupId] || 0) + item.qty;
  });
  return map;
}

// 某一行购物车现在的实际单价（用于购物车抽屉/结算页逐行显示）。
// qtyByGroup/qtyByProduct 都是可选的预先算好的数量表，批量计算小计时传进来避免重复遍历购物车；
// 单独算一行时不传也可以，函数自己会按当前这一份购物车（cart）现算。
function getCartItemUnitPrice(item, qtyByGroup, qtyByProduct) {
  const productItem = window.productsById ? window.productsById[item.productId] : null;
  if (!productItem) return item.price; // 查不到商品数据（比如商品已被下架删除），退回购物车里存的原价
  const groupId = productItem.tieredPricingGroupId;
  if (groupId) {
    const groupMap = qtyByGroup || buildQtyByGroupMap(cart);
    const totalQtyForGroup = groupMap[groupId] || item.qty;
    return computeUnitPriceForQty(productItem, totalQtyForGroup);
  }
  const productMap = qtyByProduct || buildQtyByProductMap(cart);
  const totalQtyForProduct = productMap[item.productId] || item.qty;
  return computeUnitPriceForQty(productItem, totalQtyForProduct);
}

// 购物车/结算页小计：每一行按"这一行的实际单价 × 这一行自己的数量"累加。
// 分组数量和商品数量分别算一次、传给每一行用，避免每行都重新遍历一次购物车。
function computeCartSubtotal(cartItems) {
  const qtyByGroup = buildQtyByGroupMap(cartItems);
  const qtyByProduct = buildQtyByProductMap(cartItems);
  return cartItems.reduce((sum, item) => sum + getCartItemUnitPrice(item, qtyByGroup, qtyByProduct) * item.qty, 0);
}

// 满额包邮用的"小件商品小计"：只把所属分类 counts_toward_free_shipping !== false 的
// 购物车行计入，家具这类大件默认不计入（见 sql 迁移里的 update ... where id = 'furniture'）
function computeFreeShippingEligibleSubtotal(cartItems) {
  const categoryEligible = {};
  (window.categoriesData || []).forEach(c => { categoryEligible[c.id] = c.counts_toward_free_shipping !== false; });
  const eligibleItems = cartItems.filter(item => categoryEligible[item.category] !== false);
  return computeCartSubtotal(eligibleItems);
}

// nail_options.size_chart 是 jsonb 列，supabase-js 通常直接返回解析好的对象；
// 兼容极少数情况下它以字符串形式返回，做一次安全解析，解析失败或为空一律兜底为 {}。
function robustParseSizeChart(input) {
  if (!input) return {};
  if (typeof input === 'object') return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return {};
}

function robustParseSpec(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch(e){}
    if (input.includes(',')) return input.split(',').map(s=>s.trim());
    return [input];
  }
  return [];
}

// 站点全局文案/背景图：从 Supabase 的 site_settings 表读取（单行 id=1）
// 之前的版本读 localStorage，只在管理员自己的浏览器里生效，顾客端永远看不到——已修复为云端读取。
async function loadSiteDynamicConfig() {
  try {
    const { data: cfg, error } = await supabaseClient
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;
    if (!cfg) return;

    if (cfg.logo && document.getElementById("site-logo-text")) {
      document.getElementById("site-logo-text").innerText = cfg.logo;
    }
    if (cfg.banner && document.getElementById("site-banner-text")) {
      document.getElementById("site-banner-text").innerText = cfg.banner;
    }
    if (cfg.hero_title && document.getElementById("site-hero-title")) {
      document.getElementById("site-hero-title").innerText = cfg.hero_title;
    }
    if (cfg.hero_desc && document.getElementById("site-hero-desc")) {
      document.getElementById("site-hero-desc").innerText = cfg.hero_desc;
    }
    if (cfg.hero_bg) {
      const heroBanner = document.getElementById("site-hero-banner");
      if (heroBanner) {
        heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${cfg.hero_bg}')`;
        heroBanner.style.backgroundSize = 'cover';
        heroBanner.style.backgroundPosition = 'center';
      }
    }
    if (cfg.tax_rate !== null && cfg.tax_rate !== undefined) {
      siteTaxRate = parseFloat(cfg.tax_rate);
    }
    siteFreeShippingThreshold = (cfg.free_shipping_threshold !== null && cfg.free_shipping_threshold !== undefined)
      ? parseFloat(cfg.free_shipping_threshold)
      : null;
    // 虚拟试戴·手模型标定结果（见 sql/add_tryon_hand_zones_column.sql）：后台标定过就用
    // 标定过的精确坐标，没标定过就保持 js/tryon.js 里的默认兜底坐标，不影响正常使用。
    if (cfg.tryon_hand_zones && typeof tryonApplyHandZonesOverride === 'function') {
      tryonApplyHandZonesOverride(cfg.tryon_hand_zones);
    }
    if (cfg.nails_video_url) {
      nailsVideoUrl = cfg.nails_video_url;
      const wrap = document.getElementById('nails-video-wrap');
      if (wrap) wrap.classList.remove('hidden');
    }
  } catch (err) {
    console.error("加载站点配置失败，使用页面默认文案:", err);
  }
}

function initSelections() {
  if (!window.productsData || !window.productsData.nails) return;
  window.productsData.nails.forEach(item => {
    const shapes = Array.isArray(item.shapes) ? item.shapes : [];
    const sizes = Array.isArray(item.sizes) ? item.sizes : [];
    activeSelections[item.id] = {
      shape: shapes[0] || '',
      size: sizes[0] || ''
    };
  });
}

function toggleLanguage() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('site_lang', currentLang);
  const langText = document.getElementById('lang-btn-text');
  if (langText) langText.innerText = currentLang === 'zh' ? '中文' : 'EN';
  renderPage();
  // 结算弹窗开着的时候切语言，renderPage 里那份 data-i18n 批量替换会把税率标签冲回默认的 "8%" 文案，
  // 这里再刷新一次让它显示回真实税率
  const checkoutModal = document.getElementById('modal-checkout');
  if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
    updateCheckoutTotalsUI();
  }
}

function renderPage() {
  const langText = document.getElementById('lang-btn-text');
  if (langText) langText.innerText = currentLang === 'zh' ? '中文' : 'EN';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang] && i18n[currentLang][key]) {
      el.innerText = i18n[currentLang][key];
    }
  });
  // 结算表单等输入框的 placeholder 文案（原来只有被删掉的那份重复脚本在处理这个）
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[currentLang] && i18n[currentLang][key]) {
      el.placeholder = i18n[currentLang][key];
    }
  });
  renderNails();
  renderCategorySections();
  updateCartUI();
}

// 当前每个分类栏目选中的子类型筛选（key 是 categoryId，value 是 subtypeId 或 'all'）
let activeSubtypeFilter = {};

// 按"分类管理"里维护的分类列表（除了穿戴甲——那个栏目因为有试戴/360°/视频徽章这些
// 专属功能，还是保持写死在 index.html 里，不走这套通用渲染），动态生成亚克力/家具/
// 以后新增的任何分类栏目，画进 index.html 里的 #dynamic-categories-root 容器。
function renderCategorySections() {
  const root = document.getElementById('dynamic-categories-root');
  if (!root || !window.categoriesData) return;

  const categories = window.categoriesData.filter(c => c.id !== 'nails');
  if (categories.length === 0) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = categories.map(cat => {
    const items = (window.productsData && window.productsData[cat.id]) || [];
    const subtypes = (window.subtypesData || []).filter(s => s.category_id === cat.id);
    const titleText = currentLang === 'zh' ? cat.name_zh : cat.name_en;
    const subtitleText = currentLang === 'zh' ? (cat.subtitle_zh || '') : (cat.subtitle_en || '');

    // 只有维护过子类型标签的分类才会显示"全部/头饰/耳环/..."这排筛选按钮
    let chipsHtml = '';
    if (subtypes.length > 0) {
      const currentFilter = activeSubtypeFilter[cat.id] || 'all';
      const allLang = currentLang === 'zh' ? '全部' : 'All';
      chipsHtml = `
        <div class="flex flex-wrap gap-1.5 mt-3">
          <button onclick="setSubtypeFilter('${cat.id}', 'all')" class="px-3 py-1 rounded-lg text-xs font-medium transition-all ${currentFilter === 'all' ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">${allLang}</button>
          ${subtypes.map(s => {
            const label = currentLang === 'zh' ? s.name_zh : s.name_en;
            const isActive = String(currentFilter) === String(s.id);
            return `<button onclick="setSubtypeFilter('${cat.id}', ${s.id})" class="px-3 py-1 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">${label}</button>`;
          }).join('')}
        </div>
      `;
    }

    return `
      <section>
        <div class="mb-6 border-b border-stone-200 pb-3">
          <div class="flex items-end justify-between">
            <div>
              <h2 class="text-xl font-bold text-stone-900 font-serif">${titleText}</h2>
              ${subtitleText ? `<p class="text-xs text-stone-400 mt-0.5">${subtitleText}</p>` : ''}
            </div>
          </div>
          ${chipsHtml}
        </div>
        <div id="category-grid-${cat.id}" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      </section>
    `;
  }).join('');

  categories.forEach(cat => renderSimpleCategory(cat));
}

function setSubtypeFilter(categoryId, subtypeIdOrAll) {
  activeSubtypeFilter[categoryId] = subtypeIdOrAll;
  renderCategorySections();
}

// 商品卡片上的价格展示：根据折扣/阶梯定价配置，决定显示原价、折扣价(划线+折扣价)，
// 还是阶梯定价的"起价 + 价目表"。跟购物车/结算页用的是同一份折扣/阶梯定价数据，
// 只是展示形式不同（卡片上还没确定购买数量，阶梯定价这里只能展示"买多少、单价多少"
// 的价目表，不能像购物车那样按"已经买了几件"精确算出当前单价）。
function buildPriceDisplayHtml(item) {
  const basePrice = parseFloat(item.price) || 0;
  const groupId = item.tieredPricingGroupId;
  const group = groupId && window.tieredPricingGroups ? window.tieredPricingGroups[groupId] : null;
  const tiers = group ? group.tiers : [];
  if (tiers.length > 0) {
    const fromLabel = (i18n[currentLang] && i18n[currentLang].tieredPricingFromLabel) ? i18n[currentLang].tieredPricingFromLabel : 'from';
    const lowestUnitPrice = Math.min(...tiers.map(t => t.unitPrice));
    const tierListText = tiers.map(t => `${t.minQty}+: $${t.unitPrice.toFixed(2)}`).join(' · ');
    return `
      <div>
        <div><span class="text-[10px] text-stone-400 uppercase tracking-wide">${fromLabel}</span> <span class="text-xl font-extrabold text-stone-900">$${lowestUnitPrice.toFixed(2)}</span></div>
        <p class="text-[10px] text-stone-400 mt-0.5">${tierListText}</p>
      </div>
    `;
  }
  const discountPercent = item.discountPercent;
  if (discountPercent !== null && discountPercent !== undefined && !isNaN(discountPercent) && discountPercent > 0) {
    const discountedPrice = basePrice * (1 - discountPercent / 100);
    return `
      <div class="flex items-center gap-2">
        <span class="text-xl font-extrabold text-red-600">$${discountedPrice.toFixed(2)}</span>
        <span class="text-xs line-through text-stone-400">$${basePrice.toFixed(2)}</span>
      </div>
    `;
  }
  return `<span class="text-xl font-extrabold text-stone-900">$${basePrice.toFixed(2)}</span>`;
}

// 通用的"固定数量库存"商品卡片渲染——亚克力/家具现在用这个，以后任何新分类
// （比如首饰）默认也是这个模式。accent 和 aspect 由分类自己的配置决定视觉风格，
// 保证不管加多少个新分类，整站看起来还是统一协调的（见 sql/add_categories_system.sql
// 里 categories.card_aspect_ratio / categories.accent 字段的说明）。
function renderSimpleCategory(cat) {
  const container = document.getElementById(`category-grid-${cat.id}`);
  if (!container || !window.productsData) return;

  const currentFilter = activeSubtypeFilter[cat.id] || 'all';
  const allItems = window.productsData[cat.id] || [];
  const items = currentFilter === 'all' ? allItems : allItems.filter(item => String(item.subtypeId) === String(currentFilter));

  const isAmber = cat.accent === 'amber';
  const tagDefaultClass = isAmber ? 'bg-amber-900 text-amber-100' : 'bg-stone-900 text-white';
  const btn360Class = isAmber ? 'bg-amber-800/90 hover:bg-amber-900' : 'bg-black/70 hover:bg-black/90';
  const aspectClass = cat.card_aspect_ratio || 'aspect-square';

  if (items.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-12 text-stone-400">${(i18n[currentLang] && i18n[currentLang].noItemsInFilter) ? i18n[currentLang].noItemsInFilter : 'No items yet.'}</div>`;
    return;
  }

  container.innerHTML = items.map(item => {
    const mainImg = (item.images && item.images.length > 0) ? item.images[0] : (item.spinImage || 'https://via.placeholder.com/400');
    const hasDimensions = (item.length > 0 || item.width > 0 || item.height > 0);
    return `
      <div id="product-card-${item.id}" class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col justify-between h-full">
        <div>
          <div class="relative bg-stone-100 ${aspectClass} overflow-hidden group cursor-pointer" onclick="openZoomModal('${mainImg}')">
            <img src="${mainImg}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <span class="absolute top-3 left-3 ${item.tagClass || tagDefaultClass} text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              ${item.tagKey || 'New'}
            </span>
            <button onclick="event.stopPropagation(); open360Modal('${item.id}')" class="absolute bottom-3 right-3 ${btn360Class} backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm">
              <i class="fa-solid fa-rotate"></i> 360°
            </button>
          </div>
          <div class="p-5 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="text-base font-bold text-stone-900 line-clamp-1">${item.title}</h3>
                <p class="text-xs text-stone-500 line-clamp-1 mt-0.5">${item.subtitle || ''}</p>
              </div>
              ${hasDimensions ? `
                <button onclick="openDimensionsModal('${item.id}', '${cat.id}')" class="text-xs text-amber-800 hover:text-amber-900 underline flex-shrink-0 font-medium">Size Guide</button>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="p-5 pt-0 flex items-center justify-between mt-auto border-t border-stone-50 pt-3">
          ${buildPriceDisplayHtml(item)}
          ${item.stockQuantity > 0 ? `
          <button onclick="addSimpleToCart('${cat.id}', '${item.id}')" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
            + Add
          </button>` : `
          <button disabled class="bg-stone-200 text-stone-400 cursor-not-allowed text-xs font-bold px-5 py-2.5 rounded-xl">
            ${(i18n[currentLang] && i18n[currentLang].soldOutBtn) ? i18n[currentLang].soldOutBtn : 'Sold Out'}
          </button>`}
        </div>
      </div>
    `;
  }).join('');
}

function renderNails() {
  const container = document.getElementById('nails-grid');
  if (!container || !window.productsData) return;
  container.innerHTML = window.productsData.nails.map(item => {
    const currentShape = activeSelections[item.id]?.shape || '';
    const currentSize = activeSelections[item.id]?.size || '';
    const shapes = Array.isArray(item.shapes) ? item.shapes : [];
    const sizes = Array.isArray(item.sizes) ? item.sizes : [];
    const mainImg = (item.images && item.images.length > 0) ? item.images[0] : (item.spinImage || 'https://via.placeholder.com/400');
    return `
      <div id="product-card-${item.id}" class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col justify-between h-full">
        <div>
          <div class="relative bg-stone-100 aspect-square overflow-hidden group cursor-pointer" onclick="openZoomModal('${mainImg}')">
            <img id="main-img-${item.id}" src="${mainImg}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <span class="absolute top-3 left-3 ${item.tagClass || 'bg-stone-900 text-white'} text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              ${item.tagKey || 'New'}
            </span>
            <button onclick="event.stopPropagation(); open360Modal('${item.id}')" class="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm">
              <i class="fa-solid fa-rotate"></i> 360°
            </button>
            <!-- "Try On" 虚拟试戴按钮已暂时从前台下线：这个功能在手机上弹窗会超出屏幕且关不掉，
                 属于还没做好的半成品，先藏起来避免影响顾客下单体验。后台"虚拟试戴·手模型指甲位置
                 标定"那个标定工具还在，数据也都留着，等把手机端的弹窗尺寸问题修好之后随时可以
                 把这个按钮加回来，不用重新标定。 -->
          </div>
          <div class="flex gap-2 p-3 bg-stone-50/50 border-b border-stone-100 overflow-x-auto">
            ${(item.images && item.images.length > 0 ? item.images : [mainImg]).map(img => `
              <button onclick="switchImage('${item.id}', '${img}')" class="w-12 h-12 rounded-lg border-2 border-transparent hover:border-amber-600 overflow-hidden transition-all flex-shrink-0 focus:border-amber-600">
                <img src="${img}" class="w-full h-full object-cover">
              </button>
            `).join('')}
          </div>
          <div class="p-5 space-y-4">
            <div>
              <h3 class="text-base font-bold text-stone-900 line-clamp-1">${item.title}</h3>
              <p class="text-xs text-stone-500 mt-0.5 line-clamp-1">${item.subtitle || ''}</p>
            </div>
            ${shapes.length > 0 ? `
              <div class="space-y-1.5">
                <span class="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Shape:</span>
                <div class="flex flex-wrap gap-1.5">
                  ${shapes.map(s => {
                    const inStock = isShapeInStock(item, s);
                    const isCurrent = currentShape === s;
                    const cls = isCurrent
                      ? 'bg-stone-900 text-white shadow-sm'
                      : (inStock ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' : 'bg-stone-50 text-stone-300 line-through cursor-not-allowed');
                    return `
                    <button ${inStock ? `onclick="selectOption('${item.id}', 'shape', '${s}')"` : 'disabled'} ${inStock ? '' : 'title="Sold out"'} class="px-3 py-1 rounded-lg text-xs font-medium transition-all ${cls}">
                      ${s}
                    </button>
                  `;}).join('')}
                </div>
              </div>
            ` : ''}
            ${sizes.length > 0 ? `
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-stone-400 uppercase tracking-wider">Size:</span>
                  <button onclick="openSizeModal('${item.id}')" class="text-xs text-amber-800 underline hover:text-amber-900">Size Guide</button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  ${sizes.map(sz => {
                    const inStock = isSizeInStock(item, currentShape, sz);
                    const isCurrent = currentSize === sz;
                    const cls = isCurrent
                      ? 'bg-stone-900 text-white shadow-sm'
                      : (inStock ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' : 'bg-stone-50 text-stone-300 line-through cursor-not-allowed');
                    return `
                    <button ${inStock ? `onclick="selectOption('${item.id}', 'size', '${sz}')"` : 'disabled'} ${inStock ? '' : 'title="Sold out"'} class="px-3 py-1 rounded-lg text-xs font-medium transition-all ${cls}">
                      ${sz}
                    </button>
                  `;}).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="p-5 pt-0 flex items-center justify-between mt-auto border-t border-stone-50 pt-3">
          ${buildPriceDisplayHtml(item)}
          ${(isShapeInStock(item, currentShape) && isSizeInStock(item, currentShape, currentSize)) ? `
          <button onclick="addNailToCart('${item.id}')" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
            + Add
          </button>` : `
          <button disabled class="bg-stone-200 text-stone-400 cursor-not-allowed text-xs font-bold px-5 py-2.5 rounded-xl">
            ${(i18n[currentLang] && i18n[currentLang].soldOutBtn) ? i18n[currentLang].soldOutBtn : 'Sold Out'}
          </button>`}
        </div>
      </div>
    `;
  }).join('');
}

// 原来这里是 renderMerch() / renderFurniture() 两个几乎一模一样的函数，各自写死
// 对应 '#merch-grid' / '#furniture-grid'。现在亚克力和家具都和以后新增的分类一样，
// 统一交给上面的 renderCategorySections() / renderSimpleCategory() 动态生成和渲染，
// 这两个函数已经不再被调用，删掉以免跟新逻辑并存造成混淆。

// --- 通用商品尺寸/规格指南弹窗控制与 毫米(mm) / 英寸(in) 实时双向换算 ---
function openDimensionsModal(id, category) {
  const item = window.productsData[category]?.find(i => i.id === id);
  if (!item) return;
  currentDimensionProductId = id;

  document.getElementById('dim-modal-title').innerText = item.title;

  // 默认以毫米 mm 展示
  updateDimensionsModalContent('mm');

  // 重置单位按钮样式
  document.getElementById('dim-btn-mm').className = "px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold transition-all";
  document.getElementById('dim-btn-in').className = "px-3 py-1 rounded-md text-stone-600 hover:text-stone-900 text-xs font-semibold transition-all";

  document.getElementById('modal-dimensions')?.classList.remove('hidden');
}

function closeDimensionsModal() {
  document.getElementById('modal-dimensions')?.classList.add('hidden');
  currentDimensionProductId = null;
}

function switchDimensionsUnit(unit) {
  const btnMm = document.getElementById('dim-btn-mm');
  const btnIn = document.getElementById('dim-btn-in');
  if (unit === 'in') {
    btnIn.className = "px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold transition-all";
    btnMm.className = "px-3 py-1 rounded-md text-stone-600 hover:text-stone-900 text-xs font-semibold transition-all";
  } else {
    btnMm.className = "px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold transition-all";
    btnIn.className = "px-3 py-1 rounded-md text-stone-600 hover:text-stone-900 text-xs font-semibold transition-all";
  }
  updateDimensionsModalContent(unit);
}

function updateDimensionsModalContent(unit) {
  if (!currentDimensionProductId) return;
  let item = window.productsData.merch?.find(i => i.id === currentDimensionProductId) ||
             window.productsData.furniture?.find(i => i.id === currentDimensionProductId);
  if (!item) return;

  const l = item.length || 0;
  const w = item.width || 0;
  const h = item.height || 0;

  const container = document.getElementById('dim-modal-values');
  if (!container) return;

  if (unit === 'in') {
    // 毫米转英寸：除以 25.4，保留 2 位小数
    container.innerHTML = `
      <div class="flex justify-between py-2 border-b border-stone-100"><span class="text-stone-500">Length</span><span class="font-bold text-stone-800">${(l / 25.4).toFixed(2)} in</span></div>
      <div class="flex justify-between py-2 border-b border-stone-100"><span class="text-stone-500">Width</span><span class="font-bold text-stone-800">${(w / 25.4).toFixed(2)} in</span></div>
      <div class="flex justify-between py-2"><span class="text-stone-500">Height</span><span class="font-bold text-stone-800">${(h / 25.4).toFixed(2)} in</span></div>
    `;
  } else {
    // 毫米原值展示
    container.innerHTML = `
      <div class="flex justify-between py-2 border-b border-stone-100"><span class="text-stone-500">Length</span><span class="font-bold text-stone-800">${l} mm</span></div>
      <div class="flex justify-between py-2 border-b border-stone-100"><span class="text-stone-500">Width</span><span class="font-bold text-stone-800">${w} mm</span></div>
      <div class="flex justify-between py-2"><span class="text-stone-500">Height</span><span class="font-bold text-stone-800">${h} mm</span></div>
    `;
  }
}

// 商品完全没有 nail_variant_stock 记录时视为"库存未配置"，沿用老行为不阻拦购买
function nailStockConfigured(item) {
  return !!item.stockMap && Object.keys(item.stockMap).length > 0;
}
// 某个甲型下是否还有至少一个尺寸有货
function isShapeInStock(item, shape) {
  if (!nailStockConfigured(item)) return true;
  const sizesForShape = item.stockMap[shape] || {};
  const sizes = Array.isArray(item.sizes) ? item.sizes : [];
  if (sizes.length === 0) return Object.values(sizesForShape).some(v => v);
  return sizes.some(sz => !!sizesForShape[sz]);
}
// 某个甲型 + 尺寸的组合是否有货
function isSizeInStock(item, shape, size) {
  if (!nailStockConfigured(item)) return true;
  if (!shape) return true;
  const sizesForShape = item.stockMap[shape] || {};
  return !!sizesForShape[size];
}

function selectOption(id, type, value) {
  if (!activeSelections[id]) activeSelections[id] = {};
  activeSelections[id][type] = value;
  if (type === 'shape') {
    const item = window.productsData.nails.find(n => n.id === id);
    if (item) {
      const sizes = Array.isArray(item.sizes) ? item.sizes : [];
      const currentSize = activeSelections[id].size;
      // 切换甲型后，如果原来选的尺寸在新甲型下缺货，自动换成这个甲型下第一个有货的尺寸
      if (!isSizeInStock(item, value, currentSize)) {
        const firstAvailable = sizes.find(sz => isSizeInStock(item, value, sz));
        if (firstAvailable) activeSelections[id].size = firstAvailable;
      }
    }
  }
  renderNails();
}

function switchImage(id, src) {
  const img = document.getElementById(`main-img-${id}`);
  if (img) img.src = src;
}

// 向后端 check_cart_stock 这个 RPC 核对一遍购物车里每一项现在是否还有足够库存
// （古董家具数量本来就是1，不参与这个检查；穿戴甲/亚克力制品都会查）。
// 用"请求序号"丢弃过时结果的写法跟运费询价那边是同一个套路：购物车在请求还没返回时
// 又被改了（比如连续点了好几次加减号），只采纳最后一次请求的结果。
async function refreshCartStockStatus() {
  if (cart.length === 0) {
    cartStockStatus = {};
    updateCartUI();
    return;
  }
  const mySeq = ++cartStockCheckSeq;
  const snapshot = cart.slice(); // 这次查询对应的购物车快照，用下标对齐结果，不靠重新拼 key
  const items = snapshot.map(item => ({
    product_id: item.productId,
    qty: item.qty,
    variant_shape: item.shape || null,
    variant_size: item.size || null
  }));
  try {
    const { data, error } = await supabaseClient.rpc('check_cart_stock', { p_items: items });
    if (mySeq !== cartStockCheckSeq) return; // 购物车在请求过程中又变了，这次结果已经过时，丢弃
    if (error) throw error;
    const statusMap = {};
    (data || []).forEach((row, idx) => {
      const cartItem = snapshot[idx];
      if (cartItem) statusMap[cartItem.cartItemId] = { qtyAvailable: row.qty_available, sufficient: row.sufficient };
    });
    cartStockStatus = statusMap;
  } catch (err) {
    console.error('购物车库存核对失败:', err);
    // 查询本身失败就不拦着顾客——这只是提前提醒，真正兜底的原子检查在下单那一步还在
  }
  updateCartUI();
}

// 购物车数量用 +/- 按钮连续点击时，库存核对加个小防抖，不用每点一下就请求一次
let cartStockCheckTimer = null;
function scheduleCartStockCheck() {
  if (cartStockCheckTimer) clearTimeout(cartStockCheckTimer);
  cartStockCheckTimer = setTimeout(refreshCartStockStatus, 400);
}

function addNailToCart(id) {
  const item = window.productsData.nails.find(n => n.id === id);
  if (!item) return;
  const sel = activeSelections[id] || {};
  // 兜底检查：就算按钮意外被点到（比如页面没来得及重新渲染），这里再挡一次已售罄的规格
  if (!isShapeInStock(item, sel.shape) || !isSizeInStock(item, sel.shape, sel.size)) {
    alert((i18n[currentLang] && i18n[currentLang].variantSoldOutAlert) ? i18n[currentLang].variantSoldOutAlert : 'Sorry, this shape/size is currently sold out.');
    renderNails();
    return;
  }
  const cartItemId = `${id}-${sel.shape || ''}-${sel.size || ''}`;
  const existing = cart.find(c => c.cartItemId === cartItemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId,
      productId: id,
      category: 'nails',
      title: item.title,
      price: parseFloat(item.price),
      image: (item.images && item.images.length > 0) ? item.images[0] : item.spinImage,
      shape: sel.shape,
      size: sel.size,
      qty: 1
    });
  }
  updateCartUI();
  openCartDrawer();
  refreshCartStockStatus();
}

function addSimpleToCart(category, id) {
  const item = window.productsData[category].find(i => i.id === id);
  if (!item) return;
  const existing = cart.find(c => c.cartItemId === id);
  const nextQty = (existing ? existing.qty : 0) + 1;
  if (nextQty > (item.stockQuantity || 0)) {
    alert((i18n[currentLang] && i18n[currentLang].variantSoldOutAlert) ? i18n[currentLang].variantSoldOutAlert : 'Sorry, this item is currently sold out or you have reached the available stock.');
    renderPage();
    return;
  }
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId: id,
      productId: id,
      category: category,
      title: item.title,
      price: parseFloat(item.price),
      image: (item.images && item.images.length > 0) ? item.images[0] : item.spinImage,
      qty: 1
    });
  }
  updateCartUI();
  openCartDrawer();
  refreshCartStockStatus();
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = computeCartSubtotal(cart);
  if (badge) {
    badge.innerText = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  }
  if (totalEl) totalEl.innerText = `$${subtotal.toFixed(2)}`;

  // 任意一项库存核对结果为"不够"，就不让顾客进到结算页，先在购物车里把它解决掉
  const anyInsufficient = cart.some(item => {
    const status = cartStockStatus[item.cartItemId];
    return status && status.sufficient === false;
  });
  const checkoutBtn = document.getElementById('proceed-checkout-btn');
  const warningBanner = document.getElementById('cart-stock-warning-banner');
  if (checkoutBtn) {
    checkoutBtn.disabled = anyInsufficient;
    checkoutBtn.classList.toggle('opacity-50', anyInsufficient);
    checkoutBtn.classList.toggle('cursor-not-allowed', anyInsufficient);
  }
  if (warningBanner) {
    warningBanner.classList.toggle('hidden', !anyInsufficient);
    warningBanner.textContent = i18n[currentLang] ? i18n[currentLang].cartStockWarningBanner : 'Some items in your bag exceed available stock. Please adjust the quantity before checkout.';
  }

  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 text-stone-400 space-y-3">
        <i class="fa-solid fa-bag-shopping text-4xl"></i>
        <p class="text-sm font-medium" data-i18n="cartEmpty">${i18n[currentLang] ? i18n[currentLang].cartEmpty : 'Your cart is empty.'}</p>
      </div>
    `;
    return;
  }
  const qtyByGroup = buildQtyByGroupMap(cart);
  const qtyByProduct = buildQtyByProductMap(cart);
  container.innerHTML = cart.map(item => {
    const status = cartStockStatus[item.cartItemId];
    let stockWarningHtml = '';
    if (status && status.sufficient === false) {
      const avail = status.qtyAvailable;
      const lang = i18n[currentLang] || i18n.en;
      let text;
      if (!avail || avail <= 0) {
        text = lang.cartStockOutOfStock;
      } else if (avail === 1) {
        text = lang.cartStockInsufficientOne;
      } else {
        text = (lang.cartStockInsufficientMany || 'Only {n} left in stock').replace('{n}', avail);
      }
      stockWarningHtml = `<p class="text-[11px] text-red-600 font-semibold mt-1"><i class="fa-solid fa-triangle-exclamation"></i> ${text}</p>`;
    }
    // 这一行现在的实际单价（已经套用折扣/阶梯定价）。跟购物车里存的原价不一样时，
    // 原价划线显示，实际单价用深色加粗突出，方便顾客看出"为什么比标价便宜"。
    const unitPrice = getCartItemUnitPrice(item, qtyByGroup, qtyByProduct);
    const hasPriceAdjustment = Math.abs(unitPrice - item.price) > 0.004;
    const priceHtml = hasPriceAdjustment
      ? `<p class="text-xs mt-1"><span class="line-through text-stone-400 mr-1.5">$${item.price.toFixed(2)}</span><span class="font-extrabold text-amber-700">$${unitPrice.toFixed(2)}</span></p>`
      : `<p class="text-xs font-extrabold text-amber-700 mt-1">$${unitPrice.toFixed(2)}</p>`;
    return `
    <div class="flex items-center gap-4 bg-stone-50 p-3.5 rounded-xl border ${status && status.sufficient === false ? 'border-red-300' : 'border-stone-100'}">
      <img src="${item.image}" class="w-16 h-16 object-cover rounded-lg bg-white shadow-sm">
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-stone-900 truncate">${item.title}</h4>
        ${item.shape ? `<p class="text-[11px] text-stone-500 mt-0.5">${item.shape} /${item.size}</p>` : ''}
        ${priceHtml}
        ${stockWarningHtml}
      </div>
      <div class="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200">
        <button onclick="changeQty('${item.cartItemId}', -1)" class="text-stone-500 hover:text-stone-900 font-bold px-1 text-xs">-</button>
        <input type="number" min="1" step="1" value="${item.qty}"
          onchange="setQty('${item.cartItemId}', this.value)"
          class="w-9 text-xs font-bold text-center text-stone-800 border-0 focus:ring-0 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
        <button onclick="changeQty('${item.cartItemId}', 1)" class="text-stone-500 hover:text-stone-900 font-bold px-1 text-xs">+</button>
      </div>
    </div>
  `;
  }).join('');
}

// 亚克力制品/古董家具能查到确切总库存，用来当数量上限；穿戴甲按甲型+尺寸只公开"有没有货"的布尔值，
// 查不到具体数字，这里就不做硬性数量上限（下单时后台触发器仍然会把库存扣到 0 为止，不会扣成负数）
function getMaxQtyForCartItem(item) {
  if (!item.category || item.category === 'nails') return Infinity;
  const productItem = window.productsData[item.category]?.find(p => p.id === item.productId);
  return productItem ? (productItem.stockQuantity || 0) : Infinity;
}

function changeQty(cartItemId, delta) {
  const item = cart.find(c => c.cartItemId === cartItemId);
  if (!item) return;
  const maxQty = getMaxQtyForCartItem(item);
  const nextQty = item.qty + delta;
  if (delta > 0 && nextQty > maxQty) {
    alert((i18n[currentLang] && i18n[currentLang].variantSoldOutAlert) ? i18n[currentLang].variantSoldOutAlert : 'Sorry, you have reached the available stock.');
    return;
  }
  item.qty = nextQty;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.cartItemId !== cartItemId);
  }
  updateCartUI();
  scheduleCartStockCheck();
}

// 购物车数量输入框手动填数字：清理非法输入、按库存封顶，填 0 或空则直接从购物车移除
function setQty(cartItemId, rawValue) {
  const item = cart.find(c => c.cartItemId === cartItemId);
  if (!item) return;
  let val = parseInt(rawValue, 10);
  if (isNaN(val) || val < 1) {
    cart = cart.filter(c => c.cartItemId !== cartItemId);
    updateCartUI();
    return;
  }
  const maxQty = getMaxQtyForCartItem(item);
  if (val > maxQty) {
    alert((i18n[currentLang] && i18n[currentLang].variantSoldOutAlert) ? i18n[currentLang].variantSoldOutAlert : 'Sorry, you have reached the available stock.');
    val = maxQty;
  }
  item.qty = val;
  updateCartUI();
  scheduleCartStockCheck();
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const panel = document.getElementById('cart-panel');
  if (!drawer) return;
  drawer.classList.remove('pointer-events-none');
  overlay.classList.remove('opacity-0');
  panel.classList.remove('translate-x-full');
  // 每次打开购物车都顺手核对一遍库存——顾客可能隔了一段时间才回来看购物车，
  // 这段时间里别的顾客可能已经把某个规格买完了
  refreshCartStockStatus();
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const panel = document.getElementById('cart-panel');
  if (!drawer) return;
  overlay.classList.add('opacity-0');
  panel.classList.add('translate-x-full');
  setTimeout(() => {
    drawer.classList.add('pointer-events-none');
  }, 300);
}

function toggleCartDrawer() {
  const panel = document.getElementById('cart-panel');
  if (panel && panel.classList.contains('translate-x-full')) {
    openCartDrawer();
  } else {
    closeCartDrawer();
  }
}

// --- Zoom Modal ---
function openZoomModal(imgSrc) {
  const img = document.getElementById('modal-img-zoom');
  if (img) img.src = imgSrc;
  zoomScale = 1;
  zoomTranslateX = 0;
  zoomTranslateY = 0;
  updateZoomTransform();
  document.getElementById('modal-zoom')?.classList.remove('hidden');
}

function closeZoomModal() {
  document.getElementById('modal-zoom')?.classList.add('hidden');
}

function updateZoomTransform() {
  const img = document.getElementById('modal-img-zoom');
  if (img) {
    img.style.transform = `translate(${zoomTranslateX}px, ${zoomTranslateY}px) scale(${zoomScale})`;
  }
}

function setupZoomEvents() {
  const container = document.getElementById('zoom-container');
  if (!container) return;
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 0.15;
    if (e.deltaY < 0) {
      zoomScale = Math.min(zoomScale + zoomFactor, 4);
    } else {
      zoomScale = Math.max(zoomScale - zoomFactor, 1);
      if (zoomScale === 1) {
        zoomTranslateX = 0;
        zoomTranslateY = 0;
      }
    }
    updateZoomTransform();
  });
  container.addEventListener('mousedown', (e) => {
    if (zoomScale > 1) {
      isZoomDragging = true;
      zoomStartX = e.clientX - zoomTranslateX;
      zoomStartY = e.clientY - zoomTranslateY;
      container.style.cursor = 'grabbing';
    }
  });
  window.addEventListener('mousemove', (e) => {
    if (isZoomDragging) {
      zoomTranslateX = e.clientX - zoomStartX;
      zoomTranslateY = e.clientY - zoomStartY;
      updateZoomTransform();
    }
  });
  window.addEventListener('mouseup', () => {
    isZoomDragging = false;
    if (container) container.style.cursor = zoomScale > 1 ? 'grab' : 'default';
  });
  container.addEventListener('dblclick', () => {
    zoomScale = 1;
    zoomTranslateX = 0;
    zoomTranslateY = 0;
    updateZoomTransform();
  });
}

// --- 360° Modal ---
function open360Modal(id) {
  let item = window.productsData.nails.find(n => n.id === id) ||
             window.productsData.merch.find(m => m.id === id) ||
             window.productsData.furniture.find(f => f.id === id);
  const img = document.getElementById('modal-img-360');
  if (img && item) {
    img.src = item.spinImage || (item.images ? item.images[0] : '');
  }
  currentRotationY = 0;
  apply360Rotation();
  document.getElementById('modal-360')?.classList.remove('hidden');
}

function close360Modal() {
  document.getElementById('modal-360')?.classList.add('hidden');
}

function apply360Rotation() {
  const img = document.getElementById('modal-img-360');
  if (img) {
    img.style.transform = `perspective(1000px) rotateY(${currentRotationY}deg)`;
  }
}

// 穿戴甲手工制作视频：滚动到可视区域才真正开始下载/播放（节省流量），
// 滚出可视区域就暂停（不清空 src，浏览器通常有缓存，再滚回来不用重新下载）
function setupNailsVideoLazyPlay() {
  const wrap = document.getElementById('nails-video-wrap');
  const video = document.getElementById('nails-video');
  if (!wrap || !video || !nailsVideoUrl) return;

  if (!('IntersectionObserver' in window)) {
    // 极少数老浏览器没有这个 API 时，退化成直接加载播放，不做懒加载优化
    video.src = nailsVideoUrl;
    video.autoplay = true;
    video.play().catch(() => {});
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!video.src) {
          video.src = nailsVideoUrl;
          video.load();
        }
        video.play().catch(() => { /* 部分浏览器策略问题导致自动播放失败时，静默忽略，不影响页面其它功能 */ });
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  observer.observe(wrap);
}

// 点一下分区标题旁边的小圆形徽章，弹出居中大窗口完整播放手工制作视频
// （跟页面已有的 360°旋转图/放大图模态是同一套交互：点遮罩或右上角 X 关闭）
function openNailsVideoModal() {
  if (!nailsVideoUrl) return;
  const modal = document.getElementById('modal-nails-video');
  const video = document.getElementById('nails-video-modal');
  if (!modal || !video) return;
  if (!video.src) {
    video.src = nailsVideoUrl;
    video.load();
  }
  modal.classList.remove('hidden');
  video.play().catch(() => {});
}

function closeNailsVideoModal() {
  const modal = document.getElementById('modal-nails-video');
  const video = document.getElementById('nails-video-modal');
  if (modal) modal.classList.add('hidden');
  if (video) video.pause();
}

// 支持形如 你的网址/?product=nail-20-28 的深链接（Meta 商品目录里每个商品的 link 字段用的就是这种）：
// 打开页面后自动滚动到对应的商品卡片，并短暂高亮一下，方便从 IG/FB 广告点进来的顾客一眼找到那件商品
function scrollToDeepLinkedProduct() {
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('product');
  if (!targetId) return;
  // 商品是异步加载渲染的，这里等一小段时间再找，避免卡片还没渲染出来就扑空
  setTimeout(() => {
    const el = document.getElementById(`product-card-${targetId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-4', 'ring-amber-500');
    setTimeout(() => el.classList.remove('ring-4', 'ring-amber-500'), 2500);
  }, 400);
}

function setupSpin360Events() {
  const container = document.getElementById('spin-360-container');
  if (!container) return;
  container.addEventListener('mousedown', (e) => {
    isSpinning = true;
    spinStartX = e.clientX;
    container.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!isSpinning) return;
    const deltaX = e.clientX - spinStartX;
    currentRotationY += deltaX * 0.8;
    spinStartX = e.clientX;
    apply360Rotation();
  });
  window.addEventListener('mouseup', () => {
    isSpinning = false;
    if (container) container.style.cursor = 'grab';
  });
  // 手机端之前只绑定了 mouse 系列事件，手指触屏没有鼠标，拖不动图——这里补上对应的
  // touch 事件，让手机上也能用手指左右滑动来转动 360° 预览图。
  // touchmove 里 preventDefault() 是为了在拖动旋转图片的同时，不要连带把整个页面往下滚动。
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    isSpinning = true;
    spinStartX = e.touches[0].clientX;
  }, { passive: true });
  container.addEventListener('touchmove', (e) => {
    if (!isSpinning || e.touches.length !== 1) return;
    e.preventDefault();
    const deltaX = e.touches[0].clientX - spinStartX;
    currentRotationY += deltaX * 0.8;
    spinStartX = e.touches[0].clientX;
    apply360Rotation();
  }, { passive: false });
  container.addEventListener('touchend', () => {
    isSpinning = false;
  });
}

async function openCheckoutModal() {
  if (cart.length === 0) {
    alert(i18n[currentLang] ? i18n[currentLang].cartEmpty : 'Your cart is empty.');
    return;
  }

  // 最后再核对一遍库存：购物车里打开的时候可能够货，但从打开购物车到点"前往结账"这段
  // 时间里，可能已经被别的顾客买走了——不够的话就把顾客留在购物车里处理，不放他们进结算页，
  // 省得走到最后一步填完地址、算完运费才被拦下来。
  const checkoutDrawerBtn = document.getElementById('proceed-checkout-btn');
  const checkingText = (i18n[currentLang] && i18n[currentLang].checkingStockBtn) ? i18n[currentLang].checkingStockBtn : 'Checking stock...';
  const originalBtnHtml = checkoutDrawerBtn ? checkoutDrawerBtn.innerHTML : '';
  if (checkoutDrawerBtn) {
    checkoutDrawerBtn.disabled = true;
    checkoutDrawerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${checkingText}`;
  }
  await refreshCartStockStatus(); // 这一步内部也会调用 updateCartUI()，按钮状态会一起刷新
  if (checkoutDrawerBtn) checkoutDrawerBtn.innerHTML = originalBtnHtml;

  const anyInsufficient = cart.some(item => {
    const status = cartStockStatus[item.cartItemId];
    return status && status.sufficient === false;
  });
  if (anyInsufficient) {
    alert(i18n[currentLang] ? i18n[currentLang].cartStockWarningBanner : 'Some items in your bag exceed available stock. Please adjust the quantity before checkout.');
    openCartDrawer();
    return;
  }

  // 每次打开结算弹窗都清空上一次选的运费，避免购物车内容变了运费还是旧的
  selectedShippingRate = null;
  currentShippoShipmentId = null;
  currentShippingParcel = null;
  addressValidationFailed = false;
  const addrWarnEl0 = document.getElementById('address-validation-warning');
  if (addrWarnEl0) addrWarnEl0.classList.add('hidden');
  const overrideEl0 = document.getElementById('address-validation-override');
  if (overrideEl0) overrideEl0.checked = false;
  const houseNumWarnEl0 = document.getElementById('address-house-number-warning');
  if (houseNumWarnEl0) houseNumWarnEl0.classList.add('hidden');
  const ratesListEl = document.getElementById('shipping-rates-list');
  if (ratesListEl) ratesListEl.innerHTML = '';
  const manualNoteEl = document.getElementById('shipping-manual-note');
  if (manualNoteEl) manualNoteEl.classList.add('hidden');
  const calcBtn = document.getElementById('calc-shipping-btn');
  if (calcBtn) { calcBtn.disabled = false; calcBtn.classList.remove('hidden'); }

  updateCheckoutTotalsUI();
  document.getElementById('checkout-form').classList.remove('hidden');
  document.getElementById('checkout-success').classList.add('hidden');
  closeCartDrawer();
  document.getElementById('modal-checkout').classList.remove('hidden');

  // 购物车变了（运费被清空了），但地址栏如果还留着上次填的内容（没清空过表单），
  // 不会有任何 input/change 事件触发自动询价——所以这里重置一下"上次算过的地址"记录，
  // 并主动排一次自动计算，地址如果已经填好会立刻重新报价，没填好就什么都不做。
  lastAutoShippingKey = '';
  scheduleAutoCalculateShipping();
}

// 统一刷新结算弹窗里的小计/税费/运费/总计，运费没算出来之前显示 "--"
function updateCheckoutTotalsUI() {
  const subtotal = computeCartSubtotal(cart);
  const tax = subtotal * siteTaxRate;
  const shippingCost = selectedShippingRate ? selectedShippingRate.amount : 0;
  const total = subtotal + tax + shippingCost;
  document.getElementById('checkout-subtotal').innerText = `$${subtotal.toFixed(2)}`;
  document.getElementById('checkout-tax').innerText = `$${tax.toFixed(2)}`;
  // 税率标签跟着后台设置的百分比动态显示（而不是写死的 "8%"）
  const taxLabelEl = document.querySelector('[data-i18n="taxLabel"]');
  if (taxLabelEl) {
    const pct = (siteTaxRate * 100).toFixed(2).replace(/\.?0+$/, '');
    const isZh = currentLang === 'zh';
    taxLabelEl.innerText = isZh ? `预估税费 (${pct}%):` : `Est. Tax (${pct}%):`;
  }
  const shippingEl = document.getElementById('checkout-shipping');
  if (shippingEl) {
    shippingEl.innerText = selectedShippingRate ? `$${shippingCost.toFixed(2)}` : '--';
  }
  document.getElementById('checkout-total').innerText = `$${total.toFixed(2)}`;
  return { subtotal, tax, shippingCost, total };
}

// 粗略判断地址栏是不是漏填了门牌号——真实街道地址几乎总是"数字 + 空格 + 街道名"
// （123 Main St），例外是邮政信箱（PO Box / P.O. Box）。
//
// 这里有个真实踩过的坑：不能简单判断"是不是数字开头"——Tommy 真实测试时踩到的那笔订单
// 地址就是"47th St"，这本身就是数字开头（"47"），但它其实是"第47街"这个街道名的序数词，
// 后面根本没有再接真正的门牌号。所以要进一步排除"数字后面紧跟 st/nd/rd/th 这种序数后缀"
// 的情况（47th / 1st / 2nd / 3rd...），只有数字后面直接是空格、或数字+字母单元号
// （比如 123A）才当成"像是有门牌号"。
// 不是为了做到完全准确（没法比 Shippo/USPS 自己判断得更准），只是在顾客填完表单的第一时间
// 先拦一道最常见、最明显的那种缺漏，不用等到后台点"生成运单"才发现、黄花菜都凉了。
function looksLikeMissingHouseNumber(address) {
  const trimmed = (address || '').trim();
  if (!trimmed) return false;
  if (/^p\.?\s*o\.?\s*box\b/i.test(trimmed)) return false; // PO Box / P.O. Box，放行
  const m = trimmed.match(/^(\d+)([A-Za-z]*)(?=[\s,]|$)/);
  if (!m) return true; // 完全不是"数字开头"，肯定没有门牌号
  const suffix = m[2];
  if (suffix && /^(st|nd|rd|th)$/i.test(suffix)) return true; // "47th St" 这种，数字其实是街道序数名
  return false; // "123 Main St" / "123A Main St" 这种，像是带了正常门牌号
}

// 把当前地址 + 购物车换算出的包裹信息发给后端 /api/shipping-rates，由后端拿着 Shippo 密钥去
// 实时询价，前台只拿回一份可选的快递方式列表。现在地址四项填完整后会自动触发（见下面
// scheduleAutoCalculateShipping），这个函数本身不区分是自动触发的还是点按钮手动触发的；
// isManualClick 只用于：手动点按钮时，就算地址跟上次自动算过的一样，也强制重新查一次
// （比如怀疑运价有变化，想手动刷新一下）。
let shippingCalcSeq = 0; // 请求序号：地址改得快的时候，只采用"最后一次"发出去的请求结果，
                          // 避免网络慢的旧请求把新地址刚算出来的新结果覆盖掉
async function calculateShipping(isManualClick) {
  const address = document.getElementById('cust-address').value.trim();
  const address2 = document.getElementById('cust-address2')?.value.trim() || '';
  const city = document.getElementById('cust-city').value.trim();
  const state = document.getElementById('cust-state').value;
  const zip = document.getElementById('cust-zip').value.trim();
  const firstName = document.getElementById('cust-first-name').value.trim();
  const lastName = document.getElementById('cust-last-name').value.trim();

  const houseNumWarnEl = document.getElementById('address-house-number-warning');
  const addrWarnEl = document.getElementById('address-validation-warning');

  if (!address || !city || !state || !zip) {
    if (isManualClick) {
      alert(i18n[currentLang] ? i18n[currentLang].fillAddressFirst : 'Please fill in your address, city, state and zip first.');
    }
    return;
  }

  // 地址一眼看出来就缺门牌号：直接在这里拦住，不浪费一次询价请求，也不让顾客带着一个
  // 肯定会在"生成运单"那一步失败的地址往下走。清空已选运费，逼着顾客先把地址填完整。
  if (looksLikeMissingHouseNumber(address)) {
    if (houseNumWarnEl) houseNumWarnEl.classList.remove('hidden');
    if (addrWarnEl) addrWarnEl.classList.add('hidden');
    addressValidationFailed = false;
    selectedShippingRate = null;
    const ratesListElEarly = document.getElementById('shipping-rates-list');
    if (ratesListElEarly) ratesListElEarly.innerHTML = '';
    updateCheckoutTotalsUI();
    if (isManualClick) {
      alert(i18n[currentLang] ? i18n[currentLang].addressHouseNumberWarning : 'Please include a house/building number (e.g., "123 Main St"), not just the street name.');
    }
    return;
  }
  if (houseNumWarnEl) houseNumWarnEl.classList.add('hidden');

  const { parcel, needsManualQuote } = computeParcelForCart(cart);
  currentShippingParcel = parcel; // 跟着这次询价一起记下来，下单时随订单存进 orders.shipping_parcel

  const manualNoteEl = document.getElementById('shipping-manual-note');
  const ratesListEl = document.getElementById('shipping-rates-list');
  const calcBtn = document.getElementById('calc-shipping-btn');

  const mySeq = ++shippingCalcSeq;

  // 购物车里只有古董家具（没有可自动算的穿戴甲/亚克力制品）：不调用询价接口，直接提示人工核算
  if (!parcel) {
    if (manualNoteEl) manualNoteEl.classList.remove('hidden');
    if (calcBtn) calcBtn.classList.add('hidden');
    selectedShippingRate = { amount: 0, manual: true };
    updateCheckoutTotalsUI();
    return;
  }

  const calculatingText = (i18n[currentLang] && i18n[currentLang].calculatingShippingBtn) ? i18n[currentLang].calculatingShippingBtn : 'Calculating...';
  const originalBtnText = calcBtn ? calcBtn.innerHTML : '';
  if (calcBtn) { calcBtn.disabled = true; calcBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${calculatingText}`; }
  if (ratesListEl) ratesListEl.innerHTML = '';

  try {
    const resp = await fetch('/api/shipping-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addressTo: { name: `${firstName} ${lastName}`.trim(), street1: address, street2: address2, city, state, zip },
        parcel
      })
    });
    const data = await resp.json();
    if (mySeq !== shippingCalcSeq) return; // 地址在请求过程中又被改了，这次结果已经过时，丢弃
    if (!resp.ok || !data.rates || data.rates.length === 0) {
      throw new Error((data && data.error) || 'no rates');
    }
    currentShippoShipmentId = data.shipmentId;
    renderShippingRates(data.rates);
    // 若含古董家具，同时也提示这部分需要人工核算（穿戴甲/亚克力部分已经能自动询价了）
    if (needsManualQuote && manualNoteEl) manualNoteEl.classList.remove('hidden');

    // Shippo 的地址校验结果（USPS CASS）：地址格式上没问题（能问到运费），但系统认为跟真实
    // 地址对不上（找不到/找到多个匹配）——不是硬错误，所以询价本身仍然成功、仍然显示运费，
    // 只是额外弹出一条软提示，要求顾客勾选确认后才能点"完成支付"（见 processPayment）。
    addressValidationFailed = !!(data.addressValidation && data.addressValidation.is_valid === false);
    if (addrWarnEl) {
      if (addressValidationFailed) {
        const warnTextEl = document.getElementById('address-validation-warning-text');
        const msgs = data.addressValidation.messages;
        const customText = Array.isArray(msgs) && msgs.length > 0 ? msgs.map(m => m.text || m).join('；') : '';
        if (warnTextEl) {
          warnTextEl.innerText = customText || (i18n[currentLang] ? i18n[currentLang].addressValidationWarningDefault : "We couldn't confirm this exact address. Please double-check it before continuing.");
        }
        const overrideEl = document.getElementById('address-validation-override');
        if (overrideEl) overrideEl.checked = false;
        addrWarnEl.classList.remove('hidden');
      } else {
        addrWarnEl.classList.add('hidden');
      }
    }
  } catch (err) {
    if (mySeq !== shippingCalcSeq) return;
    console.error('运费询价失败:', err);
    // 自动触发失败时静默一点，不用弹窗打断正在填表的顾客——地址可能只是还没填完/打错了
    // 还在改，等填对了自动会再触发一次；手动点按钮触发的失败才弹窗提示。
    if (isManualClick) {
      alert(i18n[currentLang] ? i18n[currentLang].shippingCalcError : 'Could not get shipping rates. Please check your address and try again.');
    }
  } finally {
    if (mySeq === shippingCalcSeq && calcBtn) { calcBtn.disabled = false; calcBtn.innerHTML = originalBtnText; }
  }
}

// 自动询价：地址四项（街道/城市/州/邮编）都填写完整后，不用再等顾客去点"计算运费"按钮，
// 自动帮忙查一次运费；输入过程中用防抖（停止输入约0.8秒后才触发）避免打一个字就调一次
// 询价接口，同一个地址也只会自动触发一次（存一份"上次已经自动算过的地址"做对比）。
let shippingAutoCalcTimer = null;
let lastAutoShippingKey = '';

function scheduleAutoCalculateShipping() {
  if (shippingAutoCalcTimer) clearTimeout(shippingAutoCalcTimer);
  shippingAutoCalcTimer = setTimeout(() => {
    const address = document.getElementById('cust-address')?.value.trim();
    const address2 = document.getElementById('cust-address2')?.value.trim() || '';
    const city = document.getElementById('cust-city')?.value.trim();
    const state = document.getElementById('cust-state')?.value;
    const zip = document.getElementById('cust-zip')?.value.trim();
    if (!address || !city || !state || !/^\d{5}$/.test(zip || '')) return; // 地址还没填完整，先不触发

    const key = `${address}|${address2}|${city}|${state}|${zip}`;
    if (key === lastAutoShippingKey) return; // 跟上次自动算过的地址一样，不用重复调用付费接口
    lastAutoShippingKey = key;
    calculateShipping(false);
  }, 800);
}

// 绑定地址四个输入框的事件：文本框用 input（边打字边触发防抖），州下拉框用 change。
// 只需要绑定一次，重复调用会被 dataset 标记挡住。
function setupShippingAutoCalc() {
  const addressFieldIds = ['cust-address', 'cust-address2', 'cust-city', 'cust-zip'];
  addressFieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.autoShippingBound) {
      el.addEventListener('input', scheduleAutoCalculateShipping);
      el.dataset.autoShippingBound = '1';
    }
  });
  const stateEl = document.getElementById('cust-state');
  if (stateEl && !stateEl.dataset.autoShippingBound) {
    stateEl.addEventListener('change', scheduleAutoCalculateShipping);
    stateEl.dataset.autoShippingBound = '1';
  }
}

// 把 Shippo 返回的多个快递方式渲染成单选列表，顾客选中一个后重新计算总价。
//
// 满额包邮（见 sql/add_discount_tiered_pricing_shipping.sql 的 free_shipping_threshold）：
// 达到门槛时，按 Tommy 的要求直接自动选中最便宜的那个方案（后端已经按价格从低到高排好序），
// 但显示给顾客的运费是 $0，不再展示完整的多方案选择列表——顾客只需要知道"免运费"，
// 不需要在一堆已经被折成 $0 的选项里纠结选哪个。
// 保留 realAmount 字段记下 Shippo 真实报价（Tommy 自己实际要付的运费），方便以后做账时
// 核对"包邮"这笔订单实际的物流成本是多少，不会因为显示成 $0 就把真实成本弄丢了。
function renderShippingRates(rates) {
  const container = document.getElementById('shipping-rates-list');
  if (!container) return;

  const eligibleSubtotal = computeFreeShippingEligibleSubtotal(cart);
  const freeShippingQualifies = siteFreeShippingThreshold !== null && siteFreeShippingThreshold !== undefined
    && eligibleSubtotal >= siteFreeShippingThreshold;

  if (freeShippingQualifies && rates.length > 0) {
    const cheapest = rates[0];
    selectedShippingRate = { ...cheapest, amount: 0, realAmount: cheapest.amount, freeShippingApplied: true };
    const msg = (i18n[currentLang] && i18n[currentLang].freeShippingAppliedMsg) ? i18n[currentLang].freeShippingAppliedMsg : 'Your order qualifies for free US shipping!';
    container.innerHTML = `
      <div class="flex items-center justify-between gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs">
        <span class="font-semibold text-green-800">${msg}</span>
        <span class="font-bold text-green-700">$0.00</span>
      </div>
    `;
    container.dataset.rates = JSON.stringify(rates);
    updateCheckoutTotalsUI();
    return;
  }

  const promptText = (i18n[currentLang] && i18n[currentLang].chooseShippingPrompt) ? i18n[currentLang].chooseShippingPrompt : 'Select a shipping option:';
  container.innerHTML = `<p class="text-[11px] text-stone-500 mb-1">${promptText}</p>` + rates.map((rate, idx) => `
    <label class="flex items-center justify-between gap-2 bg-white border rounded-lg px-3 py-2 text-xs cursor-pointer hover:border-amber-700">
      <span class="flex items-center gap-2">
        <input type="radio" name="shipping-rate-choice" value="${idx}" onchange="selectShippingRate(${idx})" ${idx === 0 ? 'checked' : ''}>
        <span class="font-semibold text-stone-800">${rate.carrier} ${rate.service}</span>
        ${rate.days ? `<span class="text-stone-400">(~${rate.days}d)</span>` : ''}
      </span>
      <span class="font-bold text-amber-700">$${rate.amount.toFixed(2)}</span>
    </label>
  `).join('');
  container.dataset.rates = JSON.stringify(rates);
  // 默认选中第一个（最便宜的，因为后端已经按价格从低到高排序过）
  selectShippingRate(0);
}

function selectShippingRate(idx) {
  const container = document.getElementById('shipping-rates-list');
  if (!container || !container.dataset.rates) return;
  const rates = JSON.parse(container.dataset.rates);
  selectedShippingRate = rates[idx];
  updateCheckoutTotalsUI();
}

function closeCheckoutModal() {
  document.getElementById('modal-checkout')?.classList.add('hidden');
}

// 模拟支付：还没接入真实支付网关（Stripe/PayPal 留到最后一步），
// 这里先把订单和收货信息真实存进 Supabase 的 orders / order_items 表，
// 这样后台能看到订单列表，不会像之前那样结算完就什么记录都没留下。
// status 统一标成 pending_test_payment，接入真实支付后再由支付回调改状态。
async function processPayment(e) {
  e.preventDefault();

  // 结算前必须先算出运费（人工核算的家具订单会走上面 calculateShipping() 里的分支，
  // 把 selectedShippingRate 设成 {amount:0, manual:true}，同样算"已确认"）
  if (!selectedShippingRate) {
    alert(i18n[currentLang] ? i18n[currentLang].shippingNotCalculatedYet : 'Please calculate shipping before completing payment.');
    return;
  }

  // 地址明显缺门牌号：不让下单，逼着顾客先把地址栏改完整（跟 calculateShipping 里用的
  // 是同一个判断，这里再查一遍是因为顾客有可能在自动询价成功之后又手动改坏了地址）。
  if (looksLikeMissingHouseNumber(document.getElementById('cust-address').value.trim())) {
    document.getElementById('address-house-number-warning')?.classList.remove('hidden');
    alert(i18n[currentLang] ? i18n[currentLang].addressHouseNumberWarning : 'Please include a house/building number (e.g., "123 Main St"), not just the street name.');
    return;
  }

  // Shippo 对这个收货地址有疑问（见 calculateShipping 里设置的 addressValidationFailed），
  // 且顾客还没勾选"我已确认地址无误"——不直接拦死下单，但必须先让顾客自己确认一遍。
  if (addressValidationFailed && !document.getElementById('address-validation-override')?.checked) {
    alert(i18n[currentLang] ? i18n[currentLang].addressValidationBlockedAlert : "We couldn't verify your shipping address. Please check the box confirming it's correct, or fix the address above, before placing your order.");
    return;
  }

  const firstName = document.getElementById('cust-first-name').value;
  const lastName = document.getElementById('cust-last-name').value;
  const email = document.getElementById('cust-email').value;
  const phone = document.getElementById('cust-phone').value;
  const address = document.getElementById('cust-address').value;
  const address2 = document.getElementById('cust-address2')?.value.trim() || '';
  const city = document.getElementById('cust-city').value;
  const state = document.getElementById('cust-state').value;
  const zip = document.getElementById('cust-zip').value;

  const payBtn = document.getElementById('pay-submit-btn');
  const processingText = (i18n[currentLang] && i18n[currentLang].processingBtn) ? i18n[currentLang].processingBtn : 'Processing...';
  const originalPayBtnText = (i18n[currentLang] && i18n[currentLang].payBtn) ? i18n[currentLang].payBtn : 'Complete Payment (Test Mode)';
  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${processingText}`;

  // 整个下单流程包一层 try/catch/finally：之前这里没有兜底，万一中间任何一步意外抛出异常
  // （比如网络瞬断、Supabase 请求本身失败而不是"正常返回一个错误对象"），按钮会卡在
  // "处理中..."再也点不动、顾客就此卡死在结算页出不去。现在不管成功、失败、还是报错，
  // finally 里都会把按钮恢复成可点击状态。
  // 用这个标记区分"下单成功、按钮恢复交给下面那个 setTimeout 去做"还是"失败/异常、
  // 按钮要在 finally 里立刻恢复"——比在 finally 里反过来猜 DOM 状态更直接可靠。
  let orderSucceeded = false;
  try {
    const { subtotal, tax, shippingCost, total } = updateCheckoutTotalsUI();
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    // 建单和查库存、扣库存放进同一个数据库函数（一个事务）里做：
    // 只要购物车里有任何一项数量超过实际库存，整单直接被数据库拒绝，不会写入任何数据，
    // 也就不会再出现"选了5件、库存只有1件，也照样按5件收钱成交"的情况。
    const orderPayload = {
      id: orderId,
      status: 'pending_test_payment',
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      address: address,
      address2: address2 || null,
      city: city,
      state: state,
      zip: zip,
      subtotal: subtotal,
      tax: tax,
      total: total,
      shipping_cost: shippingCost,
      shipping_carrier: selectedShippingRate.manual ? null : selectedShippingRate.carrier,
      shipping_service: selectedShippingRate.manual ? null : selectedShippingRate.service,
      shippo_rate_id: selectedShippingRate.manual ? null : selectedShippingRate.rateId,
      shippo_shipment_id: currentShippoShipmentId,
      // 存下这次询价用的包裹信息，后台"生成运单"时如果发现报价已过期，要拿这份信息重新询价
      shipping_parcel: selectedShippingRate.manual ? null : currentShippingParcel,
      needs_manual_shipping: !!selectedShippingRate.manual,
      // 包邮订单显示给顾客的运费是 $0，但 Tommy 自己实际还是要付这笔 Shippo 报价的真实运费——
      // 这里把真实金额单独记一下，方便以后做账核对包邮订单实际花了多少物流成本，
      // 不会因为订单上显示的是 $0 就把这笔真实支出弄丢。没有包邮时这里跟 shipping_cost 一样。
      shipping_cost_actual: (selectedShippingRate.realAmount !== undefined && selectedShippingRate.realAmount !== null)
        ? selectedShippingRate.realAmount
        : shippingCost
    };
    // unit_price 要记"顾客这一行实际成交的单价"（已经套用折扣/阶梯定价），不是购物车里存的
    // 原价——不然订单记录会跟顾客实际付的钱不一致，对账会对不上。
    const qtyByGroupForOrder = buildQtyByGroupMap(cart);
    const qtyByProductForOrder = buildQtyByProductMap(cart);
    const itemsPayload = cart.map(item => ({
      product_id: item.productId || item.cartItemId,
      title: item.title,
      unit_price: getCartItemUnitPrice(item, qtyByGroupForOrder, qtyByProductForOrder),
      qty: item.qty,
      variant_shape: item.shape || null,
      variant_size: item.size || null
    }));

    const { error: rpcError } = await supabaseClient.rpc('create_order_with_stock_check', {
      p_order: orderPayload,
      p_items: itemsPayload
    });

    if (rpcError) {
      // 把 Supabase 返回的完整错误对象（message/details/hint/code）都打出来，而不是只打
      // message——以后再遇到"显示通用提示但原因不明"的情况，打开浏览器控制台（F12）就能
      // 看到完整原因，不用再靠猜。
      console.error('下单失败，完整错误信息:', {
        message: rpcError.message, details: rpcError.details, hint: rpcError.hint, code: rpcError.code
      });
      // 数据库那边报的是库存不足的具体原因（中文），直接展示给顾客；其它意外错误则给通用提示
      const isStockError = rpcError.message && rpcError.message.indexOf('库存不足') !== -1;
      alert(isStockError ? rpcError.message : ((i18n[currentLang] && i18n[currentLang].orderFailedGeneric) ? i18n[currentLang].orderFailedGeneric : 'Order failed, please adjust the quantity and try again.'));

      // 下单失败大概率是因为库存刚好被别人买完/数据有变化，刷新一下商品数据和购物车里的
      // 库存核对结果，让页面反映最新库存，顾客不用自己刷新页面
      const cloudData = await fetchProductsIndependentJoin();
      if (cloudData) { window.productsData = cloudData; }
      renderPage();
      await refreshCartStockStatus();
      return;
    }

    // 下单成功：同样刷新一次商品/库存数据，这样别的还在浏览页面的顾客能马上看到最新库存状态，
    // 不用手动刷新页面才发现某个规格已经被买光了
    const cloudData = await fetchProductsIndependentJoin();
    if (cloudData) { window.productsData = cloudData; }
    orderSucceeded = true;

    setTimeout(() => {
      document.getElementById('checkout-form').classList.add('hidden');
      document.getElementById('checkout-success').classList.remove('hidden');
      document.getElementById('success-cust-name').innerText = `${firstName} ${lastName}`;
      const orderIdEl = document.getElementById('success-order-id');
      if (orderIdEl) orderIdEl.innerText = orderId;
      cart = [];
      cartStockStatus = {};
      selectedShippingRate = null;
      currentShippoShipmentId = null;
      currentShippingParcel = null;
      addressValidationFailed = false;
      updateCartUI();
      renderPage();
      payBtn.disabled = false;
      payBtn.innerText = originalPayBtnText;
    }, 1200);
  } catch (err) {
    // 意料之外的异常（网络瞬断、Supabase 请求本身抛出而不是正常返回错误对象等）：
    // 同样打印完整信息方便排查，并且照常提示顾客、恢复按钮，而不是让页面卡死。
    console.error('下单流程出现意外异常:', err);
    alert((i18n[currentLang] && i18n[currentLang].orderFailedGeneric) ? i18n[currentLang].orderFailedGeneric : 'Order failed, please adjust the quantity and try again.');
  } finally {
    // 成功时按钮的恢复已经交给上面那个 setTimeout 去做（要配合"支付成功"动画的节奏，
    // 1.2 秒后才恢复）；这里只处理"没走到成功流程"的情况——库存不足/下单失败，或者
    // 中途抛出了意料之外的异常——确保按钮无论如何都不会卡在"处理中..."。
    if (!orderSucceeded) {
      payBtn.disabled = false;
      payBtn.innerText = originalPayBtnText;
    }
  }
}

// --- 穿戴甲尺码对照弹窗：行业标准参考值 + 商家自定义覆盖，mm/in 双向换算 ---
function openSizeModal(id) {
  const item = window.productsData.nails.find(n => n.id === id);
  if (!item) return;
  currentSizeGuideProductId = id;

  const titleEl = document.getElementById('size-modal-title');
  const noteEl = document.getElementById('size-modal-note');
  const sizeGuideLabel = (i18n[currentLang] && i18n[currentLang].sizeGuide) ? i18n[currentLang].sizeGuide : 'Size Guide';
  if (titleEl) titleEl.innerText = `${item.title} — ${sizeGuideLabel}`;

  const hasCustom = item.sizeChart && Object.keys(item.sizeChart).length > 0;
  if (noteEl) {
    noteEl.innerText = hasCustom
      ? (currentLang === 'zh' ? '含商家自定义尺寸，未特别标注的沿用行业标准参考值' : 'Includes seller-provided sizes; unmarked values use industry standard')
      : (currentLang === 'zh' ? '行业标准参考尺寸，具体以到手实物为准' : 'Industry standard reference sizes');
  }

  renderSizeModalContent('mm');
  const btnMm = document.getElementById('size-btn-mm');
  const btnIn = document.getElementById('size-btn-in');
  if (btnMm) btnMm.className = "px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold transition-all";
  if (btnIn) btnIn.className = "px-3 py-1 rounded-md text-stone-600 hover:text-stone-900 text-xs font-semibold transition-all";

  document.getElementById('modal-size')?.classList.remove('hidden');
}

function closeSizeModal() {
  document.getElementById('modal-size')?.classList.add('hidden');
  currentSizeGuideProductId = null;
}

function switchSizeUnit(unit) {
  const btnMm = document.getElementById('size-btn-mm');
  const btnIn = document.getElementById('size-btn-in');
  if (unit === 'in') {
    btnIn.className = "px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold transition-all";
    btnMm.className = "px-3 py-1 rounded-md text-stone-600 hover:text-stone-900 text-xs font-semibold transition-all";
  } else {
    btnMm.className = "px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold transition-all";
    btnIn.className = "px-3 py-1 rounded-md text-stone-600 hover:text-stone-900 text-xs font-semibold transition-all";
  }
  renderSizeModalContent(unit);
}

function renderSizeModalContent(unit) {
  const item = window.productsData.nails.find(n => n.id === currentSizeGuideProductId);
  const tbody = document.getElementById('size-modal-table-body');
  if (!item || !tbody) return;

  const sizes = (Array.isArray(item.sizes) && item.sizes.length > 0) ? item.sizes : Object.keys(NAIL_STANDARD_SIZE_CHART);
  const currentSize = activeSelections[item.id]?.size || '';
  const customChart = item.sizeChart || {};

  tbody.innerHTML = sizes.map(sizeKey => {
    const standardRow = NAIL_STANDARD_SIZE_CHART[sizeKey] || {};
    const customRow = customChart[sizeKey] || {};
    const isActive = sizeKey === currentSize;

    const cells = NAIL_SIZE_FINGERS.map(finger => {
      const hasCustomVal = customRow[finger] !== undefined && customRow[finger] !== null && customRow[finger] !== '';
      const mmVal = hasCustomVal ? parseFloat(customRow[finger]) : (standardRow[finger] !== undefined ? standardRow[finger] : null);

      if (mmVal === null || isNaN(mmVal)) {
        return `<td class="text-center py-1.5 px-1 text-stone-300">—</td>`;
      }
      const display = unit === 'in' ? (mmVal / 25.4).toFixed(2) : mmVal.toFixed(1);
      return `<td class="text-center py-1.5 px-1 ${hasCustomVal ? 'font-bold text-amber-800' : 'text-stone-700'}">${display}</td>`;
    }).join('');

    return `
      <tr class="border-t border-stone-100 ${isActive ? 'bg-amber-50' : ''}">
        <td class="py-1.5 pr-2 font-bold ${isActive ? 'text-amber-800' : 'text-stone-800'}">${sizeKey}${isActive ? ' ✓' : ''}</td>
        ${cells}
      </tr>
    `;
  }).join('');
}