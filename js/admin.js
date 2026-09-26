// 后台控制脚本 (采用标准先更新后插入逻辑，杜绝一切数据库约束报错)

// ===================== 双语翻译（后台管理界面）=====================
// 与前台 js/app.js 共用同一个 localStorage key("site_lang")，切换一次两边语言保持同步。
// 静态文案用 data-i18n / data-i18n-placeholder 属性 + applyAdminI18n() 渲染；
// 动态生成的表格行、弹窗、alert/confirm 提示文案则统一调用 t(key) 取当前语言的文本。
let currentAdminLang = localStorage.getItem("site_lang") || "en";

const ADMIN_I18N = {
  en: {
    adminLockTitle: "Admin Login",
    adminLockDesc: "Sign in with your admin account to continue.",
    adminLoginEmailPlaceholder: "Email",
    adminLoginPasswordPlaceholder: "Password",
    adminLockBtn: "Sign In",
    loggingInBtn: "Signing in...",
    adminLockError: "Incorrect email or password, please try again.",
    signOutBtn: "Sign Out",
    adminPanelTitle: "Aesthetic East Admin Panel",
    adminPanelSubtitle: "Auto-generated IDs · Dynamic site content · Cloud sync",
    previewFrontendLink: "Preview Storefront ↗",
    siteConfigSectionTitle: "🌐 Global Site Settings",
    logoLabel: "Brand Name (Logo Text)",
    bannerLabel: "Sticky Top Announcement",
    heroTitleLabel: "Hero Main Heading",
    heroDescLabel: "Hero Description",
    heroBgLabel: "Hero Banner Background Image (custom upload)",
    saveSiteConfigBtn: "Save Site Settings",
    savingConfigBtn: "Saving...",
    addProductSectionTitle: "📦 Add New Product",
    chooseCategoryLabel: "1. Choose Category (determines ID prefix)",
    catNails: "Press-On Nails",
    catMerch: "Merch",
    catFurniture: "Antique Furniture",
    autoIdLabel: "2. Auto-Generated Unique ID",
    titleLabel: "Title (English)",
    subtitleLabel: "Subtitle (English)",
    priceLabel: "Price ($ USD)",
    tagLabel: "Tag",
    nailSpecSectionTitle: "Nail-Specific Options",
    shapesLabel: "Available Shapes",
    shapeAlmond: "Almond",
    shapeCoffin: "Coffin",
    shapeStiletto: "Stiletto",
    shapeSquare: "Square",
    sizesLabel: "Available Sizes",
    sizeChartLabel: "Custom finger-size chart (optional, mm; blank cells fall back to industry standard on the storefront)",
    sizeChartHeaderSize: "Size",
    sizeChartHeaderThumb: "Thumb",
    sizeChartHeaderIndex: "Index",
    sizeChartHeaderMiddle: "Middle",
    sizeChartHeaderRing: "Ring",
    sizeChartHeaderPinky: "Pinky",
    standardPlaceholder: "Standard",
    dimensionsSectionTitle: "Physical Dimensions (Merch / Antique Furniture)",
    lengthLabel: "Length (mm)",
    widthLabel: "Width (mm)",
    heightLabel: "Height (mm)",
    dimensionsHelpText: "Leave at 0 to hide the \"Size Guide\" popup; fill in at least one value greater than 0 to show dimensions on the storefront.",
    imageUploadLabel: "Choose local product images (multiple allowed, first one is the main image; auto-compressed and synced to the cloud)",
    publishProductBtn: "Save & Publish Product",
    publishingBtn: "Publishing...",
    productListTitle: "Live Product List",
    productSearchPlaceholder: "Search by ID or name...",
    productCountLabel: "{n} products total",
    noMatchingProducts: "No products match your search.",
    thImage: "Image",
    thCategory: "Category",
    thName: "Name",
    thSpec: "Options",
    thPrice: "Price",
    thAction: "Actions",
    loadingProducts: "Loading products...",
    orderMgmtTitle: "📋 Order Management",
    simulatedBadge: "Test mode — no real payments",
    refreshBtn: "Refresh",
    thOrderId: "Order ID",
    thCustomer: "Customer",
    thContact: "Contact",
    thAddress: "Shipping Address",
    thAmount: "Amount",
    thStatus: "Status",
    thOrderTime: "Order Time",
    loadingOrders: "Loading orders...",
    activityLogTitle: "📝 Activity Log",
    exportCsvBtn: "Export as CSV",
    activityLogHint: "This log is stored permanently in the cloud database — unlike Supabase's built-in Auth Logs, it won't auto-clear after a few days. Export it as CSV regularly to keep a local backup.",
    thLogTime: "Time",
    thLogActor: "Actor",
    thLogEvent: "Event",
    thLogDetail: "Detail",
    loadingLogs: "Loading logs...",
    noLogs: "No activity logged yet.",
    loadLogsFailed: "Failed to load activity log — please confirm you've run create_admin_activity_log.sql in Supabase.",
    expandLogBtn: "Show full log ▾",
    collapseLogBtn: "Collapse ▴",
    activityLogLatestPrefix: "Latest: ",
    logEventLogin: "Signed in",
    logEventLogout: "Signed out",
    logEventProductCreate: "Product created",
    logEventProductUpdateSpec: "Options edited",
    logEventProductUpdateDimensions: "Dimensions edited",
    logEventProductUpdateInfo: "Product info edited",
    logEventProductDelete: "Product deleted",
    logEventSettingsUpdate: "Site settings updated",
    noProducts: "No products in the database yet.",
    noSpecSet: "Options not set",
    hasCustomChart: "Includes custom size chart",
    usesStandardChart: "Size chart: using industry standard",
    editSpecBtn: "Edit Options",
    editInfoBtn: "Edit Info",
    editInfoModalTitlePrefix: "Edit Product Info - ",
    currentImageLabel: "Current Main Image",
    replaceImageLabel: "Replace with a new image (optional)",
    infoSaveSuccess: "✨ Product info updated successfully!",
    alertNeedTitle: "⚠️ Title cannot be empty!",
    noDimSet: "Dimensions not set",
    editDimBtn: "Edit Dimensions",
    deleteBtn: "Delete",
    loadProductsFailed: "Failed to load product list.",
    alertNeedShape: "⚠️ Please select at least 1 shape!",
    alertNeedSize: "⚠️ Please select at least 1 size!",
    imageUploadFailed: "Image upload failed: ",
    galleryImageSaveFailed: "Failed to save gallery images: ",
    productPublishSuccess: "🎉 Product published! Unique ID: ",
    operationFailed: "Operation failed: ",
    editSpecModalTitlePrefix: "Edit Options - ",
    shapesCheckboxLabel: "Shapes (check available shapes):",
    sizesCheckboxLabel: "Sizes (check available sizes):",
    customSizeChartEditLabel: "Custom finger-size chart (optional, mm; leave blank to use industry standard):",
    cancelBtn: "Cancel",
    saveChangesBtn: "Save Changes",
    editDimModalTitlePrefix: "Edit Dimensions - ",
    dimEditLength: "Length (mm)",
    dimEditWidth: "Width (mm)",
    dimEditHeight: "Height (mm)",
    dimSaveSuccess: "✨ Dimensions updated successfully!",
    updateFailed: "Update failed: ",
    alertNeedBoth: "⚠️ At least 1 shape and 1 size must be selected!",
    specSaveSuccess: "✨ Options updated successfully!",
    mainImageBadge: "Main",
    confirmDeleteProduct: 'Are you sure you want to delete product "{id}"?',
    noOrders: "No orders yet.",
    viewDetailsBtn: "View Details",
    loadOrdersFailed: "Failed to load orders — please confirm you've run complete_missing_features.sql in Supabase.",
    orderDetailsModalTitlePrefix: "Order Details - ",
    closeBtn: "Close",
    loadingText: "Loading...",
    noOrderItems: "No line items for this order.",
    loadFailedPrefix: "Failed to load: ",
    heroUploadFailed: "Hero background upload failed: ",
    siteConfigSaveSuccess: "✨ Site content & background saved to the cloud — refresh the storefront and it's live for every visitor!",
    saveFailed: "Save failed: "
  },
  zh: {
    adminLockTitle: "管理后台登录",
    adminLockDesc: "请使用管理员账号登录后台。",
    adminLoginEmailPlaceholder: "邮箱",
    adminLoginPasswordPlaceholder: "密码",
    adminLockBtn: "登录",
    loggingInBtn: "登录中...",
    adminLockError: "邮箱或密码错误，请重试。",
    signOutBtn: "退出登录",
    adminPanelTitle: "Aesthetic East 管理后台",
    adminPanelSubtitle: "自动生成编码 · 站点文案动态配置 · 云端同步",
    previewFrontendLink: "预览前台 ↗",
    siteConfigSectionTitle: "🌐 网站全局信息配置",
    logoLabel: "品牌名称 (Logo Text)",
    bannerLabel: "顶部固定促销横幅 (Sticky Announcement)",
    heroTitleLabel: "Hero 大图标题 (Main Heading)",
    heroDescLabel: "Hero 描述文案 (Description)",
    heroBgLabel: "Hero 顶部横幅背景图 (自定义上传)",
    saveSiteConfigBtn: "保存站点配置",
    savingConfigBtn: "正在保存配置...",
    addProductSectionTitle: "📦 添加新商品",
    chooseCategoryLabel: "1. 先选择商品分类 (决定编码前缀)",
    catNails: "穿戴甲 (Nails)",
    catMerch: "周边 (Merch)",
    catFurniture: "古董家具 (Furniture)",
    autoIdLabel: "2. 自动生成唯一编码 (ID)",
    titleLabel: "英文标题 (Title)",
    subtitleLabel: "英文副标题 (Subtitle)",
    priceLabel: "价格 ($ USD)",
    tagLabel: "标签 (Tag)",
    nailSpecSectionTitle: "穿戴甲专属规格配置",
    shapesLabel: "可供选择的甲型 (Shapes)",
    shapeAlmond: "杏仁型",
    shapeCoffin: "梯形",
    shapeStiletto: "尖甲",
    shapeSquare: "方型",
    sizesLabel: "可供选择的尺码 (Sizes)",
    sizeChartLabel: "自定义指围尺码对照表（可选，单位 mm；留空的格子前台会显示行业标准参考值）",
    sizeChartHeaderSize: "尺码",
    sizeChartHeaderThumb: "拇指",
    sizeChartHeaderIndex: "食指",
    sizeChartHeaderMiddle: "中指",
    sizeChartHeaderRing: "无名指",
    sizeChartHeaderPinky: "小指",
    standardPlaceholder: "标准",
    dimensionsSectionTitle: "物理尺寸配置（立牌 / 古董家具）",
    lengthLabel: "长度 Length (mm)",
    widthLabel: "宽度 Width (mm)",
    heightLabel: "高度 Height (mm)",
    dimensionsHelpText: "留 0 表示不显示\"Size Guide\"尺寸弹窗；至少填一项大于 0 的数值才会在前台显示尺寸对照。",
    imageUploadLabel: "选择本地商品图片（可多选，第一张作为主图；自动等比压缩并同步至云端）",
    publishProductBtn: "保存并发布商品",
    publishingBtn: "正在发布商品...",
    productListTitle: "在线商品管理列表",
    productSearchPlaceholder: "按 ID 或名称搜索...",
    productCountLabel: "共 {n} 件商品",
    noMatchingProducts: "没有匹配的商品。",
    thImage: "主图",
    thCategory: "分类",
    thName: "名称",
    thSpec: "规格选项",
    thPrice: "价格",
    thAction: "操作",
    loadingProducts: "正在加载商品列表...",
    orderMgmtTitle: "📋 订单管理",
    simulatedBadge: "模拟结算，非真实收款",
    refreshBtn: "刷新",
    thOrderId: "订单号",
    thCustomer: "客户",
    thContact: "联系方式",
    thAddress: "收货地址",
    thAmount: "金额",
    thStatus: "状态",
    thOrderTime: "下单时间",
    loadingOrders: "正在加载订单...",
    activityLogTitle: "📝 操作日志",
    exportCsvBtn: "导出为 CSV",
    activityLogHint: "这里的记录永久保存在云端数据库里，不会像 Supabase 自带的登录日志那样几天后自动清空；建议定期点\"导出为 CSV\"下载到本地留一份备份。",
    thLogTime: "时间",
    thLogActor: "操作人",
    thLogEvent: "事件",
    thLogDetail: "详情",
    loadingLogs: "正在加载日志...",
    noLogs: "暂无操作记录。",
    loadLogsFailed: "加载操作日志失败，请确认已在 Supabase 里运行过 create_admin_activity_log.sql。",
    expandLogBtn: "展开完整日志 ▾",
    collapseLogBtn: "收起 ▴",
    activityLogLatestPrefix: "最新一条：",
    logEventLogin: "登录",
    logEventLogout: "退出登录",
    logEventProductCreate: "新增商品",
    logEventProductUpdateSpec: "修改规格",
    logEventProductUpdateDimensions: "修改尺寸",
    logEventProductUpdateInfo: "编辑商品信息",
    logEventProductDelete: "删除商品",
    logEventSettingsUpdate: "更新站点配置",
    noProducts: "数据库中暂无商品。",
    noSpecSet: "未设置规格",
    hasCustomChart: "含自定义尺码对照表",
    usesStandardChart: "尺码对照表：使用行业标准",
    editSpecBtn: "修改规格",
    editInfoBtn: "编辑信息",
    editInfoModalTitlePrefix: "编辑商品信息 - ",
    currentImageLabel: "当前主图",
    replaceImageLabel: "替换为新图片（可选，不选则保留原图）",
    infoSaveSuccess: "✨ 商品信息修改成功！",
    alertNeedTitle: "⚠️ 标题不能为空！",
    noDimSet: "未设置尺寸",
    editDimBtn: "修改尺寸",
    deleteBtn: "删除",
    loadProductsFailed: "加载列表失败。",
    alertNeedShape: "⚠️ 请至少勾选 1 个甲型 (Shape)！",
    alertNeedSize: "⚠️ 请至少勾选 1 个尺寸 (Size)！",
    imageUploadFailed: "图片上传失败: ",
    galleryImageSaveFailed: "商品画廊图片保存失败: ",
    productPublishSuccess: "🎉 商品发布成功！唯一编码: ",
    operationFailed: "操作失败: ",
    editSpecModalTitlePrefix: "修改规格 - ",
    shapesCheckboxLabel: "Shapes (勾选可用甲型):",
    sizesCheckboxLabel: "Sizes (勾选可用尺寸):",
    customSizeChartEditLabel: "自定义指围尺码对照表（可选，mm；留空用行业标准）:",
    cancelBtn: "取消",
    saveChangesBtn: "保存修改",
    editDimModalTitlePrefix: "修改尺寸 - ",
    dimEditLength: "长度 (mm)",
    dimEditWidth: "宽度 (mm)",
    dimEditHeight: "高度 (mm)",
    dimSaveSuccess: "✨ 尺寸修改成功！",
    updateFailed: "更新失败: ",
    alertNeedBoth: "⚠️ 必须至少勾选 1 个甲型和 1 个尺寸！",
    specSaveSuccess: "✨ 规格修改成功！",
    mainImageBadge: "主图",
    confirmDeleteProduct: '确定要删除商品 "{id}" 吗？',
    noOrders: "暂无订单。",
    viewDetailsBtn: "查看明细",
    loadOrdersFailed: "加载订单失败，请确认已在 Supabase 里运行过 complete_missing_features.sql。",
    orderDetailsModalTitlePrefix: "订单明细 - ",
    closeBtn: "关闭",
    loadingText: "加载中...",
    noOrderItems: "该订单没有商品明细。",
    loadFailedPrefix: "加载失败：",
    heroUploadFailed: "Hero 背景图上传失败: ",
    siteConfigSaveSuccess: "✨ 站点文案与背景配置已保存到云端，刷新前台即可对所有访客生效！",
    saveFailed: "保存失败: "
  }
};

// 取当前语言下的文案，找不到就退回中文，避免因为漏填 key 直接显示 undefined
function t(key) {
  return (ADMIN_I18N[currentAdminLang] && ADMIN_I18N[currentAdminLang][key]) || ADMIN_I18N.zh[key] || key;
}

function applyAdminI18n() {
  const langBtn = document.getElementById("admin-lang-btn-text");
  if (langBtn) langBtn.innerText = currentAdminLang === "zh" ? "中文" : "EN";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (ADMIN_I18N[currentAdminLang] && ADMIN_I18N[currentAdminLang][key]) {
      el.innerText = ADMIN_I18N[currentAdminLang][key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (ADMIN_I18N[currentAdminLang] && ADMIN_I18N[currentAdminLang][key]) {
      el.placeholder = ADMIN_I18N[currentAdminLang][key];
    }
  });
}

// 切换语言：与前台共用同一个 localStorage key，切换一次两个页面都会同步；
// 静态文案直接重渲染，表格/弹窗等动态内容重新拉取一次数据用新语言渲染。
function toggleAdminLanguage() {
  currentAdminLang = currentAdminLang === "zh" ? "en" : "zh";
  localStorage.setItem("site_lang", currentAdminLang);
  applyAdminI18n();
  if (isAdminAuthenticated) {
    loadAdminProducts().then(filterAdminProducts); // 重新拉取后按当前搜索框内容重新过滤一次，避免语言切换把筛选结果清空
    loadAdminOrders();
    loadAdminActivityLog();
  }
  // 弹窗只会在第一次打开时创建一次 DOM，语言切换后把已缓存的弹窗删掉，
  // 下次点开时会用当前语言重新生成，不会停留在切换前的语言上。
  ["modal-edit-spec", "modal-edit-dimensions", "modal-order-items", "modal-edit-info"].forEach(id => {
    document.getElementById(id)?.remove();
  });
}

// ===================== 真实后台登录（Supabase Auth）=====================
// 取代原来那道"任何人看网页源代码都能找到密码"的临时密码墙。
// 前提：需要在 Supabase 后台 Authentication -> Users 里手动创建一个管理员账号（邮箱+密码），
// 并且务必去 Authentication -> Providers -> Email 里把"Allow new users to sign up"关掉——
// 否则任何人拿着公开的 anon key 都能自己在浏览器控制台调用 supabaseClient.auth.signUp()
// 注册一个新账号，绕过登录直接进后台。这一步不是可选项，是这套方案能生效的必要条件。
let isAdminAuthenticated = false;

async function initAdminAuth() {
  const loginForm = document.getElementById("admin-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleAdminLogin);
  }
  const signOutBtn = document.getElementById("admin-signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", handleAdminSignOut);
  }

  // 页面刷新时 supabase-js 会自动从本地存储恢复登录态，不用每次都重新输密码
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    onAdminAuthenticated();
  }

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") {
      onAdminAuthenticated();
    } else if (event === "SIGNED_OUT") {
      // 退出登录后刷新页面，确保已经加载到内存里的商品/订单数据被清空，回到登录页
      location.reload();
    }
  });
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById("admin-login-email").value.trim();
  const password = document.getElementById("admin-login-password").value;
  const errorEl = document.getElementById("admin-lock-error");
  const loginBtn = document.getElementById("admin-login-btn");

  if (errorEl) errorEl.classList.add("hidden");
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerText = t('loggingInBtn');
  }

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // 只在这里记"登录"事件（真正调用了登录接口且成功），而不是放在 onAdminAuthenticated()
    // 里——那个函数在刷新页面、Supabase 自动恢复已有登录态时也会跑一次，放那里会导致
    // 每次刷新页面都被记一条"登录"，日志很快就没意义了。
    logAdminActivity('login', `email: ${email}`);
    // 登录成功后交给 onAuthStateChange 的 SIGNED_IN 事件统一处理（隐藏登录框、加载数据）
  } catch (err) {
    console.error("管理员登录失败:", err);
    if (errorEl) {
      errorEl.innerText = t('adminLockError');
      errorEl.classList.remove("hidden");
    }
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerText = t('adminLockBtn');
    }
  }
}

async function handleAdminSignOut() {
  // 必须在真正退出登录之前把日志写进去——退出之后就不是 authenticated 了，
  // 按照 RLS 策略这条 insert 会被拒绝，写不进去。
  await logAdminActivity('logout', '');
  supabaseClient.auth.signOut();
}

function onAdminAuthenticated() {
  isAdminAuthenticated = true;
  const lockScreen = document.getElementById("admin-lock-screen");
  if (lockScreen) lockScreen.style.display = "none";
  loadAdminProducts();
  loadAdminOrders();
  loadSiteSettings();
  loadAdminActivityLog();
  generateSmartId();
}

// ===================== 操作日志：登录/关键操作记录 =====================
// 写进 Supabase 的 admin_activity_log 表，永久保留，不受 Supabase 自带
// Auth Logs 的保留期限制；配合下面的 CSV 导出可以在本地留一份备份。
// 这里做成"失败也不影响主流程"——日志写不进去不应该阻止商品保存之类的正常操作。
async function logAdminActivity(eventType, detail) {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    await supabaseClient.from('admin_activity_log').insert([{
      actor_email: user ? user.email : null,
      event_type: eventType,
      detail: detail || ''
    }]);
  } catch (err) {
    console.error('写入操作日志失败（不影响本次操作本身）:', err);
  }
}

const ADMIN_LOG_EVENT_LABEL_KEYS = {
  login: 'logEventLogin',
  logout: 'logEventLogout',
  product_create: 'logEventProductCreate',
  product_update_spec: 'logEventProductUpdateSpec',
  product_update_dimensions: 'logEventProductUpdateDimensions',
  product_update_info: 'logEventProductUpdateInfo',
  product_delete: 'logEventProductDelete',
  settings_update: 'logEventSettingsUpdate'
};

let lastLoadedActivityLog = [];

// 默认只显示最新一条摘要（折叠态），避免日志越攒越多把整个后台页面撑得很长；
// 点"展开完整日志"才切换到下面固定高度、可滚动的完整表格（见 toggleActivityLogView）。
function renderActivityLogSummary(logs) {
  const summaryEl = document.getElementById("admin-activity-log-latest");
  if (!summaryEl) return;
  if (!logs || logs.length === 0) {
    summaryEl.textContent = t('noLogs');
    return;
  }
  const latest = logs[0];
  const timeStr = latest.created_at ? new Date(latest.created_at).toLocaleString() : '';
  const labelKey = ADMIN_LOG_EVENT_LABEL_KEYS[latest.event_type];
  const eventLabel = labelKey ? t(labelKey) : latest.event_type;
  summaryEl.textContent = `${t('activityLogLatestPrefix')}${timeStr} · ${latest.actor_email || ''} · ${eventLabel}${latest.detail ? ' · ' + latest.detail : ''}`;
}

function toggleActivityLogView() {
  const fullView = document.getElementById("admin-activity-log-full");
  const summaryView = document.getElementById("admin-activity-log-summary");
  if (!fullView || !summaryView) return;
  const isCurrentlyCollapsed = fullView.classList.contains("hidden");
  fullView.classList.toggle("hidden", !isCurrentlyCollapsed);
  summaryView.classList.toggle("hidden", isCurrentlyCollapsed);
}

async function loadAdminActivityLog() {
  const tbody = document.getElementById("admin-activity-log-list");
  if (!tbody) return;

  try {
    const { data: logs, error } = await supabaseClient
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    lastLoadedActivityLog = logs || [];
    renderActivityLogSummary(lastLoadedActivityLog);

    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">${t('noLogs')}</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(row => {
      const timeStr = row.created_at ? new Date(row.created_at).toLocaleString() : '';
      const labelKey = ADMIN_LOG_EVENT_LABEL_KEYS[row.event_type];
      const eventLabel = labelKey ? t(labelKey) : row.event_type;
      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3 text-xs text-gray-500">${timeStr}</td>
          <td class="p-3 text-xs text-gray-700">${row.actor_email || ''}</td>
          <td class="p-3 text-xs font-semibold text-gray-900">${eventLabel}</td>
          <td class="p-3 text-xs text-gray-500">${row.detail || ''}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('加载操作日志失败:', err);
    tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">${t('loadLogsFailed')}</td></tr>`;
    const summaryEl = document.getElementById("admin-activity-log-latest");
    if (summaryEl) summaryEl.textContent = t('loadLogsFailed');
  }
}

// 导出成 CSV 下载到本地——重新拉一份更完整的记录（最多 5000 条），而不是只导出当前页面上
// 已经加载的那 200 条，这样定期导出备份的时候不会漏掉中间的记录。
async function exportActivityLogCSV() {
  try {
    const { data: logs, error } = await supabaseClient
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) throw error;

    const rows = logs || [];
    const header = ['time', 'actor_email', 'event_type', 'detail'];
    const csvLines = [header.join(',')];

    rows.forEach(row => {
      const timeStr = row.created_at ? new Date(row.created_at).toISOString() : '';
      const cells = [timeStr, row.actor_email || '', row.event_type || '', row.detail || ''];
      // 简单的 CSV 转义：把双引号变成两个双引号，整个字段用双引号包起来
      const escaped = cells.map(c => `"${String(c).replace(/"/g, '""')}"`);
      csvLines.push(escaped.join(','));
    });

    const csvContent = csvLines.join('\r\n');
    const blob = new Blob(["﻿" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `admin_activity_log_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error('导出日志失败:', err);
    alert(t('loadLogsFailed'));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyAdminI18n();
  initAdminAuth();
  // 商品/订单/站点配置的数据加载现在挪到 onAdminAuthenticated() 里，
  // 只有真正登录成功才会去拉数据；登录之前这些请求本来也会被下面新的 RLS 策略拦掉。

  const categorySelect = document.getElementById("prod-category");
  const nailSection = document.getElementById("nail-options-section");
  const dimensionsSection = document.getElementById("dimensions-section");
  const imageInput = document.getElementById("prod-image-file");
  const heroBgInput = document.getElementById("cfg-hero-bg-file");

  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      const isNails = e.target.value === "nails";
      if (nailSection) {
        nailSection.style.display = isNails ? "block" : "none";
      }
      if (dimensionsSection) {
        dimensionsSection.style.display = isNails ? "none" : "block";
      }
      generateSmartId();
    });
  }

  if (imageInput) {
    imageInput.addEventListener("change", handleImagePreview);
  }

  const productSearchInput = document.getElementById("admin-product-search");
  if (productSearchInput) {
    productSearchInput.addEventListener("input", filterAdminProducts);
  }

  if (heroBgInput) {
    heroBgInput.addEventListener("change", handleHeroBgPreview);
  }

  const addForm = document.getElementById("add-product-form");
  if (addForm) {
    addForm.addEventListener("submit", handleAddProduct);
  }

  const settingsForm = document.getElementById("site-settings-form");
  if (settingsForm) {
    settingsForm.addEventListener("submit", handleSaveSettings);
  }
});

// 毫米(mm) -> 英寸(in) 实时换算预览，输入长/宽/高时触发
function syncInches() {
  const l = parseFloat(document.getElementById("prod-length")?.value) || 0;
  const w = parseFloat(document.getElementById("prod-width")?.value) || 0;
  const h = parseFloat(document.getElementById("prod-height")?.value) || 0;
  const lEl = document.getElementById("length-inch");
  const wEl = document.getElementById("width-inch");
  const hEl = document.getElementById("height-inch");
  if (lEl) lEl.innerText = (l / 25.4).toFixed(2);
  if (wEl) wEl.innerText = (w / 25.4).toFixed(2);
  if (hEl) hEl.innerText = (h / 25.4).toFixed(2);
}

// 从一批 .size-chart-input 输入框里收集非空的自定义尺码值，
// 组装成 { XS: { thumb: 12.5, ... }, S: {...} } 这样的结构；留空的格子不会出现在结果里，
// 前台会针对缺失的尺码/手指自动用行业标准值兜底。
function collectSizeChartInputs(scopeSelector) {
  const inputs = document.querySelectorAll(scopeSelector);
  const chart = {};
  inputs.forEach(inp => {
    const val = inp.value.trim();
    if (val === '') return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const size = inp.dataset.size;
    const finger = inp.dataset.finger;
    if (!size || !finger) return;
    if (!chart[size]) chart[size] = {};
    chart[size][finger] = num;
  });
  return chart;
}

async function generateSmartId() {
  const categorySelect = document.getElementById("prod-category");
  const category = categorySelect ? categorySelect.value : "nails";
  const idInput = document.getElementById("prod-id");
  if (!idInput) return;

  try {
    const { data: allProducts } = await supabaseClient
      .from("products")
      .select("id, category_id");

    const totalCount = (allProducts ? allProducts.length : 0) + 1;
    const categoryProducts = allProducts ? allProducts.filter(p => p.category_id === category) : [];
    const categoryCount = categoryProducts.length + 1;

    let prefix = "nail";
    if (category === "merch") prefix = "merch";
    if (category === "furniture") prefix = "ant";

    const catSeq = String(categoryCount).padStart(2, '0');
    const totalSeq = String(totalCount).padStart(2, '0');

    idInput.value = `${prefix}-${catSeq}-${totalSeq}`;

  } catch (err) {
    idInput.value = `${category}-01-01`;
  }
}

// 商品全量数据缓存在内存里，搜索框筛选时直接在这份数据上过滤重新渲染，
// 不用每次都重新请求数据库。
let lastLoadedProducts = [];

async function loadAdminProducts() {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  try {
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*, nail_options (*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    lastLoadedProducts = products || [];
    updateProductCountLabel(lastLoadedProducts.length);
    renderProductRows(lastLoadedProducts);

  } catch (err) {
    console.error("加载商品失败:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">${t('loadProductsFailed')}</td></tr>`;
  }
}

function updateProductCountLabel(n) {
  const countEl = document.getElementById("admin-product-count");
  if (countEl) countEl.textContent = t('productCountLabel').replace('{n}', n);
}

// 商品列表本身太长的问题（表格滚动）已经在 admin.html 里用 max-h + overflow-auto 解决；
// 这里加个按 ID/名称的本地筛选，商品一多的时候能更快找到要改的那一件。
function filterAdminProducts() {
  const input = document.getElementById("admin-product-search");
  const keyword = (input ? input.value : '').trim().toLowerCase();
  if (!keyword) {
    renderProductRows(lastLoadedProducts);
    updateProductCountLabel(lastLoadedProducts.length);
    return;
  }
  const filtered = lastLoadedProducts.filter(item => {
    const idMatch = (item.id || '').toLowerCase().includes(keyword);
    const titleMatch = (item.title_en || '').toLowerCase().includes(keyword);
    return idMatch || titleMatch;
  });
  updateProductCountLabel(filtered.length);
  renderProductRows(filtered);
}

function renderProductRows(products) {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  try {
    if (!products || products.length === 0) {
      const emptyMsg = lastLoadedProducts.length === 0 ? t('noProducts') : t('noMatchingProducts');
      tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">${emptyMsg}</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(item => {
      const nailOpt = (item.nail_options && item.nail_options.length > 0) ? item.nail_options[0] : {};

      let shapesArr = robustParseSpec(nailOpt.shapes);
      let sizesArr = robustParseSpec(nailOpt.sizes);
      let sizeChartObj = robustParseSizeChart(nailOpt.size_chart);

      const shapesText = (shapesArr && shapesArr.length > 0) ? shapesArr.join(", ") : `<span class='text-red-500 font-bold'>${t('noSpecSet')}</span>`;
      const sizesText = (sizesArr && sizesArr.length > 0) ? sizesArr.join(", ") : `<span class='text-red-500 font-bold'>${t('noSpecSet')}</span>`;
      const hasCustomSizeChart = Object.keys(sizeChartObj).length > 0;

      const specContent = item.category_id === 'nails'
        ? `<div class="space-y-1">
             <div><b>Shapes:</b> ${shapesText}</div>
             <div><b>Sizes:</b> ${sizesText}</div>
             <div class="text-[11px] ${hasCustomSizeChart ? 'text-amber-700 font-semibold' : 'text-gray-400'}">${hasCustomSizeChart ? t('hasCustomChart') : t('usesStandardChart')}</div>
             <button onclick="openEditSpecModal('${item.id}', '${encodeURIComponent(JSON.stringify(shapesArr))}', '${encodeURIComponent(JSON.stringify(sizesArr))}', '${encodeURIComponent(JSON.stringify(sizeChartObj))}')" class="mt-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-bold border border-amber-300 shadow-sm">
               <i class="fa-solid fa-pen-to-square"></i> ${t('editSpecBtn')}
             </button>
           </div>`
        : (() => {
            const l = parseFloat(item.length || 0);
            const w = parseFloat(item.width || 0);
            const h = parseFloat(item.height || 0);
            const hasDim = l > 0 || w > 0 || h > 0;
            const dimText = hasDim
              ? `${l} × ${w} × ${h} mm`
              : `<span class='text-red-500 font-bold'>${t('noDimSet')}</span>`;
            return `<div class="space-y-1">
                 <div><b>L×W×H:</b> ${dimText}</div>
                 <button onclick="openEditDimensionsModal('${item.id}', ${l}, ${w}, ${h})" class="mt-1 px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-bold border border-blue-300 shadow-sm">
                   <i class="fa-solid fa-ruler-combined"></i> ${t('editDimBtn')}
                 </button>
               </div>`;
          })();

      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3">
            <img src="${item.spin_image || 'https://via.placeholder.com/60'}" class="w-12 h-12 object-cover rounded-lg border" alt="">
          </td>
          <td class="p-3 font-mono text-xs text-amber-900 font-bold">${item.id}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">${item.category_id}</span></td>
          <td class="p-3 font-medium text-gray-900">
            <div>${item.title_en || ''}</div>
            ${item.subtitle_en ? `<div class="text-[11px] text-gray-400 font-normal">${item.subtitle_en}</div>` : ''}
            <div class="mt-1 text-[11px]"><span class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">${item.tag_key || 'New'}</span></div>
          </td>
          <td class="p-3 text-xs text-gray-600">${specContent}</td>
          <td class="p-3 text-amber-800 font-bold">$${parseFloat(item.price).toFixed(2)}</td>
          <td class="p-3 space-y-1">
            <button onclick="openEditProductModal('${item.id}', '${encodeURIComponent(item.title_en || '')}', '${encodeURIComponent(item.subtitle_en || '')}', ${parseFloat(item.price) || 0}, '${encodeURIComponent(item.tag_key || '')}', '${encodeURIComponent(item.spin_image || '')}')" class="block px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-bold border border-stone-300 shadow-sm">
              <i class="fa-solid fa-pen-to-square"></i> ${t('editInfoBtn')}
            </button>
            <button onclick="deleteProduct('${item.id}')" class="block text-red-600 hover:text-red-800 text-xs font-semibold">${t('deleteBtn')}</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("加载商品失败:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">${t('loadProductsFailed')}</td></tr>`;
  }
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

async function handleAddProduct(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-btn");

  try {
    const id = document.getElementById("prod-id").value;
    const categoryId = document.getElementById("prod-category").value;
    const titleEn = document.getElementById("prod-title-en").value.trim();
    const subtitleEn = document.getElementById("prod-subtitle-en").value.trim();
    const price = parseFloat(document.getElementById("prod-price").value);
    const tagKey = document.getElementById("prod-tag-key").value.trim() || "New";
    const fileInput = document.getElementById("prod-image-file");

    // 立牌 / 古董家具的物理尺寸（穿戴甲不需要，留 0 即可）
    const length = parseFloat(document.getElementById("prod-length")?.value) || 0;
    const width = parseFloat(document.getElementById("prod-width")?.value) || 0;
    const height = parseFloat(document.getElementById("prod-height")?.value) || 0;

    let selectedShapes = [];
    let selectedSizes = [];
    let sizeChart = {};

    if (categoryId === "nails") {
      selectedShapes = Array.from(document.querySelectorAll(".shape-checkbox:checked")).map(cb => cb.value);
      selectedSizes = Array.from(document.querySelectorAll(".size-checkbox:checked")).map(cb => cb.value);
      sizeChart = collectSizeChartInputs("#nail-options-section .size-chart-input");

      if (selectedShapes.length === 0) {
        alert(t('alertNeedShape'));
        return;
      }
      if (selectedSizes.length === 0) {
        alert(t('alertNeedSize'));
        return;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = t('publishingBtn');
    }

    let imageUrl = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800";
    let uploadedImageUrls = [];

    // 支持一次选多张图片：全部上传，第一张同时作为 spin_image（主图/360°图），
    // 全部图片再写入 product_images 表，前台的缩略图画廊靠这张表驱动。
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const files = Array.from(fileInput.files);
      for (let i = 0; i < files.length; i++) {
        const compressedBlob = await compressImage(files[i]);
        const fileName = `${Date.now()}_${id}_${i}.jpg`;

        const { error: uploadError } = await supabaseClient.storage
          .from("product-media")
          .upload(fileName, compressedBlob, { contentType: "image/jpeg", upsert: true });

        if (uploadError) throw new Error(t('imageUploadFailed') + uploadError.message);

        const { data: publicUrlData } = supabaseClient.storage.from("product-media").getPublicUrl(fileName);
        uploadedImageUrls.push(publicUrlData.publicUrl);
      }
      imageUrl = uploadedImageUrls[0];
    }

    const { error: prodError } = await supabaseClient.from("products").insert([{
      id: id,
      category_id: categoryId,
      title_en: titleEn,
      subtitle_en: subtitleEn,
      price: price,
      tag_key: tagKey,
      tag_class: "bg-amber-800 text-white",
      spin_image: imageUrl,
      length: length,
      width: width,
      height: height
    }]);

    if (prodError) throw prodError;

    if (categoryId === "nails") {
      await supabaseClient.from("nail_options").insert([{
        product_id: id,
        shapes: selectedShapes,
        sizes: selectedSizes,
        size_chart: Object.keys(sizeChart).length > 0 ? sizeChart : null
      }]);
    }

    if (uploadedImageUrls.length > 0) {
      const imageRows = uploadedImageUrls.map((url, idx) => ({
        product_id: id,
        image_url: url,
        display_order: idx
      }));
      const { error: imgError } = await supabaseClient.from("product_images").insert(imageRows);
      if (imgError) throw new Error(t('galleryImageSaveFailed') + imgError.message);
    }

    logAdminActivity('product_create', `id: ${id}, title: ${titleEn}`);
    loadAdminActivityLog();

    alert(t('productPublishSuccess') + id);
    document.getElementById("add-product-form").reset();
    syncInches();
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer) {
      previewContainer.classList.add("hidden");
      previewContainer.innerHTML = "";
    }

    await generateSmartId();
    await loadAdminProducts();

  } catch (err) {
    console.error("发布失败:", err);
    alert(t('operationFailed') + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = t('publishProductBtn');
    }
  }
}

// 规格修改弹窗与安全更新逻辑
let currentEditingProdId = null;

function openEditSpecModal(prodId, shapesJsonEncoded, sizesJsonEncoded, sizeChartJsonEncoded) {
  currentEditingProdId = prodId;
  const shapes = JSON.parse(decodeURIComponent(shapesJsonEncoded));
  const sizes = JSON.parse(decodeURIComponent(sizesJsonEncoded));
  const sizeChart = sizeChartJsonEncoded ? JSON.parse(decodeURIComponent(sizeChartJsonEncoded)) : {};

  const SIZE_CHART_FINGERS = [
    { key: 'thumb', label: t('sizeChartHeaderThumb') },
    { key: 'index', label: t('sizeChartHeaderIndex') },
    { key: 'middle', label: t('sizeChartHeaderMiddle') },
    { key: 'ring', label: t('sizeChartHeaderRing') },
    { key: 'pinky', label: t('sizeChartHeaderPinky') }
  ];

  let modal = document.getElementById("modal-edit-spec");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-edit-spec";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-gray-900">${t('editSpecModalTitlePrefix')}<span id="edit-spec-prod-id" class="text-amber-800 font-mono"></span></h3>
          <button onclick="closeEditSpecModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">${t('shapesCheckboxLabel')}</label>
            <div class="flex flex-wrap gap-3" id="edit-shapes-container">
              ${["Almond", "Coffin", "Stiletto", "Square"].map(s => `
                <label class="inline-flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border hover:bg-gray-100">
                  <input type="checkbox" value="${s}" class="edit-shape-cb rounded text-amber-800 focus:ring-amber-800">
                  <span>${s}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">${t('sizesCheckboxLabel')}</label>
            <div class="flex flex-wrap gap-3" id="edit-sizes-container">
              ${["XS", "S", "M", "L"].map(sz => `
                <label class="inline-flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border hover:bg-gray-100">
                  <input type="checkbox" value="${sz}" class="edit-size-cb rounded text-amber-800 focus:ring-amber-800">
                  <span>${sz}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="pt-2 border-t">
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">${t('customSizeChartEditLabel')}</label>
            <div class="overflow-x-auto">
              <table class="w-full text-xs border-collapse min-w-[420px]">
                <thead>
                  <tr class="text-gray-500">
                    <th class="text-left py-1 pr-2 font-medium">${t('sizeChartHeaderSize')}</th>
                    ${SIZE_CHART_FINGERS.map(f => `<th class="text-center py-1 px-1 font-medium">${f.label}</th>`).join('')}
                  </tr>
                </thead>
                <tbody id="edit-size-chart-body">
                  ${["XS", "S", "M", "L"].map(sz => `
                    <tr>
                      <td class="py-1 pr-2 font-bold text-gray-700">${sz}</td>
                      ${SIZE_CHART_FINGERS.map(f => `
                        <td class="py-1 px-1"><input type="number" step="0.1" min="0" class="edit-size-chart-input w-16 border rounded px-1.5 py-1 text-xs" data-size="${sz}" data-finger="${f.key}" placeholder="${t('standardPlaceholder')}"></td>
                      `).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t">
          <button onclick="closeEditSpecModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">${t('cancelBtn')}</button>
          <button onclick="saveProductSpec()" class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-sm">${t('saveChangesBtn')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("edit-spec-prod-id").innerText = prodId;

  document.querySelectorAll(".edit-shape-cb").forEach(cb => {
    cb.checked = shapes.includes(cb.value);
  });
  document.querySelectorAll(".edit-size-cb").forEach(cb => {
    cb.checked = sizes.includes(cb.value);
  });
  document.querySelectorAll(".edit-size-chart-input").forEach(inp => {
    const size = inp.dataset.size;
    const finger = inp.dataset.finger;
    const val = (sizeChart[size] && sizeChart[size][finger] !== undefined && sizeChart[size][finger] !== null)
      ? sizeChart[size][finger]
      : '';
    inp.value = val;
  });

  modal.classList.remove("hidden");
}

function closeEditSpecModal() {
  document.getElementById("modal-edit-spec")?.classList.add("hidden");
}

// --- 修改商品基础信息弹窗（标题/副标题/价格/标签/主图）：商品发布后唯一能改这几项的地方 ---
let currentEditingInfoId = null;
let currentEditingInfoImage = "";
let editInfoNewImageFile = null;

function openEditProductModal(prodId, titleEncoded, subtitleEncoded, price, tagKeyEncoded, imageEncoded) {
  currentEditingInfoId = prodId;
  currentEditingInfoImage = imageEncoded ? decodeURIComponent(imageEncoded) : "";
  editInfoNewImageFile = null;

  const titleEn = titleEncoded ? decodeURIComponent(titleEncoded) : "";
  const subtitleEn = subtitleEncoded ? decodeURIComponent(subtitleEncoded) : "";
  const tagKey = tagKeyEncoded ? decodeURIComponent(tagKeyEncoded) : "";

  let modal = document.getElementById("modal-edit-info");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-edit-info";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-gray-900">${t('editInfoModalTitlePrefix')}<span id="edit-info-prod-id" class="text-stone-700 font-mono"></span></h3>
          <button onclick="closeEditProductModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${t('titleLabel')}</label>
            <input type="text" id="edit-info-title" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${t('subtitleLabel')}</label>
            <input type="text" id="edit-info-subtitle" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">${t('priceLabel')}</label>
              <input type="number" step="0.01" id="edit-info-price" class="w-full border rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">${t('tagLabel')}</label>
              <input type="text" id="edit-info-tag" class="w-full border rounded-lg px-3 py-2 text-sm">
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${t('currentImageLabel')}</label>
            <img id="edit-info-current-image" src="" class="w-20 h-20 object-cover rounded-lg border mb-2">
            <label class="block text-xs font-medium text-gray-700 mb-1">${t('replaceImageLabel')}</label>
            <input type="file" id="edit-info-image-file" accept="image/*" class="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer">
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t">
          <button onclick="closeEditProductModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">${t('cancelBtn')}</button>
          <button onclick="saveProductInfo()" id="edit-info-save-btn" class="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-sm">${t('saveChangesBtn')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("edit-info-image-file").addEventListener("change", (e) => {
      editInfoNewImageFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      if (editInfoNewImageFile) {
        document.getElementById("edit-info-current-image").src = URL.createObjectURL(editInfoNewImageFile);
      }
    });
  }

  document.getElementById("edit-info-prod-id").innerText = prodId;
  document.getElementById("edit-info-title").value = titleEn;
  document.getElementById("edit-info-subtitle").value = subtitleEn;
  document.getElementById("edit-info-price").value = price || 0;
  document.getElementById("edit-info-tag").value = tagKey;
  document.getElementById("edit-info-current-image").src = currentEditingInfoImage || "https://via.placeholder.com/80";
  const fileInput = document.getElementById("edit-info-image-file");
  if (fileInput) fileInput.value = "";

  modal.classList.remove("hidden");
}

function closeEditProductModal() {
  document.getElementById("modal-edit-info")?.classList.add("hidden");
}

async function saveProductInfo() {
  if (!currentEditingInfoId) return;

  const titleEn = document.getElementById("edit-info-title").value.trim();
  const subtitleEn = document.getElementById("edit-info-subtitle").value.trim();
  const price = parseFloat(document.getElementById("edit-info-price").value);
  const tagKey = document.getElementById("edit-info-tag").value.trim() || "New";
  const saveBtn = document.getElementById("edit-info-save-btn");

  if (!titleEn) {
    alert(t('alertNeedTitle'));
    return;
  }

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = t('savingConfigBtn');
    }

    let imageUrl = currentEditingInfoImage;

    // 只有选了新图片才重新上传替换主图，不选就保留原来的图
    if (editInfoNewImageFile) {
      const compressedBlob = await compressImage(editInfoNewImageFile);
      const fileName = `${Date.now()}_${currentEditingInfoId}_edit.jpg`;
      const { error: uploadError } = await supabaseClient.storage
        .from("product-media")
        .upload(fileName, compressedBlob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw new Error(t('imageUploadFailed') + uploadError.message);
      const { data: publicUrlData } = supabaseClient.storage.from("product-media").getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;

      // 重要：前台画廊只要 product_images 表里有记录，就完全以它为准，spin_image 只在
      // 完全没有画廊图片时才当兜底用。只改 products.spin_image 的话，只要商品本来就有
      // 画廊图（现在新建商品都会有），前台主图根本不会变——这里必须同步把画廊里
      // display_order = 0 的那张也换成新图，不然这个"替换主图"功能等于没生效。
      const { data: existingMainImg } = await supabaseClient
        .from("product_images")
        .select("id")
        .eq("product_id", currentEditingInfoId)
        .eq("display_order", 0)
        .maybeSingle();

      if (existingMainImg) {
        await supabaseClient.from("product_images").update({ image_url: imageUrl }).eq("id", existingMainImg.id);
      } else {
        await supabaseClient.from("product_images").insert([{ product_id: currentEditingInfoId, image_url: imageUrl, display_order: 0 }]);
      }
    }

    const updatePayload = {
      title_en: titleEn,
      subtitle_en: subtitleEn,
      price: isNaN(price) ? 0 : price,
      tag_key: tagKey
    };
    // 只有原来就有图或者这次选了新图才更新 spin_image，避免把已有主图误清空成空字符串
    if (imageUrl) updatePayload.spin_image = imageUrl;

    const { error } = await supabaseClient
      .from("products")
      .update(updatePayload)
      .eq("id", currentEditingInfoId);

    if (error) throw error;

    logAdminActivity('product_update_info', `id: ${currentEditingInfoId}, title: ${titleEn}`);
    loadAdminActivityLog();

    alert(t('infoSaveSuccess'));
    closeEditProductModal();
    loadAdminProducts();

  } catch (err) {
    console.error("保存商品信息失败:", err);
    alert(t('updateFailed') + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = t('saveChangesBtn');
    }
  }
}

// --- 立牌 / 古董家具：修改物理尺寸弹窗 ---
let currentEditingDimId = null;

function openEditDimensionsModal(prodId, length, width, height) {
  currentEditingDimId = prodId;

  let modal = document.getElementById("modal-edit-dimensions");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-edit-dimensions";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-gray-900">${t('editDimModalTitlePrefix')}<span id="edit-dim-prod-id" class="text-blue-800 font-mono"></span></h3>
          <button onclick="closeEditDimensionsModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${t('dimEditLength')}</label>
            <input type="number" step="0.1" min="0" id="edit-dim-length" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${t('dimEditWidth')}</label>
            <input type="number" step="0.1" min="0" id="edit-dim-width" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${t('dimEditHeight')}</label>
            <input type="number" step="0.1" min="0" id="edit-dim-height" class="w-full border rounded-lg px-3 py-2 text-sm">
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t">
          <button onclick="closeEditDimensionsModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">${t('cancelBtn')}</button>
          <button onclick="saveProductDimensions()" class="px-5 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm">${t('saveChangesBtn')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("edit-dim-prod-id").innerText = prodId;
  document.getElementById("edit-dim-length").value = length || 0;
  document.getElementById("edit-dim-width").value = width || 0;
  document.getElementById("edit-dim-height").value = height || 0;

  modal.classList.remove("hidden");
}

function closeEditDimensionsModal() {
  document.getElementById("modal-edit-dimensions")?.classList.add("hidden");
}

async function saveProductDimensions() {
  if (!currentEditingDimId) return;

  const length = parseFloat(document.getElementById("edit-dim-length").value) || 0;
  const width = parseFloat(document.getElementById("edit-dim-width").value) || 0;
  const height = parseFloat(document.getElementById("edit-dim-height").value) || 0;

  try {
    const { error } = await supabaseClient
      .from("products")
      .update({ length, width, height })
      .eq("id", currentEditingDimId);

    if (error) throw error;

    logAdminActivity('product_update_dimensions', `id: ${currentEditingDimId}, ${length}x${width}x${height}mm`);
    loadAdminActivityLog();

    alert(t('dimSaveSuccess'));
    closeEditDimensionsModal();
    loadAdminProducts();

  } catch (err) {
    console.error("保存尺寸失败:", err);
    alert(t('updateFailed') + err.message);
  }
}

async function saveProductSpec() {
  if (!currentEditingProdId) return;

  const newShapes = Array.from(document.querySelectorAll(".edit-shape-cb:checked")).map(cb => cb.value);
  const newSizes = Array.from(document.querySelectorAll(".edit-size-cb:checked")).map(cb => cb.value);
  const newSizeChart = collectSizeChartInputs(".edit-size-chart-input");
  const sizeChartToSave = Object.keys(newSizeChart).length > 0 ? newSizeChart : null;

  if (newShapes.length === 0 || newSizes.length === 0) {
    alert(t('alertNeedBoth'));
    return;
  }

  try {
    const { data: updateData, error: updateError } = await supabaseClient
      .from("nail_options")
      .update({ shapes: newShapes, sizes: newSizes, size_chart: sizeChartToSave })
      .eq("product_id", currentEditingProdId)
      .select();

    if (updateError) throw updateError;

    if (!updateData || updateData.length === 0) {
      const { error: insertError } = await supabaseClient
        .from("nail_options")
        .insert([{ product_id: currentEditingProdId, shapes: newShapes, sizes: newSizes, size_chart: sizeChartToSave }]);
      if (insertError) throw insertError;
    }

    logAdminActivity('product_update_spec', `id: ${currentEditingProdId}, shapes: ${newShapes.join('/')}, sizes: ${newSizes.join('/')}`);
    loadAdminActivityLog();

    alert(t('specSaveSuccess'));
    closeEditSpecModal();
    loadAdminProducts();

  } catch(err) {
    console.error("保存失败:", err);
    alert(t('updateFailed') + err.message);
  }
}

// 压缩图片但保持原始宽高比例，不再强行拉伸/压扁成 800x800 正方形。
// 之前的版本把任何比例的照片都硬塞进正方形画布，非正方形的原图会被拉变形；
// 前台展示时用的是 object-cover 只负责裁剪，并不能把已经被拉伸的图片"拉回来"，
// 所以变形是在这一步产生的。现在改成：按最长边缩放到 maxDim 以内，比例不变。
function compressImage(file, maxDim = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

// 商品图片实时预览：支持多选，第一张标注为主图
function handleImagePreview(e) {
  const files = Array.from(e.target.files || []);
  const previewContainer = document.getElementById("image-preview-container");
  if (!previewContainer) return;

  if (files.length === 0) {
    previewContainer.classList.add("hidden");
    previewContainer.innerHTML = "";
    return;
  }

  previewContainer.innerHTML = files.map((f, i) => `
    <div class="relative">
      <img src="${URL.createObjectURL(f)}" class="w-20 h-20 object-cover rounded-lg border ${i === 0 ? 'ring-2 ring-amber-600' : ''}">
      ${i === 0 ? `<span class="absolute -top-1.5 -left-1.5 bg-amber-800 text-white text-[9px] px-1.5 py-0.5 rounded-full">${t('mainImageBadge')}</span>` : ''}
    </div>
  `).join('');
  previewContainer.classList.remove("hidden");
}

// 新增：Hero 背景图实时预览
function handleHeroBgPreview(e) {
  const file = e.target.files[0];
  const previewImg = document.getElementById("cfg-hero-bg-preview");
  const previewContainer = document.getElementById("cfg-hero-bg-preview-container");

  if (file && previewImg && previewContainer) {
    previewImg.src = URL.createObjectURL(file);
    previewContainer.classList.remove("hidden");
  }
}

async function deleteProduct(productId) {
  if (!confirm(t('confirmDeleteProduct').replace('{id}', productId))) return;
  try {
    // 商品编码是按"当前商品总数+分类内数量"生成的（见 generateSmartId），
    // 删除一个商品之后，同样的编码之后可能被新商品复用。product_images 表对 products
    // 有 on delete cascade，会自动清掉；但 nail_options 表建得比较早，不确定有没有
    // 加这个级联规则，为保险起见这里显式把两张关联表也一起清掉，避免新商品复用编码后
    // "捡到"被删商品遗留下来的甲型/尺码/画廊图片。
    await supabaseClient.from("nail_options").delete().eq("product_id", productId);
    await supabaseClient.from("product_images").delete().eq("product_id", productId);
    const { error } = await supabaseClient.from("products").delete().eq("id", productId);
    if (error) throw error;
    logAdminActivity('product_delete', `id: ${productId}`);
    loadAdminActivityLog();
  } catch (err) {
    console.error("删除商品失败:", err);
    alert(t('operationFailed') + err.message);
  }
  loadAdminProducts();
  generateSmartId();
}

// --- 订单管理：读取 orders 表并展示，当前都是模拟结算产生的订单，还没有真实支付 ---
async function loadAdminOrders() {
  const tbody = document.getElementById("admin-order-list");
  if (!tbody) return;

  try {
    const { data: orders, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-500">${t('noOrders')}</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const created = o.created_at ? new Date(o.created_at).toLocaleString() : '';
      const addr = [o.address, o.city, o.state, o.zip].filter(Boolean).join(', ');
      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3 font-mono text-xs text-amber-900 font-bold">${o.id}</td>
          <td class="p-3 text-gray-900">${o.first_name || ''} ${o.last_name || ''}</td>
          <td class="p-3 text-xs text-gray-600">${o.email || ''}<br>${o.phone || ''}</td>
          <td class="p-3 text-xs text-gray-600">${addr}</td>
          <td class="p-3 text-amber-800 font-bold">$${parseFloat(o.total || 0).toFixed(2)}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">${o.status || 'pending_test_payment'}</span></td>
          <td class="p-3 text-xs text-gray-500">${created}</td>
          <td class="p-3">
            <button onclick="openOrderItemsModal('${o.id}')" class="text-amber-800 hover:text-amber-900 text-xs font-semibold">${t('viewDetailsBtn')}</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("加载订单失败:", err);
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">${t('loadOrdersFailed')}</td></tr>`;
  }
}

async function openOrderItemsModal(orderId) {
  let modal = document.getElementById("modal-order-items");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-order-items";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-gray-900">${t('orderDetailsModalTitlePrefix')}<span id="order-items-order-id" class="text-amber-800 font-mono"></span></h3>
          <button onclick="closeOrderItemsModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div id="order-items-body" class="space-y-2 text-sm"></div>
        <div class="flex justify-end pt-2 border-t">
          <button onclick="closeOrderItemsModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">${t('closeBtn')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("order-items-order-id").innerText = orderId;
  const body = document.getElementById("order-items-body");
  body.innerHTML = `<p class="text-gray-400 text-xs">${t('loadingText')}</p>`;
  modal.classList.remove("hidden");

  try {
    const { data: items, error } = await supabaseClient
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (error) throw error;

    if (!items || items.length === 0) {
      body.innerHTML = `<p class="text-gray-400 text-xs">${t('noOrderItems')}</p>`;
      return;
    }

    body.innerHTML = items.map(it => `
      <div class="flex items-center justify-between border-b pb-2">
        <div>
          <div class="font-medium text-gray-900">${it.title}</div>
          <div class="text-xs text-gray-500">${[it.variant_shape, it.variant_size].filter(Boolean).join(' / ')} × ${it.qty}</div>
        </div>
        <div class="font-bold text-amber-800">$${(parseFloat(it.unit_price) * it.qty).toFixed(2)}</div>
      </div>
    `).join('');

  } catch (err) {
    console.error("加载订单明细失败:", err);
    body.innerHTML = `<p class="text-red-500 text-xs">${t('loadFailedPrefix')}${err.message}</p>`;
  }
}

function closeOrderItemsModal() {
  document.getElementById("modal-order-items")?.classList.add("hidden");
}

// 加载站点配置与回显（改为从 Supabase 的 site_settings 表读取，不再用只存在本机的 localStorage）
async function loadSiteSettings() {
  try {
    const { data: cfg, error } = await supabaseClient
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;
    if (!cfg) return;

    if (cfg.logo && document.getElementById("cfg-site-logo")) {
      document.getElementById("cfg-site-logo").value = cfg.logo;
    }
    if (cfg.banner && document.getElementById("cfg-banner-text")) {
      document.getElementById("cfg-banner-text").value = cfg.banner;
    }
    if (cfg.hero_title && document.getElementById("cfg-hero-title")) {
      document.getElementById("cfg-hero-title").value = cfg.hero_title;
    }
    if (cfg.hero_desc && document.getElementById("cfg-hero-desc")) {
      document.getElementById("cfg-hero-desc").value = cfg.hero_desc;
    }
    if (cfg.hero_bg && document.getElementById("cfg-hero-bg-preview")) {
      const prev = document.getElementById("cfg-hero-bg-preview");
      const container = document.getElementById("cfg-hero-bg-preview-container");
      prev.src = cfg.hero_bg;
      container.classList.remove("hidden");
    }
  } catch (err) {
    console.error("加载站点配置失败:", err);
  }
}

// 保存站点配置并上传自定义 Hero 背景图
async function handleSaveSettings(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = t('savingConfigBtn');
    }

    const fileInput = document.getElementById("cfg-hero-bg-file");

    // 先取云端现有的背景图地址，避免没有重新上传图片时把已有背景图清空
    let heroBgUrl = "";
    try {
      const { data: existing } = await supabaseClient.from("site_settings").select("hero_bg").eq("id", 1).single();
      if (existing && existing.hero_bg) heroBgUrl = existing.hero_bg;
    } catch (e) { /* 表可能还没有数据，忽略 */ }

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const compressedBlob = await compressImage(fileInput.files[0]);
      const fileName = `hero_banner_${Date.now()}.jpg`;

      const { error: uploadError } = await supabaseClient.storage
        .from("product-media")
        .upload(fileName, compressedBlob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw new Error(t('heroUploadFailed') + uploadError.message);

      const { data: publicUrlData } = supabaseClient.storage.from("product-media").getPublicUrl(fileName);
      heroBgUrl = publicUrlData.publicUrl;
    }

    const cfg = {
      id: 1,
      logo: document.getElementById("cfg-site-logo") ? document.getElementById("cfg-site-logo").value : "",
      banner: document.getElementById("cfg-banner-text") ? document.getElementById("cfg-banner-text").value : "",
      hero_title: document.getElementById("cfg-hero-title") ? document.getElementById("cfg-hero-title").value : "",
      hero_desc: document.getElementById("cfg-hero-desc") ? document.getElementById("cfg-hero-desc").value : "",
      hero_bg: heroBgUrl
    };

    // 写入 Supabase 的 site_settings 表（单行 id=1），所有访客都会看到这份配置
    const { error: saveError } = await supabaseClient.from("site_settings").upsert(cfg);
    if (saveError) throw saveError;

    logAdminActivity('settings_update', '');
    loadAdminActivityLog();

    alert(t('siteConfigSaveSuccess'));
    await loadSiteSettings();

  } catch (err) {
    console.error("保存设置出错:", err);
    alert(t('saveFailed') + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = t('saveSiteConfigBtn');
    }
  }
}