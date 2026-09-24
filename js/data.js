// --- 多语言字典（可扩展更多语言） ---
const i18n = {
  zh: {
    siteTitle: "Aesthetic East",
    bannerAnnouncement: "✨ 穿戴甲与周边满 $50 包邮 | 古董家具提供 White-Glove 专线物流",
    heroBadge: "精选东方美学",
    heroTitle: "手工穿戴甲与传承古董家具",
    heroDesc: "将东方匠心与流行艺术融入现代生活方式。",
    shopCollection: "浏览系列",
    categoryNails: "手工穿戴甲",
    categoryMerch: "亚克力周边",
    categoryFurniture: "古董家具",
    sizeGuide: "尺码说明",
    addToCart: "+ 添加",
    view360: "360° 全景",
    zoom: "放大查看",
    cartTitle: "您的购物袋",
    cartEmpty: "购物袋空空如也",
    cartSubtotal: "小计",
    cartShipping: "运费",
    cartFree: "免费",
    cartTotal: "合计",
    checkoutBtn: "前往结算",
    close: "关闭"
  },
  en: {
    siteTitle: "Aesthetic East",
    bannerAnnouncement: "✨ Free US Shipping on Nails & Merch over $50 | White-Glove Freight for Antiques",
    heroBadge: "CURATED ASIAN AESTHETICS",
    heroTitle: "Handcrafted Press-Ons & Timeless Chinese Antiques",
    heroDesc: "Bringing oriental craftsmanship and pop art into modern American homes.",
    shopCollection: "Shop Collection",
    categoryNails: "Handcrafted Press-On Nails",
    categoryMerch: "Original Acrylic Merch",
    categoryFurniture: "Antique Chinese Furniture",
    sizeGuide: "Size Guide",
    addToCart: "+ Add",
    view360: "360°",
    zoom: "Zoom",
    cartTitle: "Your Cart",
    cartEmpty: "Your cart is empty",
    cartSubtotal: "Subtotal",
    cartShipping: "Shipping",
    cartFree: "Free",
    cartTotal: "Total",
    checkoutBtn: "Proceed to Checkout",
    close: "Close"
  }
};

// --- 商品数据集（已匹配你 images/ 文件夹的真实文件名） ---
const productsData = {
  nails: [
    {
      id: 'nail1',
      tagKey: 'Sweet',
      tagClass: 'bg-rose-500 text-white',
      title: 'Sweet Strawberry Pearl',
      subtitle: 'Pearl Accents · Hand Crafted',
      price: 22.00,
      images: ['images/image.png', 'images/strawberry.jpg'],
      shapes: ['Almond', 'Coffin'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: 'nail2',
      tagKey: 'Y2K Goth',
      tagClass: 'bg-purple-600 text-white',
      title: 'Y2K Celestial Bow & Star',
      subtitle: '3D Chrome · Silver Charms',
      price: 24.50,
      images: ['images/image_1.png', 'images/gothic.jpg'],
      shapes: ['Stiletto', 'Coffin'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: 'nail3',
      tagKey: 'Oriental',
      tagClass: 'bg-amber-700 text-white',
      title: 'Gold Foil Ink Wash Set',
      subtitle: 'Hand-painted Gradient · Gold Accent',
      price: 26.00,
      images: ['images/image_2.png', 'images/image_3.png'],
      shapes: ['Almond', 'Square'],
      sizes: ['XS', 'S', 'M', 'L']
    }
  ],
  merch: [
    {
      id: 'merch1',
      tagKey: 'Double-Sided Print',
      tagClass: 'bg-blue-600 text-white',
      title: 'Custom Anime Acrylic Standee with Base',
      subtitle: 'High-clarity laser cut acrylic with protective film.',
      price: 14.50,
      images: ['images/image_3.png']
    }
  ],
  furniture: [
    {
      id: 'ant1',
      tagKey: 'Late Qing Dynasty',
      tagClass: 'bg-amber-900 text-amber-100',
      title: '19th Century Antique Elm Console Table & Cabinet',
      subtitle: 'Sourced from Northern China with authentic natural patina, brass fittings.',
      price: 1850.00,
      images: ['images/gothic.jpg']
    }
  ]
};