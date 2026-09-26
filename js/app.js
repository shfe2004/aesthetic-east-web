/* =================================================_
   Aesthetic East - 前台全功能控制脚本 (毫米mm与英寸in实时换算版)
   ================================================= */

let currentLang = 'en';
let cart = [];
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

const i18n = {
  en: {
    cartEmpty: "Your cart is empty.",
    nailsSectionTitle: "Handcrafted Press-On Nails",
    merchSectionTitle: "Original Acrylic Merch",
    furnitureSectionTitle: "Restored Antique Furniture",
    adminBtn: "Admin Panel",
    sizeGuide: "Size Guide"
  },
  zh: {
    cartEmpty: "您的购物车是空的。",
    nailsSectionTitle: "手工定制穿戴甲",
    merchSectionTitle: "原创立牌与精美周边",
    furnitureSectionTitle: "修复明清古董家具",
    adminBtn: "管理后台",
    sizeGuide: "尺寸指南"
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
    const [prodRes, optRes, imgRes] = await Promise.all([
      supabaseClient.from("products").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("nail_options").select("*"),
      supabaseClient.from("product_images").select("*")
    ]);
    if (prodRes.error) throw prodRes.error;
    const products = prodRes.data || [];
    const nailOptions = optRes.data || [];
    const productImages = imgRes.data || [];
    const nails = [];
    const merch = [];
    const furniture = [];

    products.forEach(item => {
      const nailOpt = nailOptions.find(o => o.product_id === item.id) || {};
      const parsedShapes = robustParseSpec(nailOpt.shapes);
      const parsedSizes = robustParseSpec(nailOpt.sizes);
      const parsedSizeChart = robustParseSizeChart(nailOpt.size_chart);

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
        // 穿戴甲专属：商家自定义的指围尺码对照表（可能只填了部分尺码/部分手指，其余用行业标准兜底）
        sizeChart: parsedSizeChart,
        // 全品类通用的长宽高尺寸字段（后台维护的毫米 mm 数据）
        length: parseFloat(item.length || 0),
        width: parseFloat(item.width || 0),
        height: parseFloat(item.height || 0)
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
  const langText = document.getElementById('lang-btn-text');
  if (langText) langText.innerText = currentLang === 'zh' ? '中文' : 'EN';
  renderPage();
}

function renderPage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang] && i18n[currentLang][key]) {
      el.innerText = i18n[currentLang][key];
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
      <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col justify-between h-full">
        <div>
          <div class="relative bg-stone-100 aspect-square overflow-hidden group cursor-pointer" onclick="openZoomModal('${mainImg}')">
            <img id="main-img-${item.id}" src="${mainImg}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <span class="absolute top-3 left-3 ${item.tagClass || 'bg-stone-900 text-white'} text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              ${item.tagKey || 'New'}
            </span>
            <button onclick="event.stopPropagation(); open360Modal('${item.id}')" class="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm">
              <i class="fa-solid fa-rotate"></i> 360°
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
                  ${shapes.map(s => `
                    <button onclick="selectOption('${item.id}', 'shape', '${s}')" class="px-3 py-1 rounded-lg text-xs font-medium transition-all ${currentShape === s ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">
                      ${s}
                    </button>
                  `).join('')}
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
                  ${sizes.map(sz => `
                    <button onclick="selectOption('${item.id}', 'size', '${sz}')" class="px-3 py-1 rounded-lg text-xs font-medium transition-all ${currentSize === sz ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">
                      ${sz}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="p-5 pt-0 flex items-center justify-between mt-auto border-t border-stone-50 pt-3">
          <span class="text-xl font-extrabold text-stone-900">$${parseFloat(item.price).toFixed(2)}</span>
          <button onclick="addNailToCart('${item.id}')" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
            + Add
          </button>
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
      <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col justify-between h-full">
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
          <button onclick="addSimpleToCart('merch', '${item.id}')" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
            + Add
          </button>
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
      <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col justify-between h-full">
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
          <button onclick="addSimpleToCart('furniture', '${item.id}')" class="bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
            + Add
          </button>
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

function selectOption(id, type, value) {
  if (!activeSelections[id]) activeSelections[id] = {};
  activeSelections[id][type] = value;
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
  const cartItemId = `${id}-${sel.shape || ''}-${sel.size || ''}`;
  const existing = cart.find(c => c.cartItemId === cartItemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId,
      productId: id,
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
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId: id,
      productId: id,
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
      <div class="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-stone-200">
        <button onclick="changeQty('${item.cartItemId}', -1)" class="text-stone-500 hover:text-stone-900 font-bold px-1 text-xs">-</button>
        <span class="text-xs font-bold w-4 text-center text-stone-800">${item.qty}</span>
        <button onclick="changeQty('${item.cartItemId}', 1)" class="text-stone-500 hover:text-stone-900 font-bold px-1 text-xs">+</button>
      </div>
    </div>
  `).join('');
}

function changeQty(cartItemId, delta) {
  const item = cart.find(c => c.cartItemId === cartItemId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.cartItemId !== cartItemId);
  }
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
    alert("Your cart is empty!");
    return;
  }
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  document.getElementById('checkout-subtotal').innerText = `$${subtotal.toFixed(2)}`;
  document.getElementById('checkout-tax').innerText = `$${tax.toFixed(2)}`;
  document.getElementById('checkout-total').innerText = `$${total.toFixed(2)}`;
  document.getElementById('checkout-form').classList.remove('hidden');
  document.getElementById('checkout-success').classList.add('hidden');
  closeCartDrawer();
  document.getElementById('modal-checkout').classList.remove('hidden');
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
  const firstName = document.getElementById('cust-first-name').value;
  const lastName = document.getElementById('cust-last-name').value;
  const email = document.getElementById('cust-email').value;
  const phone = document.getElementById('cust-phone').value;
  const address = document.getElementById('cust-address').value;
  const city = document.getElementById('cust-city').value;
  const state = document.getElementById('cust-state').value;
  const zip = document.getElementById('cust-zip').value;

  const payBtn = document.getElementById('pay-submit-btn');
  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  try {
    const { error: orderError } = await supabaseClient.from('orders').insert([{
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
      total: total
    }]);
    if (orderError) throw orderError;

    if (cart.length > 0) {
      const itemRows = cart.map(item => ({
        order_id: orderId,
        product_id: item.productId || item.cartItemId,
        title: item.title,
        unit_price: item.price,
        qty: item.qty,
        variant_shape: item.shape || null,
        variant_size: item.size || null
      }));
      const { error: itemsError } = await supabaseClient.from('order_items').insert(itemRows);
      if (itemsError) throw itemsError;
    }
  } catch (err) {
    // 订单落库失败不阻断这次模拟结算流程（顾客体验优先），但打印出来方便排查——
    // 常见原因是还没在 Supabase 里跑 complete_missing_features.sql 建表。
    console.error('订单保存失败（未影响本次模拟结算流程，请检查是否已建好 orders/order_items 表）:', err);
  }

  setTimeout(() => {
    document.getElementById('checkout-form').classList.add('hidden');
    document.getElementById('checkout-success').classList.remove('hidden');
    document.getElementById('success-cust-name').innerText = `${firstName} ${lastName}`;
    const orderIdEl = document.getElementById('success-order-id');
    if (orderIdEl) orderIdEl.innerText = orderId;
    cart = [];
    updateCartUI();
    payBtn.disabled = false;
    payBtn.innerText = "Complete Payment";
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