/* =================================================_
   Aesthetic East - 前台全功能控制脚本 (毫米mm与英寸in实时换算版)
   ================================================= */

// 语言状态：优先读取 localStorage 里保存的选择（与后台管理页共用同一个 key，切换一次全站同步）
let currentLang = localStorage.getItem('site_lang') || 'en';
let cart = [];
// 当前订单选中的快递方式（点击"计算运费"后由 Shippo 返回，顾客选一个后存在这里）
let selectedShippingRate = null;
let currentShippoShipmentId = null;
// 结算税率，从后台 site_settings 里读，读不到时兜底用 8%（跟原来硬编码的值保持一致）
let siteTaxRate = 0.08;
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
    calcShippingBtn: "Calculate Shipping",
    calculatingShippingBtn: "Calculating...",
    shippingLabel: "Shipping:",
    chooseShippingPrompt: "Select a shipping option:",
    manualShippingNote: "This order contains antique furniture — shipping cost will be quoted manually and confirmed with you after checkout.",
    shippingCalcError: "Could not get shipping rates. Please check your address and try again.",
    shippingNotCalculatedYet: "Please calculate shipping before completing payment.",
    fillAddressFirst: "Please fill in your address, city, state and zip first.",
    soldOutBtn: "Sold Out",
    variantSoldOutAlert: "Sorry, this option is currently sold out or you have reached the available stock.",
    orderFailedGeneric: "Order failed, please adjust the quantity and try again.",
    nailsVideoCaption: "Handmade, start to finish",
    tryOnBtn: "Try On",
    tryonModalTitle: "Virtual Try-On",
    tryonDisclaimer: "Simulated preview on a standard hand model — actual color, shine and fit may vary from real nails.",
    tryonSwitchLabel: "Try another design:",
    tryonLoadError: "Could not load this design's preview image."
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
    calcShippingBtn: "计算运费",
    calculatingShippingBtn: "计算中...",
    shippingLabel: "运费：",
    chooseShippingPrompt: "请选择一种快递方式：",
    manualShippingNote: "此订单包含古董家具，运费将在下单后由客服人工核算并与您确认。",
    shippingCalcError: "获取运费失败，请检查地址信息后重试。",
    shippingNotCalculatedYet: "请先点击「计算运费」再完成支付。",
    fillAddressFirst: "请先填写详细地址、城市、州和邮编。",
    soldOutBtn: "已售罄",
    variantSoldOutAlert: "抱歉，这个选项目前缺货，或者已经达到现有库存上限。",
    orderFailedGeneric: "下单失败，请调整购买数量后重试。",
    nailsVideoCaption: "纯手工制作全过程",
    tryOnBtn: "虚拟试戴",
    tryonModalTitle: "虚拟试戴",
    tryonDisclaimer: "此效果为在标准手模上的模拟贴图预览，实际颜色、光泽与佩戴效果可能与真实产品略有差异。",
    tryonSwitchLabel: "试试其他款式：",
    tryonLoadError: "该款式的预览图片加载失败。"
  }
};

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
    const [prodRes, optRes, imgRes, stockAvailRes] = await Promise.all([
      supabaseClient.from("products").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("nail_options").select("*"),
      supabaseClient.from("product_images").select("*"),
      // 只读"有没有货"的布尔视图，读不到具体库存数字（见 sql/add_nail_stock_public_view.sql）
      supabaseClient.from("nail_variant_availability").select("*")
    ]);
    if (prodRes.error) throw prodRes.error;
    const products = prodRes.data || [];
    const nailOptions = optRes.data || [];
    const productImages = imgRes.data || [];
    // 视图可能还没建（旧数据库没跑过那份 SQL），查询失败时不阻断整个页面，只是不做缺货判断
    const stockAvailRows = (!stockAvailRes.error && stockAvailRes.data) ? stockAvailRes.data : [];
    const nails = [];
    const merch = [];
    const furniture = [];

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
        tryonNailShapeFlip: !!item.tryon_nail_shape_flip
      };

      if (item.category_id === 'nails') {
        nails.push(formattedItem);
      } else if (item.category_id === 'merch') {
        merch.push(formattedItem);
      } else if (item.category_id === 'furniture') {
        furniture.push(formattedItem);
      }
    });

    console.log("【组装成功】全品类商品及尺寸加载完毕:", { nails, merch, furniture });
    return { nails, merch, furniture };
  } catch (err) {
    console.error("加载数据库商品出错:", err);
    return null;
  }
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
  renderMerch();
  renderFurniture();
  updateCartUI();
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
            <button onclick="event.stopPropagation(); openTryOnModal('${item.id}')" class="absolute bottom-3 left-3 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm">
              <i class="fa-solid fa-hand-sparkles"></i> ${(i18n[currentLang] && i18n[currentLang].tryOnBtn) ? i18n[currentLang].tryOnBtn : 'Try On'}
            </button>
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
          <span class="text-xl font-extrabold text-stone-900">$${parseFloat(item.price).toFixed(2)}</span>
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

function renderMerch() {
  const container = document.getElementById('merch-grid');
  if (!container || !window.productsData) return;
  container.innerHTML = window.productsData.merch.map(item => {
    const mainImg = (item.images && item.images.length > 0) ? item.images[0] : (item.spinImage || 'https://via.placeholder.com/400');
    const hasDimensions = (item.length > 0 || item.width > 0 || item.height > 0);
    return `
      <div id="product-card-${item.id}" class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col justify-between h-full">
        <div>
          <div class="relative bg-stone-100 aspect-square overflow-hidden group cursor-pointer" onclick="openZoomModal('${mainImg}')">
            <img src="${mainImg}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <span class="absolute top-3 left-3 ${item.tagClass || 'bg-stone-900 text-white'} text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              ${item.tagKey || 'Merch'}
            </span>
            <button onclick="event.stopPropagation(); open360Modal('${item.id}')" class="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
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
                <button onclick="openDimensionsModal('${item.id}', 'merch')" class="text-xs text-amber-800 hover:text-amber-900 underline flex-shrink-0 font-medium">Size Guide</button>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="p-5 pt-0 flex items-center justify-between mt-auto border-t border-stone-50 pt-3">
          <span class="text-xl font-extrabold text-stone-900">$${parseFloat(item.price).toFixed(2)}</span>
          ${item.stockQuantity > 0 ? `
          <button onclick="addSimpleToCart('merch', '${item.id}')" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
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

function renderFurniture() {
  const container = document.getElementById('furniture-grid');
  if (!container || !window.productsData) return;
  container.innerHTML = window.productsData.furniture.map(item => {
    const mainImg = (item.images && item.images.length > 0) ? item.images[0] : (item.spinImage || 'https://via.placeholder.com/400');
    const hasDimensions = (item.length > 0 || item.width > 0 || item.height > 0);

    return `
      <div id="product-card-${item.id}" class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col justify-between h-full">
        <div>
          <div class="relative bg-stone-100 aspect-[4/3] overflow-hidden group cursor-pointer" onclick="openZoomModal('${mainImg}')">
            <img src="${mainImg}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <span class="absolute top-3 left-3 ${item.tagClass || 'bg-amber-900 text-amber-100'} text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              ${item.tagKey || 'Antique'}
            </span>
            <button onclick="event.stopPropagation(); open360Modal('${item.id}')" class="absolute bottom-3 right-3 bg-amber-800/90 hover:bg-amber-900 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors">
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
                <button onclick="openDimensionsModal('${item.id}', 'furniture')" class="text-xs text-amber-800 hover:text-amber-900 underline flex-shrink-0 font-medium">Size Guide</button>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="p-5 pt-0 flex items-center justify-between mt-auto border-t border-stone-50 pt-3">
          <span class="text-xl font-extrabold text-stone-900">$${parseFloat(item.price).toFixed(2)}</span>
          ${item.stockQuantity > 0 ? `
          <button onclick="addSimpleToCart('furniture', '${item.id}')" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
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
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (badge) {
    badge.innerText = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  }
  if (totalEl) totalEl.innerText = `$${subtotal.toFixed(2)}`;
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
  container.innerHTML = cart.map(item => `
    <div class="flex items-center gap-4 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
      <img src="${item.image}" class="w-16 h-16 object-cover rounded-lg bg-white shadow-sm">
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-stone-900 truncate">${item.title}</h4>
        ${item.shape ? `<p class="text-[11px] text-stone-500 mt-0.5">${item.shape} /${item.size}</p>` : ''}
        <p class="text-xs font-extrabold text-amber-700 mt-1">$${item.price.toFixed(2)}</p>
      </div>
      <div class="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200">
        <button onclick="changeQty('${item.cartItemId}', -1)" class="text-stone-500 hover:text-stone-900 font-bold px-1 text-xs">-</button>
        <input type="number" min="1" step="1" value="${item.qty}"
          onchange="setQty('${item.cartItemId}', this.value)"
          class="w-9 text-xs font-bold text-center text-stone-800 border-0 focus:ring-0 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
        <button onclick="changeQty('${item.cartItemId}', 1)" class="text-stone-500 hover:text-stone-900 font-bold px-1 text-xs">+</button>
      </div>
    </div>
  `).join('');
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
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const panel = document.getElementById('cart-panel');
  if (!drawer) return;
  drawer.classList.remove('pointer-events-none');
  overlay.classList.remove('opacity-0');
  panel.classList.remove('translate-x-full');
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
}

function openCheckoutModal() {
  if (cart.length === 0) {
    alert(i18n[currentLang] ? i18n[currentLang].cartEmpty : 'Your cart is empty.');
    return;
  }
  // 每次打开结算弹窗都清空上一次选的运费，避免购物车内容变了运费还是旧的
  selectedShippingRate = null;
  currentShippoShipmentId = null;
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
}

// 统一刷新结算弹窗里的小计/税费/运费/总计，运费没算出来之前显示 "--"
function updateCheckoutTotalsUI() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
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

// 点击"计算运费"：把当前地址 + 购物车换算出的包裹信息发给后端 /api/shipping-rates，
// 由后端拿着 Shippo 密钥去实时询价，前台只拿回一份可选的快递方式列表。
async function calculateShipping() {
  const address = document.getElementById('cust-address').value.trim();
  const city = document.getElementById('cust-city').value.trim();
  const state = document.getElementById('cust-state').value;
  const zip = document.getElementById('cust-zip').value.trim();
  const firstName = document.getElementById('cust-first-name').value.trim();
  const lastName = document.getElementById('cust-last-name').value.trim();

  if (!address || !city || !state || !zip) {
    alert(i18n[currentLang] ? i18n[currentLang].fillAddressFirst : 'Please fill in your address, city, state and zip first.');
    return;
  }

  const { parcel, needsManualQuote } = computeParcelForCart(cart);

  const manualNoteEl = document.getElementById('shipping-manual-note');
  const ratesListEl = document.getElementById('shipping-rates-list');
  const calcBtn = document.getElementById('calc-shipping-btn');

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
        addressTo: { name: `${firstName} ${lastName}`.trim(), street1: address, city, state, zip },
        parcel
      })
    });
    const data = await resp.json();
    if (!resp.ok || !data.rates || data.rates.length === 0) {
      throw new Error((data && data.error) || 'no rates');
    }
    currentShippoShipmentId = data.shipmentId;
    renderShippingRates(data.rates);
    // 若含古董家具，同时也提示这部分需要人工核算（穿戴甲/亚克力部分已经能自动询价了）
    if (needsManualQuote && manualNoteEl) manualNoteEl.classList.remove('hidden');
  } catch (err) {
    console.error('运费询价失败:', err);
    alert(i18n[currentLang] ? i18n[currentLang].shippingCalcError : 'Could not get shipping rates. Please check your address and try again.');
  } finally {
    if (calcBtn) { calcBtn.disabled = false; calcBtn.innerHTML = originalBtnText; }
  }
}

// 把 Shippo 返回的多个快递方式渲染成单选列表，顾客选中一个后重新计算总价
function renderShippingRates(rates) {
  const container = document.getElementById('shipping-rates-list');
  if (!container) return;
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

  const firstName = document.getElementById('cust-first-name').value;
  const lastName = document.getElementById('cust-last-name').value;
  const email = document.getElementById('cust-email').value;
  const phone = document.getElementById('cust-phone').value;
  const address = document.getElementById('cust-address').value;
  const city = document.getElementById('cust-city').value;
  const state = document.getElementById('cust-state').value;
  const zip = document.getElementById('cust-zip').value;

  const payBtn = document.getElementById('pay-submit-btn');
  const processingText = (i18n[currentLang] && i18n[currentLang].processingBtn) ? i18n[currentLang].processingBtn : 'Processing...';
  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${processingText}`;

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
    needs_manual_shipping: !!selectedShippingRate.manual
  };
  const itemsPayload = cart.map(item => ({
    product_id: item.productId || item.cartItemId,
    title: item.title,
    unit_price: item.price,
    qty: item.qty,
    variant_shape: item.shape || null,
    variant_size: item.size || null
  }));

  const { error: rpcError } = await supabaseClient.rpc('create_order_with_stock_check', {
    p_order: orderPayload,
    p_items: itemsPayload
  });

  if (rpcError) {
    console.error('下单失败:', rpcError);
    // 数据库那边报的是库存不足的具体原因（中文），直接展示给顾客；其它意外错误则给通用提示
    const isStockError = rpcError.message && rpcError.message.indexOf('库存不足') !== -1;
    alert(isStockError ? rpcError.message : ((i18n[currentLang] && i18n[currentLang].orderFailedGeneric) ? i18n[currentLang].orderFailedGeneric : 'Order failed, please adjust the quantity and try again.'));

    // 下单失败大概率是因为库存刚好被别人买完/数据有变化，刷新一下商品数据让页面反映最新库存
    const cloudData = await fetchProductsIndependentJoin();
    if (cloudData) { window.productsData = cloudData; }
    renderPage();

    payBtn.disabled = false;
    payBtn.innerText = (i18n[currentLang] && i18n[currentLang].payBtn) ? i18n[currentLang].payBtn : 'Complete Payment (Test Mode)';
    return;
  }

  // 下单成功：同样刷新一次商品/库存数据，这样别的还在浏览页面的顾客能马上看到最新库存状态，
  // 不用手动刷新页面才发现某个规格已经被买光了
  const cloudData = await fetchProductsIndependentJoin();
  if (cloudData) { window.productsData = cloudData; }

  setTimeout(() => {
    document.getElementById('checkout-form').classList.add('hidden');
    document.getElementById('checkout-success').classList.remove('hidden');
    document.getElementById('success-cust-name').innerText = `${firstName} ${lastName}`;
    const orderIdEl = document.getElementById('success-order-id');
    if (orderIdEl) orderIdEl.innerText = orderId;
    cart = [];
    selectedShippingRate = null;
    currentShippoShipmentId = null;
    updateCartUI();
    renderPage();
    payBtn.disabled = false;
    payBtn.innerText = (i18n[currentLang] && i18n[currentLang].payBtn) ? i18n[currentLang].payBtn : 'Complete Payment (Test Mode)';
  }, 1200);
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