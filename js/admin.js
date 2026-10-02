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
    nailsVideoLabel: "Nails Section - Handmade Process Video (custom upload)",
    nailsVideoHint: "Please compress it before uploading (a few MB up to ~15MB). A 30-60 second looping clip works best. Re-uploading replaces the current video.",
    removeVideoBtn: "Remove this video",
    nailsVideoTooLargeWarning: "This video is larger than 50MB, which may be slow to load for visitors and use up storage/bandwidth quickly. Continue uploading anyway?",
    nailsVideoUploadFailed: "Video upload failed: ",
    nailsVideoUploadCancelled: "Video upload cancelled.",
    taxRateLabel: "Checkout Tax Rate (%)",
    taxRateHint: "Customers are charged this percentage as tax at checkout, e.g. 8 means 8%. Takes effect immediately after saving.",
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
    visitStatsSectionTitle: "📊 Site Traffic Stats",
    rangeToday: "Today",
    rangeWeek: "This Week",
    rangeMonth: "This Month",
    rangeYear: "This Year",
    rangeAll: "All Time",
    loadingVisitStats: "Loading traffic stats...",
    loadVisitStatsFailed: "Failed to load traffic stats.",
    totalVisitsLabel: "Total Page Views",
    trafficSourceLabel: "Traffic Source",
    topCountriesLabel: "Top Countries",
    topCitiesLabel: "Top Cities",
    noVisitData: "No visit data for this period yet.",
    unknownLocation: "Unknown",
    sourceInstagram: "Instagram",
    sourceFacebook: "Facebook",
    sourceTikTok: "TikTok",
    sourceSearch: "Search Engines",
    sourceDirect: "Direct",
    sourceReferral: "Other Referral",
    sourceOther: "Other",
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
    logEventStockUpdate: "Stock updated",
    logEventStockAdjust: "Stock adjusted",
    noProducts: "No products in the database yet.",
    stockColLabel: "Stock",
    manageStockBtn: "Manage Stock",
    stockModalTitlePrefix: "Manage Stock - ",
    currentStockLabel: "Current stock quantity",
    stockByVariantHint: "Enter the current on-hand quantity for each shape + size combination. This overwrites the stored count — e.g. if 20 were left and you just received 30, enter 50, not 30.",
    stockNeedsSpecHint: "Set at least one shape and one size first, then you'll be able to enter stock per combination.",
    saveStockBtn: "Save Stock",
    stockSaveSuccess: "✨ Stock updated successfully!",
    adjustStockSectionTitle: "Loss / Damage Adjustment",
    adjustStockHint: "Use this for lost or damaged units, a stock-count correction, or a return — enter a negative number to remove stock, positive to add it back.",
    adjustQtyLabel: "Adjustment amount (+/-)",
    adjustReasonLabel: "Reason",
    adjustReasonDamage: "Damaged",
    adjustReasonLost: "Lost",
    adjustReasonCorrection: "Stock count correction",
    adjustReasonReturn: "Returned to stock",
    applyAdjustBtn: "Apply Adjustment",
    adjustSuccess: "✨ Adjustment applied!",
    adjustNeedAmount: "⚠️ Please enter a non-zero adjustment amount!",
    printLabelBtn: "Print Barcode Label",
    labelCopiesLabel: "Number of labels",
    labelPrintModalTitle: "Print QR Code Label",
    generateLabelsBtn: "Generate & Print",
    noStockYet: "Not set up yet",
    labelSheetPresetLabel: "Label sheet type",
    labelPresetApproxHint: "These are common approximations. If it doesn't line up with the sheet you actually bought, use \"Custom\" and enter the exact columns/rows/size printed on the sheet's packaging.",
    labelPresetA4_21: "A4 — 21 labels (3×7, ~70×42.3mm)",
    labelPresetA4_24: "A4 — 24 labels (3×8, ~70×36mm)",
    labelPresetA4_32: "A4 — 32 labels (4×8, ~52.5×29.7mm)",
    labelPresetA4_65: "A4 — 65 labels (5×13, ~38.1×21.2mm)",
    labelPresetLetter30: "US Letter — 30 labels (Avery 5160-style, 3×10, 1\"×2.625\")",
    labelPresetCustom: "Custom (enter exact dimensions)",
    labelPageSizeLabel: "Page size",
    labelColsLabel: "Columns",
    labelRowsLabel: "Rows",
    labelGapXLabel: "Gap X (mm)",
    labelGapYLabel: "Gap Y (mm)",
    labelStartPositionLabel: "Start at position #",
    labelStartPositionHint: "If the first few labels on your sheet are already used, enter which position to start from (1 = top-left) — earlier positions are left blank so nothing prints on used labels.",
    labelStartPositionTooLarge: "⚠️ This sheet only has {n} labels — the start position can't exceed that.",
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
    saveFailed: "Save failed: ",
    tryonCalibratorTitle: "🖐️ Virtual Try-On · Hand Model Nail Position Calibration",
    tryonCalibratorDesc: "If the try-on overlay doesn't line up with the nail length/width/angle on the hand photo, drag to adjust it here — this one shared position applies to every product site-wide, so changing it once updates everywhere.",
    openCalibratorBtn: "Open Calibration Tool",
    categoryMgmtTitle: "🗂️ Category Management",
    addCategoryBtn: "+ Add Category",
    categoryMgmtDesc: "Each storefront section (Nails / Merch / Furniture...) corresponds to one row here. Use the order arrows to reorder sections; \"Hide\" doesn't delete the data, it just takes it off the storefront for now. Before deleting a category, move or delete its products first.",
    thCatOrder: "Order",
    thCatName: "Category Name",
    thCatPrefix: "ID Prefix",
    thCatType: "Product Type",
    thCatAccent: "Color Style",
    thCatSubtypes: "Subtype Tags",
    thCatStatus: "Status",
    thCatAction: "Actions",
    loadingCategories: "Loading categories...",
    noCategoriesYet: "No categories yet — click \"+ Add Category\" above to create one",
    catTypeVariants: "Shape+Size Variants (Nails only)",
    catTypeFixed: "Fixed-Quantity Stock",
    accentAmber: "Amber",
    accentStone: "Stone",
    manageTagsPrefix: "Manage ({n})",
    addTagsBtn: "+ Add Tags",
    catActiveLabel: "Live on Storefront",
    catHiddenLabel: "Hidden",
    catEditBtn: "Edit",
    categoryEditorTitleNew: "Add Category",
    categoryEditorTitleEditPrefix: "Edit Category — ",
    catSlugLabel: "Category ID (slug — lowercase letters/numbers/underscore only, can't be changed after creation, e.g. jewelry)",
    catNameZhLabel: "Chinese Name",
    catNameEnLabel: "English Name",
    catSubtitleZhLabel: "Chinese Subtitle",
    catSubtitleEnLabel: "English Subtitle",
    catPrefixLabel: "ID Prefix",
    catAspectLabel: "Card Aspect Ratio",
    catAspectSquareOpt: "Square (jewelry / acrylic style)",
    catAspectWideOpt: "Wide 4:3 (large furniture items)",
    catAccentLabel: "Color Style",
    catAccentStoneOpt: "Stone (modern)",
    catAccentAmberOpt: "Amber (vintage)",
    catSaveBtn: "Save Category",
    catSlugInvalidError: "Category ID can only use lowercase letters, numbers, and underscores",
    catDuplicateSlugError: "This category ID is already taken, try another one",
    catSaveFailedPrefix: "Save failed: ",
    subtypeEditorTitlePrefix: "Subtype Tags — ",
    subtypeEditorHint: "These tags become the filter buttons on this category's storefront section (e.g. \"All/Headwear/Earrings/Necklace...\"). You can optionally pick one subtype when adding a product.",
    subtypeNoneYet: "No subtype tags yet — add the first one below",
    subtypeNameZhPlaceholder: "Chinese, e.g. 耳环",
    subtypeNameEnPlaceholder: "English, e.g. Earrings",
    subtypeAddBtn: "Add",
    subtypeNotSetOption: "Not set",
    subtypeDeleteConfirm: "Delete this subtype tag? Products already using it won't be deleted — they'll just lose the tag, and you'll need to pick a new one manually.",
    subtypeDuplicateError: "This English name already exists under this category, try another one",
    subtypeAddFailedPrefix: "Add failed: ",
    subtypeDeleteFailedPrefix: "Delete failed: ",
    deleteCategoryConfirmTemplate: 'Delete category "{name}"? If it still has products, the database will reject the deletion — move or delete those products first.',
    deleteCategoryFkError: 'Can\'t delete: this category still has products. Go to "Live Product List" to move or delete them first, then come back to delete this category.',
    deleteCategoryFailedPrefix: "Delete failed: "
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
    nailsVideoLabel: "穿戴甲栏目 - 手工制作视频（自定义上传）",
    nailsVideoHint: "建议提前压缩好体积（几MB到十几MB以内），时长30-60秒的循环片段效果最好。重新上传会替换掉当前视频。",
    removeVideoBtn: "移除这个视频",
    nailsVideoTooLargeWarning: "这个视频超过50MB，访客加载可能会比较慢，也会更快用掉存储和流量额度。确定要继续上传吗？",
    nailsVideoUploadFailed: "视频上传失败：",
    nailsVideoUploadCancelled: "已取消上传视频。",
    taxRateLabel: "结算税率 (%)",
    taxRateHint: "顾客结算页会按这个百分比算税费，比如填 8 就是 8%。改完保存后前台立刻生效。",
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
    visitStatsSectionTitle: "📊 网站访问统计",
    rangeToday: "今日",
    rangeWeek: "本周",
    rangeMonth: "本月",
    rangeYear: "本年",
    rangeAll: "全部",
    loadingVisitStats: "正在加载访问统计...",
    loadVisitStatsFailed: "访问统计加载失败。",
    totalVisitsLabel: "总访问量",
    trafficSourceLabel: "流量来源",
    topCountriesLabel: "访客国家排名",
    topCitiesLabel: "访客城市排名",
    noVisitData: "这个时间段内还没有访问数据。",
    unknownLocation: "未知",
    sourceInstagram: "Instagram",
    sourceFacebook: "Facebook",
    sourceTikTok: "TikTok",
    sourceSearch: "搜索引擎",
    sourceDirect: "直接访问",
    sourceReferral: "其它网站引荐",
    sourceOther: "其它",
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
    logEventStockUpdate: "更新库存",
    logEventStockAdjust: "库存调整",
    noProducts: "数据库中暂无商品。",
    stockColLabel: "库存",
    manageStockBtn: "库存管理",
    stockModalTitlePrefix: "库存管理 - ",
    currentStockLabel: "当前库存数量",
    stockByVariantHint: "为每个甲型+尺寸组合填写当前实际库存总数（不是本次新增数）——比如补货前剩20个，这次进30个，直接填50，不是填30。",
    stockNeedsSpecHint: "请先设置至少一个甲型和一个尺寸，之后才能按组合填写库存。",
    saveStockBtn: "保存库存",
    stockSaveSuccess: "✨ 库存已更新！",
    adjustStockSectionTitle: "损耗 / 丢失调整",
    adjustStockHint: "用于记录损坏、丢失、盘点修正或退货入库——填负数表示减少库存，填正数表示补回库存。",
    adjustQtyLabel: "调整数量（正数增加，负数减少）",
    adjustReasonLabel: "原因",
    adjustReasonDamage: "损坏",
    adjustReasonLost: "丢失",
    adjustReasonCorrection: "盘点修正",
    adjustReasonReturn: "退货入库",
    applyAdjustBtn: "应用调整",
    adjustSuccess: "✨ 调整已生效！",
    adjustNeedAmount: "⚠️ 请填写不为0的调整数量！",
    printLabelBtn: "打印条码标签",
    labelCopiesLabel: "打印份数",
    labelPrintModalTitle: "打印二维码标签",
    generateLabelsBtn: "生成并打印",
    noStockYet: "尚未设置",
    labelSheetPresetLabel: "标签纸型号",
    labelPresetApproxHint: "以下是常见规格的近似值。如果和你实际买到的标签纸对不上，选“自定义”，照标签纸包装/衬纸上印的列数、行数、单格尺寸精确填写。",
    labelPresetA4_21: "A4 — 21格 (3列×7行, 约70×42.3mm)",
    labelPresetA4_24: "A4 — 24格 (3列×8行, 约70×36mm)",
    labelPresetA4_32: "A4 — 32格 (4列×8行, 约52.5×29.7mm)",
    labelPresetA4_65: "A4 — 65格 (5列×13行, 约38.1×21.2mm)",
    labelPresetLetter30: "US Letter — 30格 (Avery 5160风格, 3列×10行, 1\"×2.625\")",
    labelPresetCustom: "自定义（精确填写尺寸）",
    labelPageSizeLabel: "纸张大小",
    labelColsLabel: "列数",
    labelRowsLabel: "行数",
    labelGapXLabel: "横向间距 (mm)",
    labelGapYLabel: "纵向间距 (mm)",
    labelStartPositionLabel: "从第几个位置开始",
    labelStartPositionHint: "如果这张标签纸前面几个格子已经用掉了，填从第几个开始打印（1 = 左上角第一个）——前面的格子会留空跳过，不会印到已用过的标签上。",
    labelStartPositionTooLarge: "⚠️ 这个型号一页只有 {n} 个标签格，起始位置不能超过这个数。",
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
    saveFailed: "保存失败: ",
    tryonCalibratorTitle: "🖐️ 虚拟试戴 · 手模型指甲位置标定",
    tryonCalibratorDesc: "如果试戴贴图跟手模型照片里实际的指甲长短/宽窄/方向对不上，在这里直接拖动调整——全站所有商品共用这一份位置，改一次全部生效。",
    openCalibratorBtn: "打开标定工具",
    categoryMgmtTitle: "🗂️ 分类管理",
    addCategoryBtn: "+ 新增分类",
    categoryMgmtDesc: "前台每个大栏目（穿戴甲/亚克力/家具...）对应这里的一条分类。拖动排序框可以调整栏目先后顺序；\"隐藏\"不会删除数据，只是暂时不在前台显示。删除分类前，需要先把该分类下的商品转移或删除。",
    thCatOrder: "排序",
    thCatName: "分类名称",
    thCatPrefix: "编码前缀",
    thCatType: "商品类型",
    thCatAccent: "配色风格",
    thCatSubtypes: "子类型标签",
    thCatStatus: "状态",
    thCatAction: "操作",
    loadingCategories: "正在加载分类列表...",
    noCategoriesYet: "还没有任何分类，点右上角\"新增分类\"添加一个",
    catTypeVariants: "规格变体（穿戴甲专属）",
    catTypeFixed: "固定数量库存",
    accentAmber: "琥珀棕",
    accentStone: "黑白灰",
    manageTagsPrefix: "管理（{n}个）",
    addTagsBtn: "+ 添加标签",
    catActiveLabel: "前台显示中",
    catHiddenLabel: "已隐藏",
    catEditBtn: "编辑",
    categoryEditorTitleNew: "新增分类",
    categoryEditorTitleEditPrefix: "编辑分类 — ",
    catSlugLabel: "分类标识（slug，仅英文小写字母/数字/下划线，创建后不可修改，比如 jewelry）",
    catNameZhLabel: "中文名称",
    catNameEnLabel: "英文名称",
    catSubtitleZhLabel: "中文副标题",
    catSubtitleEnLabel: "英文副标题",
    catPrefixLabel: "编码前缀",
    catAspectLabel: "卡片比例",
    catAspectSquareOpt: "正方形（首饰/亚克力类）",
    catAspectWideOpt: "横向 4:3（家具类大件）",
    catAccentLabel: "配色风格",
    catAccentStoneOpt: "黑白灰（现代感）",
    catAccentAmberOpt: "琥珀棕（复古感）",
    catSaveBtn: "保存分类",
    catSlugInvalidError: "分类标识只能用英文小写字母、数字、下划线",
    catDuplicateSlugError: "这个分类标识已经被用过了，换一个试试",
    catSaveFailedPrefix: "保存失败：",
    subtypeEditorTitlePrefix: "子类型标签 — ",
    subtypeEditorHint: "这些标签会作为前台该分类栏目里的筛选按钮（比如\"全部/头饰/耳环/项链...\"）。添加商品时可以选一个子类型，不选也可以。",
    subtypeNoneYet: "还没有子类型标签，在下面添加第一个",
    subtypeNameZhPlaceholder: "中文，如 耳环",
    subtypeNameEnPlaceholder: "英文，如 Earrings",
    subtypeAddBtn: "添加",
    subtypeNotSetOption: "不设置",
    subtypeDeleteConfirm: "确定删除这个子类型标签吗？用过这个标签的商品不会被删除，只是会失去这个标签，需要手动重新选一个。",
    subtypeDuplicateError: "这个英文名称在当前分类下已经存在了，换一个试试",
    subtypeAddFailedPrefix: "添加失败：",
    subtypeDeleteFailedPrefix: "删除失败：",
    deleteCategoryConfirmTemplate: '确定要删除分类"{name}"吗？如果这个分类下还有商品，删除会被数据库拒绝（需要先把商品转移到别的分类或删除）。',
    deleteCategoryFkError: '无法删除：这个分类下还有商品。请先到"在线商品管理列表"把相关商品转移到其它分类或删除，再来删除这个分类。',
    deleteCategoryFailedPrefix: "删除失败："
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
    loadSiteVisitStats(currentVisitRange);
    renderCategoryList(); // 分类管理表格是用 t() 现场拼的字符串，不是靠 data-i18n，要手动重渲染一次
    populateCategoryDropdown();
    if (currentSubtypeEditingCategory) {
      document.getElementById("subtype-editor-category-name").innerText = (() => {
        const cat = adminCategories.find(c => c.id === currentSubtypeEditingCategory);
        return cat ? (currentAdminLang === 'zh' ? cat.name_zh : cat.name_en) : '';
      })();
      renderSubtypeList();
    }
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

async function onAdminAuthenticated() {
  isAdminAuthenticated = true;
  const lockScreen = document.getElementById("admin-lock-screen");
  if (lockScreen) lockScreen.style.display = "none";
  // 分类列表要先加载完，"添加商品"表单的分类下拉框、自动编码前缀才有数据可用，
  // 所以这里 await 一下，不跟其它互不相关的加载一起并发触发
  await loadCategories();
  loadAdminProducts();
  loadAdminOrders();
  loadSiteSettings();
  loadAdminActivityLog();
  loadSiteVisitStats(currentVisitRange);
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
  settings_update: 'logEventSettingsUpdate',
  stock_update: 'logEventStockUpdate',
  stock_adjust: 'logEventStockAdjust'
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
          <td class="p-3 text-xs text-gray-500" data-label="${t('thLogTime')}">${timeStr}</td>
          <td class="p-3 text-xs text-gray-700" data-label="${t('thLogActor')}">${row.actor_email || ''}</td>
          <td class="p-3 text-xs font-semibold text-gray-900" data-label="${t('thLogEvent')}">${eventLabel}</td>
          <td class="p-3 text-xs text-gray-500" data-label="${t('thLogDetail')}">${row.detail || ''}</td>
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

// ===================== 网站访问统计（来源渠道 + 地理位置）=====================
// 数据来自 site_visits 表，每一行是前台一次页面打开（见 js/app.js 的 trackSiteVisit()）。
// 这里直接在浏览器里把这个时间范围内的原始行拉回来，在前端用 JS 汇总成"总访问量/渠道占比/
// 地区分布"，不需要额外写数据库函数或者物化视图——对一个中小型独立站的访问量级来说，
// 哪怕是"本月"这种范围，几千行数据客户端汇总也很快，等以后访问量大到明显变卡顿了，
// 再考虑把汇总逻辑搬到数据库那边（比如用 Supabase 的 RPC 函数做 group by）也不迟。
let currentVisitRange = 'week';

const VISIT_SOURCE_LABEL_KEYS = {
  instagram: 'sourceInstagram',
  facebook: 'sourceFacebook',
  tiktok: 'sourceTikTok',
  search: 'sourceSearch',
  direct: 'sourceDirect',
  referral: 'sourceReferral',
  other: 'sourceOther'
};

// 按"自然周期"算起始时间（今天凌晨 / 本周一凌晨 / 本月1号凌晨 / 本年1月1号凌晨），
// 而不是"过去24/7×24/30×24小时"这种滚动窗口——更符合"今日访问量、本周、本月、年访问量"
// 这种日常统计习惯，方便和每天/每周/每月的运营节奏对上。
// 一周的起点按周一算（国际通用的 ISO 周习惯），不是周日。
function rangeStartIso(range) {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (range === 'week') {
    const dayOfWeek = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const daysSinceMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday).toISOString();
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  if (range === 'year') {
    return new Date(now.getFullYear(), 0, 1).toISOString();
  }
  return null; // 'all'
}

function updateVisitRangeButtonStyles() {
  document.querySelectorAll('.visit-range-btn').forEach(btn => {
    const isActive = btn.dataset.range === currentVisitRange;
    btn.classList.toggle('bg-stone-900', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('border-stone-900', isActive);
    btn.classList.toggle('bg-white', !isActive);
    btn.classList.toggle('text-stone-600', !isActive);
    btn.classList.toggle('border-stone-300', !isActive);
  });
}

async function loadSiteVisitStats(range) {
  currentVisitRange = range || currentVisitRange;
  updateVisitRangeButtonStyles();
  const bodyEl = document.getElementById('visit-stats-body');
  if (!bodyEl) return;
  bodyEl.innerHTML = `<p class="text-xs text-gray-400">${t('loadingVisitStats')}</p>`;

  try {
    let query = supabaseClient
      .from('site_visits')
      .select('created_at, source, referral_domain, country, region, city')
      .order('created_at', { ascending: false })
      .limit(5000); // 安全上限，避免访问量极大的时候一次拉太多行拖慢后台

    const startIso = rangeStartIso(currentVisitRange);
    if (startIso) query = query.gte('created_at', startIso);

    const { data: rows, error } = await query;
    if (error) throw error;

    renderVisitStatsBody(rows || []);
  } catch (err) {
    console.error('加载访问统计失败:', err);
    bodyEl.innerHTML = `<p class="text-xs text-red-500">${t('loadVisitStatsFailed')}</p>`;
  }
}

function renderVisitStatsBody(rows) {
  const bodyEl = document.getElementById('visit-stats-body');
  if (!bodyEl) return;

  const total = rows.length;
  if (total === 0) {
    bodyEl.innerHTML = `
      <div class="bg-stone-50 rounded-xl p-4 text-center mb-4">
        <div class="text-2xl font-bold text-gray-900">0</div>
        <div class="text-xs text-gray-500 mt-1">${t('totalVisitsLabel')}</div>
      </div>
      <p class="text-xs text-gray-400 text-center">${t('noVisitData')}</p>
    `;
    return;
  }

  // --- 按渠道分组：instagram/facebook/tiktok/search/direct/other 直接用 source 作为分组键，
  //     referral（其它网站引荐）则按具体域名再细分一次，方便发现除了社交媒体以外的重要引荐来源。
  const sourceCounts = {};
  rows.forEach(r => {
    const key = (r.source === 'referral' && r.referral_domain) ? `referral:${r.referral_domain}` : (r.source || 'other');
    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
  });
  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);

  function sourceLabel(key) {
    if (key.startsWith('referral:')) {
      return `${t('sourceReferral')} (${key.slice('referral:'.length)})`;
    }
    const labelKey = VISIT_SOURCE_LABEL_KEYS[key];
    return labelKey ? t(labelKey) : key;
  }

  const sourceBarsHtml = sourceEntries.slice(0, 8).map(([key, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    return `
      <div class="space-y-1">
        <div class="flex justify-between text-xs text-gray-600">
          <span class="font-medium">${sourceLabel(key)}</span>
          <span>${count} · ${pct}%</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2">
          <div class="bg-amber-700 h-2 rounded-full" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  // --- 按国家分组 ---
  const countryCounts = {};
  rows.forEach(r => {
    const key = r.country || t('unknownLocation');
    countryCounts[key] = (countryCounts[key] || 0) + 1;
  });
  const countryEntries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // --- 按城市分组（城市+州/省一起显示，避免重名城市混在一起，比如 Springfield 好几个州都有）---
  const cityCounts = {};
  rows.forEach(r => {
    if (!r.city) return;
    const key = [r.city, r.region].filter(Boolean).join(', ');
    cityCounts[key] = (cityCounts[key] || 0) + 1;
  });
  const cityEntries = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  function geoBarsHtml(entries) {
    if (entries.length === 0) {
      return `<p class="text-xs text-gray-400">${t('noVisitData')}</p>`;
    }
    const maxCount = entries[0][1];
    return entries.map(([label, count]) => {
      const pct = ((count / maxCount) * 100).toFixed(1);
      return `
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-gray-600">
            <span class="font-medium">${label}</span>
            <span>${count}</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  bodyEl.innerHTML = `
    <div class="bg-stone-50 rounded-xl p-4 text-center mb-4">
      <div class="text-2xl font-bold text-gray-900">${total}</div>
      <div class="text-xs text-gray-500 mt-1">${t('totalVisitsLabel')}</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">${t('trafficSourceLabel')}</h3>
        <div class="space-y-3">${sourceBarsHtml}</div>
      </div>
      <div class="space-y-5">
        <div>
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">${t('topCountriesLabel')}</h3>
          <div class="space-y-3">${geoBarsHtml(countryEntries)}</div>
        </div>
        <div>
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">${t('topCitiesLabel')}</h3>
          <div class="space-y-3">${geoBarsHtml(cityEntries)}</div>
        </div>
      </div>
    </div>
  `;
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
      loadSubtypesForCategory(e.target.value);
      generateSmartId();
    });
  }

  const categoryEditorForm = document.getElementById("category-editor-form");
  if (categoryEditorForm) {
    categoryEditorForm.addEventListener("submit", handleCategoryEditorSubmit);
  }
  const subtypeAddForm = document.getElementById("subtype-add-form");
  if (subtypeAddForm) {
    subtypeAddForm.addEventListener("submit", handleAddSubtype);
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

// ===================== 分类管理 =====================
// 内存缓存：分类列表、以及"每个分类下有哪些子类型标签"，避免每次用到都重新查数据库
let adminCategories = [];
let adminSubtypesByCategory = {};

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) {
    console.error("加载分类列表失败:", error);
    adminCategories = [];
  } else {
    adminCategories = data || [];
  }
  renderCategoryList();
  populateCategoryDropdown();
}

function renderCategoryList() {
  const tbody = document.getElementById("admin-category-list");
  if (!tbody) return;
  if (adminCategories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-500">${t('noCategoriesYet')}</td></tr>`;
    return;
  }
  tbody.innerHTML = adminCategories.map((cat, idx) => {
    const subtypeCount = (adminSubtypesByCategory[cat.id] || []).length;
    const catName = currentAdminLang === 'zh' ? cat.name_zh : cat.name_en;
    return `
      <tr class="border-b">
        <td class="p-3" data-label="${t('thCatOrder')}">
          <div class="flex items-center gap-1">
            <button onclick="moveCategoryOrder('${cat.id}', -1)" ${idx === 0 ? 'disabled' : ''} class="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs">▲</button>
            <button onclick="moveCategoryOrder('${cat.id}', 1)" ${idx === adminCategories.length - 1 ? 'disabled' : ''} class="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs">▼</button>
          </div>
        </td>
        <td class="p-3" data-label="${t('thCatName')}">
          <div class="font-medium text-gray-800">${cat.name_zh}</div>
          <div class="text-xs text-gray-400">${cat.name_en} · ${cat.id}</div>
        </td>
        <td class="p-3" data-label="${t('thCatPrefix')}"><code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">${cat.code_prefix}</code></td>
        <td class="p-3" data-label="${t('thCatType')}">${cat.has_variants ? `<span class="text-xs px-2 py-0.5 rounded bg-pink-100 text-pink-800">${t('catTypeVariants')}</span>` : `<span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">${t('catTypeFixed')}</span>`}</td>
        <td class="p-3" data-label="${t('thCatAccent')}">${cat.accent === 'amber' ? `<span class="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">${t('accentAmber')}</span>` : `<span class="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">${t('accentStone')}</span>`}</td>
        <td class="p-3" data-label="${t('thCatSubtypes')}">
          <button onclick="openSubtypeEditor('${cat.id}')" class="text-xs text-amber-800 hover:text-amber-900 underline">${subtypeCount > 0 ? t('manageTagsPrefix').replace('{n}', subtypeCount) : t('addTagsBtn')}</button>
        </td>
        <td class="p-3" data-label="${t('thCatStatus')}">
          <button onclick="toggleCategoryActive('${cat.id}', ${!cat.is_active})" class="text-xs px-2 py-0.5 rounded-full font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}">
            ${cat.is_active ? t('catActiveLabel') : t('catHiddenLabel')}
          </button>
        </td>
        <td class="p-3" data-label="${t('thCatAction')}">
          <div class="flex gap-2">
            <button onclick="openCategoryEditor('${cat.id}')" class="text-xs text-blue-700 hover:text-blue-900 font-medium">${t('catEditBtn')}</button>
            <button onclick="deleteCategory('${cat.id}')" class="text-xs text-red-600 hover:text-red-800 font-medium">${t('deleteBtn')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function populateCategoryDropdown() {
  const select = document.getElementById("prod-category");
  if (!select) return;
  const prevValue = select.value;
  select.innerHTML = adminCategories.map(cat => `<option value="${cat.id}">${cat.name_zh} (${cat.name_en})</option>`).join('');
  // 尽量保留用户之前选的分类（比如刚在"分类管理"里加完新分类回来，表单不应该跳回第一个）
  if (prevValue && adminCategories.some(c => c.id === prevValue)) {
    select.value = prevValue;
  }
  const isNails = select.value === "nails";
  const nailSection = document.getElementById("nail-options-section");
  const dimensionsSection = document.getElementById("dimensions-section");
  if (nailSection) nailSection.style.display = isNails ? "block" : "none";
  if (dimensionsSection) dimensionsSection.style.display = isNails ? "none" : "block";
  loadSubtypesForCategory(select.value);
}

async function loadSubtypesForCategory(categoryId) {
  const wrap = document.getElementById("prod-subtype-wrap");
  const select = document.getElementById("prod-subtype");
  if (!categoryId || !select) {
    if (wrap) wrap.classList.add("hidden");
    return;
  }
  let subtypes = adminSubtypesByCategory[categoryId];
  if (!subtypes) {
    const { data, error } = await supabaseClient
      .from("product_subtypes")
      .select("*")
      .eq("category_id", categoryId)
      .order("display_order", { ascending: true });
    subtypes = error ? [] : (data || []);
    adminSubtypesByCategory[categoryId] = subtypes;
  }
  if (subtypes.length === 0) {
    if (wrap) wrap.classList.add("hidden");
    select.innerHTML = `<option value="">${t('subtypeNotSetOption')}</option>`;
    return;
  }
  if (wrap) wrap.classList.remove("hidden");
  select.innerHTML = `<option value="">${t('subtypeNotSetOption')}</option>` + subtypes.map(s => `<option value="${s.id}">${s.name_zh} (${s.name_en})</option>`).join('');
}

function openCategoryEditor(categoryId) {
  const modal = document.getElementById("modal-category-editor");
  const title = document.getElementById("category-editor-title");
  const slugInput = document.getElementById("cat-slug");
  const errorEl = document.getElementById("category-editor-error");
  if (!modal) return;
  errorEl.classList.add("hidden");
  document.getElementById("category-editor-form").reset();

  if (categoryId) {
    const cat = adminCategories.find(c => c.id === categoryId);
    if (!cat) return;
    title.innerText = t('categoryEditorTitleEditPrefix') + (currentAdminLang === 'zh' ? cat.name_zh : cat.name_en);
    document.getElementById("cat-edit-id").value = cat.id;
    slugInput.value = cat.id;
    slugInput.disabled = true; // 分类标识创建后不允许再改，避免已有商品的 category_id 跟分类对不上
    document.getElementById("cat-name-zh").value = cat.name_zh;
    document.getElementById("cat-name-en").value = cat.name_en;
    document.getElementById("cat-subtitle-zh").value = cat.subtitle_zh || '';
    document.getElementById("cat-subtitle-en").value = cat.subtitle_en || '';
    document.getElementById("cat-code-prefix").value = cat.code_prefix;
    document.getElementById("cat-aspect").value = cat.card_aspect_ratio;
    document.getElementById("cat-accent").value = cat.accent;
  } else {
    title.innerText = t('categoryEditorTitleNew');
    document.getElementById("cat-edit-id").value = "";
    slugInput.disabled = false;
  }
  modal.classList.remove("hidden");
}

function closeCategoryEditor() {
  document.getElementById("modal-category-editor").classList.add("hidden");
}

async function handleCategoryEditorSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById("category-editor-error");
  errorEl.classList.add("hidden");

  const editingId = document.getElementById("cat-edit-id").value;
  const slug = document.getElementById("cat-slug").value.trim().toLowerCase();
  const payload = {
    id: slug,
    name_zh: document.getElementById("cat-name-zh").value.trim(),
    name_en: document.getElementById("cat-name-en").value.trim(),
    subtitle_zh: document.getElementById("cat-subtitle-zh").value.trim(),
    subtitle_en: document.getElementById("cat-subtitle-en").value.trim(),
    code_prefix: document.getElementById("cat-code-prefix").value.trim().toLowerCase(),
    card_aspect_ratio: document.getElementById("cat-aspect").value,
    accent: document.getElementById("cat-accent").value
  };

  if (!/^[a-z0-9_]+$/.test(slug)) {
    errorEl.innerText = t('catSlugInvalidError');
    errorEl.classList.remove("hidden");
    return;
  }

  try {
    if (editingId) {
      // 编辑：不改 id，只更新其它字段
      const { error } = await supabaseClient.from("categories").update(payload).eq("id", editingId);
      if (error) throw error;
      logAdminActivity('category_update', `id: ${editingId}`);
    } else {
      // 新增：display_order 排在最后面
      const maxOrder = adminCategories.reduce((max, c) => Math.max(max, c.display_order), -1);
      payload.display_order = maxOrder + 1;
      payload.is_active = true;
      payload.has_variants = false; // 新分类一律走"固定数量库存"模式，见表单上方的说明
      const { error } = await supabaseClient.from("categories").insert([payload]);
      if (error) throw error;
      logAdminActivity('category_create', `id: ${slug}`);
    }
    closeCategoryEditor();
    await loadCategories();
  } catch (err) {
    console.error("保存分类失败:", err);
    // 最常见的失败原因是 slug 已经被用过（主键冲突）
    const msg = (err.message && err.message.indexOf('duplicate key') !== -1)
      ? t('catDuplicateSlugError')
      : (t('catSaveFailedPrefix') + (err.message || 'Unknown error'));
    errorEl.innerText = msg;
    errorEl.classList.remove("hidden");
  }
}

async function toggleCategoryActive(categoryId, nextActive) {
  const { error } = await supabaseClient.from("categories").update({ is_active: nextActive }).eq("id", categoryId);
  if (error) {
    alert(t('operationFailed') + error.message);
    return;
  }
  logAdminActivity('category_toggle_active', `id: ${categoryId}, active: ${nextActive}`);
  await loadCategories();
}

async function moveCategoryOrder(categoryId, direction) {
  const idx = adminCategories.findIndex(c => c.id === categoryId);
  const swapIdx = idx + direction;
  if (idx === -1 || swapIdx < 0 || swapIdx >= adminCategories.length) return;
  const a = adminCategories[idx];
  const b = adminCategories[swapIdx];
  // 直接互换这两条记录的 display_order 数值即可实现"上移/下移"
  const { error } = await supabaseClient.from("categories").update({ display_order: b.display_order }).eq("id", a.id);
  if (!error) {
    await supabaseClient.from("categories").update({ display_order: a.display_order }).eq("id", b.id);
  }
  await loadCategories();
}

async function deleteCategory(categoryId) {
  const cat = adminCategories.find(c => c.id === categoryId);
  if (!cat) return;
  const catName = currentAdminLang === 'zh' ? cat.name_zh : cat.name_en;
  if (!confirm(t('deleteCategoryConfirmTemplate').replace('{name}', catName))) return;
  const { error } = await supabaseClient.from("categories").delete().eq("id", categoryId);
  if (error) {
    // 外键约束冲突（这个分类底下还有商品）会报这个错，给一个人话版本的提示
    const msg = (error.message && (error.message.indexOf('foreign key') !== -1 || error.message.indexOf('violates') !== -1))
      ? t('deleteCategoryFkError')
      : (t('deleteCategoryFailedPrefix') + error.message);
    alert(msg);
    return;
  }
  logAdminActivity('category_delete', `id: ${categoryId}`);
  delete adminSubtypesByCategory[categoryId];
  await loadCategories();
}

// ---- 子类型（筛选标签）管理 ----
let currentSubtypeEditingCategory = null;

async function openSubtypeEditor(categoryId) {
  const cat = adminCategories.find(c => c.id === categoryId);
  if (!cat) return;
  currentSubtypeEditingCategory = categoryId;
  document.getElementById("subtype-editor-category-name").innerText = currentAdminLang === 'zh' ? cat.name_zh : cat.name_en;
  document.getElementById("subtype-add-form").reset();
  await loadSubtypesForCategory(categoryId); // 确保缓存是最新的
  renderSubtypeList();
  document.getElementById("modal-subtype-editor").classList.remove("hidden");
}

function closeSubtypeEditor() {
  document.getElementById("modal-subtype-editor").classList.add("hidden");
  currentSubtypeEditingCategory = null;
}

function renderSubtypeList() {
  const container = document.getElementById("subtype-list");
  if (!container || !currentSubtypeEditingCategory) return;
  const subtypes = adminSubtypesByCategory[currentSubtypeEditingCategory] || [];
  if (subtypes.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 py-2">${t('subtypeNoneYet')}</p>`;
    return;
  }
  container.innerHTML = subtypes.map(s => `
    <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
      <span class="text-sm text-gray-700">${s.name_zh} <span class="text-xs text-gray-400">(${s.name_en})</span></span>
      <button onclick="deleteSubtype(${s.id})" class="text-xs text-red-600 hover:text-red-800">${t('deleteBtn')}</button>
    </div>
  `).join('');
}

async function handleAddSubtype(e) {
  e.preventDefault();
  if (!currentSubtypeEditingCategory) return;
  const nameZh = document.getElementById("subtype-name-zh").value.trim();
  const nameEn = document.getElementById("subtype-name-en").value.trim();
  if (!nameZh || !nameEn) return;

  const existing = adminSubtypesByCategory[currentSubtypeEditingCategory] || [];
  const maxOrder = existing.reduce((max, s) => Math.max(max, s.display_order), -1);

  const { error } = await supabaseClient.from("product_subtypes").insert([{
    category_id: currentSubtypeEditingCategory,
    name_zh: nameZh,
    name_en: nameEn,
    display_order: maxOrder + 1
  }]);
  if (error) {
    alert(error.message && error.message.indexOf('duplicate key') !== -1
      ? t('subtypeDuplicateError')
      : (t('subtypeAddFailedPrefix') + error.message));
    return;
  }
  logAdminActivity('subtype_create', `category: ${currentSubtypeEditingCategory}, name: ${nameEn}`);
  delete adminSubtypesByCategory[currentSubtypeEditingCategory]; // 清掉缓存，强制下面重新拉取最新列表
  document.getElementById("subtype-add-form").reset();
  await loadSubtypesForCategory(currentSubtypeEditingCategory);
  renderSubtypeList();
  renderCategoryList(); // 分类列表里"子类型标签"那一列的数量也要跟着刷新
}

async function deleteSubtype(subtypeId) {
  if (!confirm(t('subtypeDeleteConfirm'))) return;
  const { error } = await supabaseClient.from("product_subtypes").delete().eq("id", subtypeId);
  if (error) {
    alert(t('subtypeDeleteFailedPrefix') + error.message);
    return;
  }
  logAdminActivity('subtype_delete', `id: ${subtypeId}`);
  if (currentSubtypeEditingCategory) {
    delete adminSubtypesByCategory[currentSubtypeEditingCategory];
    await loadSubtypesForCategory(currentSubtypeEditingCategory);
    renderSubtypeList();
    renderCategoryList();
  }
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

    // 编码前缀不再写死，改成从"分类管理"里维护的 categories.code_prefix 取；
    // adminCategories 是 loadCategories() 加载好缓存在内存里的分类列表
    const catMeta = (adminCategories || []).find(c => c.id === category);
    const prefix = catMeta ? catMeta.code_prefix : "item";

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
    // 改成三个独立查询再在 JS 里手动按 product_id 拼起来，不用 Supabase 的嵌套 select
    // （之前写的 "*, nail_options (*), nail_variant_stock (*)"）。
    // 排查"刚新增的商品在后台规格选项显示未设置，但前台明明能正确显示"这个问题时发现，
    // 一次查询里同时嵌套两个子表，在部分情况下会导致其中一个子表的数据拿不回来
    // （前台 app.js 一直用的是分开查询再手动匹配，从没出过这个问题）——
    // 这里改成同样稳妥的写法，彻底避开这一类嵌套查询的坑。
    const [productsRes, nailOptionsRes, variantStockRes] = await Promise.all([
      supabaseClient.from("products").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("nail_options").select("*"),
      supabaseClient.from("nail_variant_stock").select("*")
    ]);

    if (productsRes.error) throw productsRes.error;
    if (nailOptionsRes.error) throw nailOptionsRes.error;
    if (variantStockRes.error) throw variantStockRes.error;

    const nailOptionsByProduct = {};
    (nailOptionsRes.data || []).forEach(o => { nailOptionsByProduct[o.product_id] = o; });

    const variantStockByProduct = {};
    (variantStockRes.data || []).forEach(v => {
      if (!variantStockByProduct[v.product_id]) variantStockByProduct[v.product_id] = [];
      variantStockByProduct[v.product_id].push(v);
    });

    lastLoadedProducts = (productsRes.data || []).map(p => ({
      ...p,
      nail_options: nailOptionsByProduct[p.id] ? [nailOptionsByProduct[p.id]] : [],
      nail_variant_stock: variantStockByProduct[p.id] || []
    }));

    updateProductCountLabel(lastLoadedProducts.length);
    renderProductRows(lastLoadedProducts);

  } catch (err) {
    console.error("加载商品失败:", err);
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">${t('loadProductsFailed')}</td></tr>`;
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
      tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-500">${emptyMsg}</td></tr>`;
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

      // 库存显示：穿戴甲按"甲型+尺寸"各组合的库存数量求和，其它品类直接用商品主表上的 stock_quantity。
      const isNails = item.category_id === 'nails';
      const variantStocks = item.nail_variant_stock || [];
      const totalStock = isNails
        ? variantStocks.reduce((sum, v) => sum + (v.quantity_on_hand || 0), 0)
        : (item.stock_quantity || 0);
      const stockNotSetUp = isNails && variantStocks.length === 0;
      const stockDisplay = stockNotSetUp ? t('noStockYet') : totalStock;
      const stockColorClass = stockNotSetUp ? 'text-gray-400' : (totalStock <= 0 ? 'text-red-500' : 'text-gray-800');

      const stockCell = `<div class="space-y-1">
             <div class="font-bold ${stockColorClass}">${stockDisplay}</div>
             <button onclick="openStockModal('${item.id}')" class="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-xs font-bold border border-emerald-300 shadow-sm">
               <i class="fa-solid fa-boxes-stacked"></i> ${t('manageStockBtn')}
             </button>
           </div>`;

      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3 cell-image">
            <img src="${item.spin_image || 'https://via.placeholder.com/60'}" class="w-12 h-12 object-cover rounded-lg border" alt="">
          </td>
          <td class="p-3 font-mono text-xs text-amber-900 font-bold" data-label="ID">${item.id}</td>
          <td class="p-3" data-label="${t('thCategory')}"><span class="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">${item.category_id}</span></td>
          <td class="p-3 font-medium text-gray-900" data-label="${t('thName')}">
            <div>${item.title_en || ''}</div>
            ${item.subtitle_en ? `<div class="text-[11px] text-gray-400 font-normal">${item.subtitle_en}</div>` : ''}
            <div class="mt-1 text-[11px]"><span class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">${item.tag_key || 'New'}</span></div>
          </td>
          <td class="p-3 text-xs text-gray-600" data-label="${t('thSpec')}">${specContent}</td>
          <td class="p-3 text-xs text-gray-600" data-label="${t('stockColLabel')}">${stockCell}</td>
          <td class="p-3 text-amber-800 font-bold" data-label="${t('thPrice')}">$${parseFloat(item.price).toFixed(2)}</td>
          <td class="p-3" data-label="${t('thAction')}">
            <div class="flex flex-col items-end sm:items-stretch gap-1">
              <button onclick="openEditProductModal('${item.id}', '${encodeURIComponent(item.title_en || '')}', '${encodeURIComponent(item.subtitle_en || '')}', ${parseFloat(item.price) || 0}, '${encodeURIComponent(item.tag_key || '')}', '${encodeURIComponent(item.spin_image || '')}')" class="block px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-bold border border-stone-300 shadow-sm">
                <i class="fa-solid fa-pen-to-square"></i> ${t('editInfoBtn')}
              </button>
              ${isNails ? `<button onclick="openTryonEditorModal('${item.id}')" class="block px-2.5 py-1 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded text-xs font-bold border border-pink-300 shadow-sm">
                <i class="fa-solid fa-hand-sparkles"></i> 试戴框图
              </button>` : ''}
              <button onclick="deleteProduct('${item.id}')" class="block text-red-600 hover:text-red-800 text-xs font-semibold">${t('deleteBtn')}</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("加载商品失败:", err);
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">${t('loadProductsFailed')}</td></tr>`;
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

    const subtypeSelect = document.getElementById("prod-subtype");
    const subtypeId = (subtypeSelect && subtypeSelect.value) ? parseInt(subtypeSelect.value, 10) : null;

    const { error: prodError } = await supabaseClient.from("products").insert([{
      id: id,
      category_id: categoryId,
      subtype_id: subtypeId,
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
      // 之前这里没检查 insert 的返回错误——如果这一步失败（比如网络抖动、约束冲突），
      // 商品主表那行已经建好了，但甲型/尺寸完全没有落库，后台会看起来"库存管理"
      // 打不开甲型/尺寸选项、库存也没法按组合设置，而且没有任何报错提示。
      // 现在补上错误检查，失败会直接抛出来，在 alert 里明确告诉你。
      const { error: nailOptError } = await supabaseClient.from("nail_options").insert([{
        product_id: id,
        shapes: selectedShapes,
        sizes: selectedSizes,
        size_chart: Object.keys(sizeChart).length > 0 ? sizeChart : null
      }]);
      if (nailOptError) throw new Error('Shapes/sizes failed to save: ' + nailOptError.message);
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

// ============================================================
// --- 库存管理弹窗：查看/设置库存数量、损耗调整、打印条码标签 ---
//
// 穿戴甲按"甲型+尺寸"每个组合各自记一个库存数量（共用同一个 SKU/条码，
// 不需要给每个物理单品单独编号）；亚克力制品/古董家具直接用商品主表上的
// stock_quantity 总数。SKU 的生成规则见 buildVariantSku()。
// ============================================================
let currentStockProdId = null;
let currentStockCategory = null;

const SHAPE_SKU_ABBR = { Almond: 'ALM', Coffin: 'COF', Stiletto: 'STI', Square: 'SQU' };

function buildVariantSku(productId, shape, size) {
  const shapeAbbr = SHAPE_SKU_ABBR[shape] || (shape || '').slice(0, 3).toUpperCase();
  return `${productId}-${shapeAbbr}-${size}`.toUpperCase();
}

// 常见不干胶标签纸规格（近似值，供快速选用）——行数/列数/单个标签尺寸是常见规格里
// 比较通用的参数，但不同厂家、不同批次的具体页边距可能有一点差异。如果打印出来
// 和实际标签纸对不上，用"自定义"精确填一遍：大多数标签纸的包装或衬纸上会直接
// 印着"多少列×多少行、每格多少 mm"，照着填就行，边距我们按"整页居中"自动算，
// 也可以在自定义里自己再微调。
const LABEL_SHEET_PRESETS = {
  a4_21: { nameKey: 'labelPresetA4_21', page: 'A4', cols: 3, rows: 7, labelW: 70, labelH: 42.3, gapX: 0, gapY: 0 },
  a4_24: { nameKey: 'labelPresetA4_24', page: 'A4', cols: 3, rows: 8, labelW: 70, labelH: 36, gapX: 0, gapY: 0 },
  a4_32: { nameKey: 'labelPresetA4_32', page: 'A4', cols: 4, rows: 8, labelW: 52.5, labelH: 29.7, gapX: 0, gapY: 0 },
  a4_65: { nameKey: 'labelPresetA4_65', page: 'A4', cols: 5, rows: 13, labelW: 38.1, labelH: 21.2, gapX: 2, gapY: 0 },
  letter_30: { nameKey: 'labelPresetLetter30', page: 'Letter', cols: 3, rows: 10, labelW: 66.68, labelH: 25.4, gapX: 3.18, gapY: 0 },
  custom: { nameKey: 'labelPresetCustom', page: 'A4', cols: 3, rows: 7, labelW: 40, labelH: 30, gapX: 2, gapY: 2 }
};

const PAGE_SIZE_MM = { A4: { w: 210, h: 297 }, Letter: { w: 215.9, h: 279.4 } };

// 通过商品 ID 从已加载的商品列表里查出完整数据，而不是把标题/规格等内容整段编码塞进
// onclick 属性字符串——之前那种写法一旦标题、标签之类的字段里出现单引号，
// 会直接把 onclick 里的参数列表拆断，导致后面的参数（包括甲型/尺寸）被错误截断成空值，
// 库存管理弹窗看起来"甲型尺寸都没设置"、下拉框也是空的。改成只传 ID 再查表，从根上避免这个问题。
function openStockModal(prodId) {
  const item = lastLoadedProducts.find(p => p.id === prodId);
  if (!item) {
    alert(t('operationFailed') + 'product not found in current list, please refresh and try again.');
    return;
  }

  currentStockProdId = prodId;
  currentStockCategory = item.category_id;
  const title = item.title_en || '';
  const nailOpt = (item.nail_options && item.nail_options.length > 0) ? item.nail_options[0] : {};
  const shapes = robustParseSpec(nailOpt.shapes);
  const sizes = robustParseSpec(nailOpt.sizes);
  const variantStocks = item.nail_variant_stock || [];
  const currentTotalQty = item.stock_quantity || 0;

  const isNails = currentStockCategory === 'nails';
  const stockLookup = {};
  variantStocks.forEach(v => { stockLookup[`${v.shape}__${v.size}`] = v.quantity_on_hand; });

  // 甲型/尺寸还没在"编辑规格"里设置过的话，库存没法按组合拆开填——这里给个明确的
  // 提示和直达按钮去设置，而不是显示一句"未设置规格"就没下文了。
  const stockGridHtml = isNails
    ? (shapes.length === 0 || sizes.length === 0
        ? `<div class="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
             <div>${t('noSpecSet')} — ${t('stockNeedsSpecHint')}</div>
             <button onclick="closeStockModal(); openEditSpecModal('${prodId}', '${encodeURIComponent(JSON.stringify(shapes))}', '${encodeURIComponent(JSON.stringify(sizes))}', '${encodeURIComponent(JSON.stringify(nailOpt.size_chart || {}))}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300">
               <i class="fa-solid fa-pen-to-square"></i> ${t('editSpecBtn')}
             </button>
           </div>`
        : `<div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead><tr class="text-gray-500">
                <th class="text-left py-1 pr-2"></th>
                ${sizes.map(sz => `<th class="text-center py-1 px-1 font-medium">${sz}</th>`).join('')}
              </tr></thead>
              <tbody>
                ${shapes.map(shape => `
                  <tr>
                    <td class="py-1 pr-2 font-bold text-gray-700">${shape}</td>
                    ${sizes.map(sz => `
                      <td class="py-1 px-1">
                        <input type="number" min="0" step="1" class="stock-qty-input w-16 border rounded px-1.5 py-1 text-xs text-center" data-shape="${shape}" data-size="${sz}" value="${stockLookup[`${shape}__${sz}`] ?? 0}">
                      </td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-gray-400 mt-2">${t('stockByVariantHint')}</p>`)
    : `<div>
        <label class="block text-xs font-medium text-gray-700 mb-1">${t('currentStockLabel')}</label>
        <input type="number" min="0" step="1" id="stock-simple-qty" class="w-32 border rounded-lg px-3 py-2 text-sm" value="${currentTotalQty || 0}">
      </div>`;

  const adjustTargetHtml = isNails
    ? `<div class="flex flex-wrap gap-2 items-end">
        <div>
          <label class="block text-[11px] text-gray-500 mb-1">${t('shapesCheckboxLabel')}</label>
          <select id="adjust-shape-select" class="border rounded-lg px-2 py-1.5 text-xs">
            ${shapes.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-[11px] text-gray-500 mb-1">${t('sizesCheckboxLabel')}</label>
          <select id="adjust-size-select" class="border rounded-lg px-2 py-1.5 text-xs">
            ${sizes.map(sz => `<option value="${sz}">${sz}</option>`).join('')}
          </select>
        </div>
      </div>`
    : '';

  const labelTargetHtml = isNails
    ? `<div>
        <label class="block text-[11px] text-gray-500 mb-1">${t('shapesCheckboxLabel')}</label>
        <select id="label-shape-select" class="border rounded-lg px-2 py-1.5 text-xs">
          ${shapes.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-[11px] text-gray-500 mb-1">${t('sizesCheckboxLabel')}</label>
        <select id="label-size-select" class="border rounded-lg px-2 py-1.5 text-xs">
          ${sizes.map(sz => `<option value="${sz}">${sz}</option>`).join('')}
        </select>
      </div>`
    : '';

  let modal = document.getElementById("modal-stock");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-stock";
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4";
    document.body.appendChild(modal);
  }
  modal.dataset.title = title;

  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b pb-3">
        <h3 class="text-base font-bold text-gray-900">${t('stockModalTitlePrefix')}<span class="text-amber-800 font-mono">${prodId}</span></h3>
        <button onclick="closeStockModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>

      <div>${stockGridHtml}</div>

      <div class="flex justify-end gap-3 pt-1">
        <button onclick="closeStockModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100">${t('cancelBtn')}</button>
        <button onclick="saveStock()" class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-sm">${t('saveStockBtn')}</button>
      </div>

      <div class="pt-4 border-t space-y-3">
        <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider">${t('adjustStockSectionTitle')}</h4>
        <p class="text-[11px] text-gray-400">${t('adjustStockHint')}</p>
        ${adjustTargetHtml}
        <div class="flex flex-wrap gap-2 items-end">
          <div>
            <label class="block text-[11px] text-gray-500 mb-1">${t('adjustQtyLabel')}</label>
            <input type="number" step="1" id="adjust-qty-input" class="w-24 border rounded-lg px-2 py-1.5 text-xs" placeholder="-1">
          </div>
          <div>
            <label class="block text-[11px] text-gray-500 mb-1">${t('adjustReasonLabel')}</label>
            <select id="adjust-reason-select" class="border rounded-lg px-2 py-1.5 text-xs">
              <option value="damage">${t('adjustReasonDamage')}</option>
              <option value="lost">${t('adjustReasonLost')}</option>
              <option value="correction">${t('adjustReasonCorrection')}</option>
              <option value="return">${t('adjustReasonReturn')}</option>
            </select>
          </div>
          <button onclick="applyStockAdjustment()" class="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-100 hover:bg-red-200 text-red-800 border border-red-300">${t('applyAdjustBtn')}</button>
        </div>
      </div>

      <div class="pt-4 border-t space-y-3">
        <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider">${t('labelPrintModalTitle')}</h4>

        <div class="flex flex-wrap gap-2 items-end">
          ${labelTargetHtml}
          <div>
            <label class="block text-[11px] text-gray-500 mb-1">${t('labelSheetPresetLabel')}</label>
            <select id="label-preset-select" onchange="onLabelPresetChange()" class="border rounded-lg px-2 py-1.5 text-xs">
              ${Object.keys(LABEL_SHEET_PRESETS).map(key => `<option value="${key}">${t(LABEL_SHEET_PRESETS[key].nameKey)}</option>`).join('')}
            </select>
          </div>
        </div>
        <p class="text-[11px] text-gray-400">${t('labelPresetApproxHint')}</p>

        <div id="label-custom-fields" class="hidden flex flex-wrap gap-2 items-end bg-gray-50 border rounded-lg p-2">
          <div>
            <label class="block text-[11px] text-gray-500 mb-1">${t('labelPageSizeLabel')}</label>
            <select id="label-custom-page" class="border rounded-lg px-2 py-1.5 text-xs">
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          <div><label class="block text-[11px] text-gray-500 mb-1">${t('labelColsLabel')}</label><input type="number" min="1" step="1" id="label-custom-cols" class="w-16 border rounded-lg px-2 py-1.5 text-xs" value="3"></div>
          <div><label class="block text-[11px] text-gray-500 mb-1">${t('labelRowsLabel')}</label><input type="number" min="1" step="1" id="label-custom-rows" class="w-16 border rounded-lg px-2 py-1.5 text-xs" value="7"></div>
          <div><label class="block text-[11px] text-gray-500 mb-1">${t('labelWidthLabel')}</label><input type="number" min="1" step="0.1" id="label-custom-w" class="w-20 border rounded-lg px-2 py-1.5 text-xs" value="40"></div>
          <div><label class="block text-[11px] text-gray-500 mb-1">${t('labelHeightLabel')}</label><input type="number" min="1" step="0.1" id="label-custom-h" class="w-20 border rounded-lg px-2 py-1.5 text-xs" value="30"></div>
          <div><label class="block text-[11px] text-gray-500 mb-1">${t('labelGapXLabel')}</label><input type="number" min="0" step="0.1" id="label-custom-gapx" class="w-16 border rounded-lg px-2 py-1.5 text-xs" value="2"></div>
          <div><label class="block text-[11px] text-gray-500 mb-1">${t('labelGapYLabel')}</label><input type="number" min="0" step="0.1" id="label-custom-gapy" class="w-16 border rounded-lg px-2 py-1.5 text-xs" value="2"></div>
        </div>

        <div class="flex flex-wrap gap-2 items-end">
          <div>
            <label class="block text-[11px] text-gray-500 mb-1">${t('labelStartPositionLabel')}</label>
            <input type="number" min="1" step="1" id="label-start-position-input" class="w-20 border rounded-lg px-2 py-1.5 text-xs" value="1">
          </div>
          <div>
            <label class="block text-[11px] text-gray-500 mb-1">${t('labelCopiesLabel')}</label>
            <input type="number" min="1" step="1" id="label-copies-input" class="w-20 border rounded-lg px-2 py-1.5 text-xs" value="1">
          </div>
          <button onclick="printStockLabel()" class="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300">
            <i class="fa-solid fa-qrcode"></i> ${t('printLabelBtn')}
          </button>
        </div>
        <p class="text-[11px] text-gray-400">${t('labelStartPositionHint')}</p>
      </div>
    </div>
  `;

  onLabelPresetChange();

  modal.classList.remove("hidden");
}

function closeStockModal() {
  document.getElementById("modal-stock")?.classList.add("hidden");
}

async function saveStock() {
  if (!currentStockProdId) return;
  try {
    if (currentStockCategory === 'nails') {
      const inputs = document.querySelectorAll(".stock-qty-input");
      const rows = Array.from(inputs).map(inp => ({
        product_id: currentStockProdId,
        shape: inp.dataset.shape,
        size: inp.dataset.size,
        sku: buildVariantSku(currentStockProdId, inp.dataset.shape, inp.dataset.size),
        quantity_on_hand: parseInt(inp.value, 10) || 0,
        updated_at: new Date().toISOString()
      }));
      if (rows.length > 0) {
        const { error } = await supabaseClient
          .from("nail_variant_stock")
          .upsert(rows, { onConflict: 'product_id,shape,size' });
        if (error) throw error;
      }
    } else {
      const qty = parseInt(document.getElementById("stock-simple-qty").value, 10) || 0;
      const { error } = await supabaseClient
        .from("products")
        .update({ stock_quantity: qty })
        .eq("id", currentStockProdId);
      if (error) throw error;
    }

    logAdminActivity('stock_update', `id: ${currentStockProdId}`);
    loadAdminActivityLog();
    alert(t('stockSaveSuccess'));
    closeStockModal();
    loadAdminProducts();

  } catch (err) {
    console.error("保存库存失败:", err);
    alert(t('updateFailed') + err.message);
  }
}

async function applyStockAdjustment() {
  if (!currentStockProdId) return;
  const qtyInput = document.getElementById("adjust-qty-input");
  const reasonSelect = document.getElementById("adjust-reason-select");
  const delta = parseInt(qtyInput ? qtyInput.value : '', 10);

  if (!delta) {
    alert(t('adjustNeedAmount'));
    return;
  }

  const reasonKey = reasonSelect ? reasonSelect.value : 'correction';
  const reasonLabelKeyMap = { damage: 'adjustReasonDamage', lost: 'adjustReasonLost', correction: 'adjustReasonCorrection', return: 'adjustReasonReturn' };
  const reasonLabel = t(reasonLabelKeyMap[reasonKey] || 'adjustReasonCorrection');

  try {
    if (currentStockCategory === 'nails') {
      const shape = document.getElementById("adjust-shape-select")?.value;
      const size = document.getElementById("adjust-size-select")?.value;

      const { data: existing } = await supabaseClient
        .from("nail_variant_stock")
        .select("id, quantity_on_hand")
        .eq("product_id", currentStockProdId)
        .eq("shape", shape)
        .eq("size", size)
        .maybeSingle();

      const newQty = Math.max((existing ? existing.quantity_on_hand : 0) + delta, 0);

      if (existing) {
        await supabaseClient.from("nail_variant_stock").update({ quantity_on_hand: newQty, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabaseClient.from("nail_variant_stock").insert([{ product_id: currentStockProdId, shape, size, sku: buildVariantSku(currentStockProdId, shape, size), quantity_on_hand: newQty }]);
      }

      logAdminActivity('stock_adjust', `id: ${currentStockProdId}, ${shape}/${size}, ${delta > 0 ? '+' : ''}${delta} (${reasonLabel})`);

    } else {
      const { data: prod } = await supabaseClient.from("products").select("stock_quantity").eq("id", currentStockProdId).maybeSingle();
      const newQty = Math.max((prod ? (prod.stock_quantity || 0) : 0) + delta, 0);
      await supabaseClient.from("products").update({ stock_quantity: newQty }).eq("id", currentStockProdId);

      logAdminActivity('stock_adjust', `id: ${currentStockProdId}, ${delta > 0 ? '+' : ''}${delta} (${reasonLabel})`);
    }

    loadAdminActivityLog();
    alert(t('adjustSuccess'));
    closeStockModal();
    loadAdminProducts();

  } catch (err) {
    console.error("库存调整失败:", err);
    alert(t('updateFailed') + err.message);
  }
}

// 切换"标签纸型号"下拉框时，只有选"自定义"才显示手动填写行列数/尺寸/间距的区域，
// 选预设型号时这些参数都是写死在 LABEL_SHEET_PRESETS 里的，不需要手填。
function onLabelPresetChange() {
  const select = document.getElementById("label-preset-select");
  const customFields = document.getElementById("label-custom-fields");
  if (!select || !customFields) return;
  customFields.classList.toggle("hidden", select.value !== "custom");
}

function getSelectedLabelConfig() {
  const select = document.getElementById("label-preset-select");
  const presetKey = select ? select.value : "custom";

  if (presetKey === "custom") {
    return {
      page: document.getElementById("label-custom-page")?.value || "A4",
      cols: Math.max(parseInt(document.getElementById("label-custom-cols")?.value, 10) || 1, 1),
      rows: Math.max(parseInt(document.getElementById("label-custom-rows")?.value, 10) || 1, 1),
      labelW: parseFloat(document.getElementById("label-custom-w")?.value) || 40,
      labelH: parseFloat(document.getElementById("label-custom-h")?.value) || 30,
      gapX: parseFloat(document.getElementById("label-custom-gapx")?.value) || 0,
      gapY: parseFloat(document.getElementById("label-custom-gapy")?.value) || 0
    };
  }
  return LABEL_SHEET_PRESETS[presetKey] || LABEL_SHEET_PRESETS.custom;
}

// 打印条码标签：用二维码（QR Code）承载 SKU，标签上同时印出可读文字方便肉眼核对。
// 版式是给"普通打印机 + 不干胶贴纸"用的：选一个常见标签纸型号（或自定义精确尺寸），
// 再填"从第几个位置开始打印"，前面已经用掉的标签格会留空跳过，从指定位置接着往后印，
// 用普通 A4/Letter 纸张打印。
function printStockLabel() {
  if (!currentStockProdId) return;
  const modal = document.getElementById("modal-stock");
  const title = modal ? (modal.dataset.title || '') : '';
  const copiesInput = document.getElementById("label-copies-input");
  const copies = Math.max(parseInt(copiesInput ? copiesInput.value : '1', 10) || 1, 1);
  const startPosInput = document.getElementById("label-start-position-input");
  const startPosition = Math.max(parseInt(startPosInput ? startPosInput.value : '1', 10) || 1, 1);
  const labelConfig = getSelectedLabelConfig();

  let sku, subLabel;
  if (currentStockCategory === 'nails') {
    const shape = document.getElementById("label-shape-select")?.value;
    const size = document.getElementById("label-size-select")?.value;
    sku = buildVariantSku(currentStockProdId, shape, size);
    subLabel = `${shape || ''} / ${size || ''}`;
  } else {
    sku = currentStockProdId.toUpperCase();
    subLabel = '';
  }

  if (startPosition > labelConfig.cols * labelConfig.rows) {
    alert(t('labelStartPositionTooLarge').replace('{n}', labelConfig.cols * labelConfig.rows));
    return;
  }

  openLabelPrintWindow(sku, title, subLabel, copies, startPosition, labelConfig);
}

function openLabelPrintWindow(sku, title, subLabel, copies, startPosition, cfg) {
  const printWin = window.open('', '_blank', 'width=1000,height=750');
  if (!printWin) {
    alert(t('operationFailed') + 'popup blocked — please allow pop-ups for this site.');
    return;
  }

  const pageDims = PAGE_SIZE_MM[cfg.page] || PAGE_SIZE_MM.A4;
  // 整页居中：用页面尺寸减去"格子总占用尺寸"算出上/左边距，尽量还原常见标签纸
  // 印刷厂通常采用的对称排版；如果和你手上实际那张标签纸有出入，改用"自定义"
  // 并参考标签纸包装/衬纸上印的规格微调。
  const gridWidth = cfg.cols * cfg.labelW + (cfg.cols - 1) * cfg.gapX;
  const gridHeight = cfg.rows * cfg.labelH + (cfg.rows - 1) * cfg.gapY;
  const marginLeft = Math.max((pageDims.w - gridWidth) / 2, 0);
  const marginTop = Math.max((pageDims.h - gridHeight) / 2, 0);

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${sku}</title>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; }
        .toolbar { padding: 12px 16px; background: #f5f5f5; }
        .toolbar span { font-size: 12px; color: #555; margin-right: 16px; }
        .toolbar button { margin-right: 8px; }
        .page { position: relative; width: ${pageDims.w}mm; height: ${pageDims.h}mm; background: #fff; page-break-after: always; }
        .cell { position: absolute; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden; border: 1px dashed #ddd; }
        .cell img { width: 55%; height: auto; }
        .cell.blank { border: 1px dashed #eee; }
        .label-sku { font-size: 8px; font-weight: bold; word-break: break-all; margin-top: 1px; }
        .label-title { font-size: 7px; color: #555; }
        @page { size: ${pageDims.w}mm ${pageDims.h}mm; margin: 0; }
        @media print {
          .toolbar { display: none; }
          .cell { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <span>${sku} · ${cfg.cols}×${cfg.rows} · ${cfg.labelW}×${cfg.labelH}mm</span>
        <button onclick="window.print()">Print</button>
      </div>
      <div id="pages"></div>
      <script>
        const sku = ${JSON.stringify(sku)};
        const title = ${JSON.stringify(title)};
        const subLabel = ${JSON.stringify(subLabel)};
        const copies = ${copies};
        const startPosition = ${startPosition};
        const cfg = ${JSON.stringify(cfg)};
        const marginLeft = ${marginLeft};
        const marginTop = ${marginTop};

        function render() {
          const perPage = cfg.cols * cfg.rows;
          const totalSlots = (startPosition - 1) + copies;
          const pagesNeeded = Math.ceil(totalSlots / perPage);
          const container = document.getElementById('pages');
          container.innerHTML = '';
          let slotIndex = 0;
          let printedCount = 0;

          for (let p = 0; p < pagesNeeded; p++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            for (let r = 0; r < cfg.rows; r++) {
              for (let c = 0; c < cfg.cols; c++) {
                const globalSlot = slotIndex;
                slotIndex++;
                const cell = document.createElement('div');
                cell.style.left = (marginLeft + c * (cfg.labelW + cfg.gapX)) + 'mm';
                cell.style.top = (marginTop + r * (cfg.labelH + cfg.gapY)) + 'mm';
                cell.style.width = cfg.labelW + 'mm';
                cell.style.height = cfg.labelH + 'mm';

                if (globalSlot >= startPosition - 1 && printedCount < copies) {
                  cell.className = 'cell';
                  const img = document.createElement('img');
                  cell.appendChild(img);
                  const skuEl = document.createElement('div');
                  skuEl.className = 'label-sku';
                  skuEl.innerText = sku;
                  cell.appendChild(skuEl);
                  if (title || subLabel) {
                    const infoEl = document.createElement('div');
                    infoEl.className = 'label-title';
                    infoEl.innerText = [title, subLabel].filter(Boolean).join(' \\u00b7 ');
                    cell.appendChild(infoEl);
                  }
                  QRCode.toDataURL(sku, { margin: 1, width: 200 }, function(err, url) {
                    if (!err) img.src = url;
                  });
                  printedCount++;
                } else {
                  // 已经用掉的格子（起始位置之前）留空跳过，不印任何内容
                  cell.className = 'cell blank';
                }
                pageDiv.appendChild(cell);
              }
            }
            container.appendChild(pageDiv);
          }
        }
        render();
      <\/script>
    </body>
    </html>
  `);
  printWin.document.close();
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
          <td class="p-3 font-mono text-xs text-amber-900 font-bold" data-label="${t('thOrderId')}">${o.id}</td>
          <td class="p-3 text-gray-900" data-label="${t('thCustomer')}">${o.first_name || ''} ${o.last_name || ''}</td>
          <td class="p-3 text-xs text-gray-600" data-label="${t('thContact')}">${o.email || ''}<br>${o.phone || ''}</td>
          <td class="p-3 text-xs text-gray-600" data-label="${t('thAddress')}">${addr}</td>
          <td class="p-3 text-amber-800 font-bold" data-label="${t('thAmount')}">$${parseFloat(o.total || 0).toFixed(2)}</td>
          <td class="p-3" data-label="${t('thStatus')}"><span class="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">${o.status || 'pending_test_payment'}</span></td>
          <td class="p-3 text-xs text-gray-500" data-label="${t('thOrderTime')}">${created}</td>
          <td class="p-3" data-label="${t('thAction')}">
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
    // tax_rate 数据库里存的是小数（0.08），输入框里按大家习惯显示成百分比数字（8）
    if (document.getElementById("cfg-tax-rate")) {
      const rate = (cfg.tax_rate === null || cfg.tax_rate === undefined) ? 0.08 : parseFloat(cfg.tax_rate);
      document.getElementById("cfg-tax-rate").value = (rate * 100).toString();
    }
    // 重新加载配置时，之前点的"移除视频"标记也要清掉，避免误删
    nailsVideoRemoved = false;
    if (document.getElementById("cfg-nails-video-preview-container")) {
      const container = document.getElementById("cfg-nails-video-preview-container");
      const player = document.getElementById("cfg-nails-video-preview");
      if (cfg.nails_video_url) {
        player.src = cfg.nails_video_url;
        container.classList.remove("hidden");
      } else {
        container.classList.add("hidden");
      }
    }
  } catch (err) {
    console.error("加载站点配置失败:", err);
  }
}

// 点"移除这个视频"：只是标记一下，真正删除要等点了"保存站点配置"才生效（跟其它字段保持一致的保存逻辑）
let nailsVideoRemoved = false;
function removeNailsVideo() {
  nailsVideoRemoved = true;
  const container = document.getElementById("cfg-nails-video-preview-container");
  if (container) container.classList.add("hidden");
  const fileInput = document.getElementById("cfg-nails-video-file");
  if (fileInput) fileInput.value = "";
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

    // 穿戴甲手工制作视频：跟 Hero 背景图同一套逻辑（先取云端现有值，避免没重新上传时被清空）
    let nailsVideoUrl = "";
    try {
      const { data: existingVideo } = await supabaseClient.from("site_settings").select("nails_video_url").eq("id", 1).single();
      if (existingVideo && existingVideo.nails_video_url) nailsVideoUrl = existingVideo.nails_video_url;
    } catch (e) { /* 表可能还没有数据，忽略 */ }

    const videoFileInput = document.getElementById("cfg-nails-video-file");
    if (videoFileInput && videoFileInput.files && videoFileInput.files[0]) {
      const videoFile = videoFileInput.files[0];
      // 视频不像图片那样可以在浏览器里简单压缩，这里只做一个体积提醒，真正压缩建议上传前用工具处理好
      if (videoFile.size > 50 * 1024 * 1024) {
        const proceed = confirm(t('nailsVideoTooLargeWarning'));
        if (!proceed) throw new Error(t('nailsVideoUploadCancelled'));
      }
      const videoExt = (videoFile.name.split('.').pop() || 'mp4').toLowerCase();
      const videoFileName = `nails_intro_${Date.now()}.${videoExt}`;

      const { error: videoUploadError } = await supabaseClient.storage
        .from("product-media")
        .upload(videoFileName, videoFile, { contentType: videoFile.type || 'video/mp4', upsert: true });

      if (videoUploadError) throw new Error(t('nailsVideoUploadFailed') + videoUploadError.message);

      const { data: videoPublicUrlData } = supabaseClient.storage.from("product-media").getPublicUrl(videoFileName);
      nailsVideoUrl = videoPublicUrlData.publicUrl;
    } else if (nailsVideoRemoved) {
      nailsVideoUrl = "";
    }

    // 输入框填的是百分比数字（比如 8），存进数据库前换算成小数（0.08）；
    // 留空或填了非法值时兜底用 8%，避免税率意外存成 NaN 或 0 导致漏收税
    const taxRateInput = document.getElementById("cfg-tax-rate") ? parseFloat(document.getElementById("cfg-tax-rate").value) : NaN;
    const taxRate = isNaN(taxRateInput) ? 0.08 : (taxRateInput / 100);

    const cfg = {
      id: 1,
      logo: document.getElementById("cfg-site-logo") ? document.getElementById("cfg-site-logo").value : "",
      banner: document.getElementById("cfg-banner-text") ? document.getElementById("cfg-banner-text").value : "",
      hero_title: document.getElementById("cfg-hero-title") ? document.getElementById("cfg-hero-title").value : "",
      hero_desc: document.getElementById("cfg-hero-desc") ? document.getElementById("cfg-hero-desc").value : "",
      hero_bg: heroBgUrl,
      tax_rate: taxRate,
      nails_video_url: nailsVideoUrl
    };

    // 写入 Supabase 的 site_settings 表（单行 id=1），所有访客都会看到这份配置
    const { error: saveError } = await supabaseClient.from("site_settings").upsert(cfg);
    if (saveError) throw saveError;

    logAdminActivity('settings_update', '');
    loadAdminActivityLog();

    nailsVideoRemoved = false;
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