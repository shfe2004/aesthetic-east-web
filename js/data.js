// --- 多语言字典 ---
const i18n = {
  zh: {
    siteTitle: "Aesthetic East | 东方美学手作",
    navNails: "手工穿戴甲",
    navMerch: "亚克力周边",
    navFurniture: "古董家具",
    cartTitle: "您的购物袋",
    cartEmpty: "购物袋空空如也~",
    checkoutBtn: "去结算",
    total: "合计:",
    tagSweet: "甜酷风",
    tagGoth: "暗黑系",
    uvTag: "UV双面印",
    qingTag: "清代老料",
    nail1_title: "草莓法式晶采甲片",
    nail1_desc: "精美草莓手绘，搭配优雅法式边，彰显甜美气质。",
    nail2_title: "Y2K暗黑星星款",
    nail2_desc: "个性暗黑风配以精致星星点缀，酷感十足。",
    nail3_title: "金箔渐变水墨甲",
    nail3_desc: "东方水墨意境，融合金箔渐变工艺。",
    merch1_title: "山水水墨亚克力立牌",
    merch1_desc: "高透光亚克力，双面精细印刷。",
    merch2_title: "草莓印花挂件",
    merch2_desc: "可爱草莓图案，轻巧耐用。",
    ant1_title: "清代黑漆描金茶几",
    ant1_desc: "传统老木作工艺，保存完好，历史韵味浓厚。",
    sizeGuideTitle: "穿戴甲尺码选择指南",
    close: "关闭"
  },
  en: {
    siteTitle: "Aesthetic East | Handcrafted Studio",
    navNails: "Press-on Nails",
    navMerch: "Acrylic Merch",
    navFurniture: "Antique Furniture",
    cartTitle: "Your Shopping Bag",
    cartEmpty: "Your bag is empty.",
    checkoutBtn: "Checkout",
    total: "Total:",
    tagSweet: "Sweet & Cool",
    tagGoth: "Gothic",
    uvTag: "UV Print",
    qingTag: "Qing Dynasty",
    nail1_title: "Strawberry French Press-On",
    nail1_desc: "Hand-painted strawberry design with elegant french tip.",
    nail2_title: "Y2K Gothic Star Set",
    nail2_desc: "Edgy dark style embedded with star accents.",
    nail3_title: "Gold Foil Ink Wash Set",
    nail3_desc: "Oriental ink painting vibe with gold foil gradient.",
    merch1_title: "Ink Landscape Acrylic Stand",
    merch1_desc: "High clarity acrylic with double-sided UV printing.",
    merch2_title: "Strawberry Print Charm",
    merch2_desc: "Cute strawberry pattern, lightweight and durable.",
    ant1_title: "Qing Dynasty Lacquer Tea Table",
    ant1_desc: "Traditional joinery, well-preserved antique accent.",
    sizeGuideTitle: "Press-on Nails Size Guide",
    close: "Close"
  }
};

// --- 商品数据集 ---
const productsData = {
  nails: [
    {
      id: 'nail1',
      tagKey: 'tagSweet',
      tagClass: 'bg-rose-500',
      titleKey: 'nail1_title',
      descKey: 'nail1_desc',
      price: 22.00,
      images: ['images/image.png', 'images/strawberry.jpg'],
      shapes: ['Almond', 'Coffin'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: 'nail2',
      tagKey: 'tagGoth',
      tagClass: 'bg-purple-600',
      titleKey: 'nail2_title',
      descKey: 'nail2_desc',
      price: 24.50,
      images: ['images/image_1.png', 'images/gothic.jpg'],
      shapes: ['Stiletto', 'Coffin'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: 'nail3',
      tagKey: 'tagSweet',
      tagClass: 'bg-amber-600',
      titleKey: 'nail3_title',
      descKey: 'nail3_desc',
      price: 26.00,
      images: ['images/image_2.png', 'images/image_3.png'],
      shapes: ['Almond', 'Square'],
      sizes: ['XS', 'S', 'M', 'L']
    }
  ],
  merch: [
    {
      id: 'merch1',
      tagKey: 'uvTag',
      titleKey: 'merch1_title',
      descKey: 'merch1_desc',
      price: 14.50,
      image: 'images/image_3.png'
    },
    {
      id: 'merch2',
      tagKey: 'uvTag',
      titleKey: 'merch2_title',
      descKey: 'merch2_desc',
      price: 18.00,
      image: 'images/image.png'
    }
  ],
  furniture: [
    {
      id: 'ant1',
      tagKey: 'qingTag',
      titleKey: 'ant1_title',
      descKey: 'ant1_desc',
      price: 1850.00,
      image: 'images/gothic.jpg'
    }
  ]
};