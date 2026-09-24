const i18n = {
  zh: {
    siteTitle: "Aesthetic East",
    bannerAnnouncement: "✨ 穿戴甲与周边满 $50 包邮 | 古董家具提供 White-Glove 专线物流",
    heroBadge: "精选东方美学",
    heroTitle: "手工穿戴甲与传承古董家具",
    heroDesc: "将东方匠心与流行艺术融入现代生活方式。",
    categoryNails: "手工穿戴甲",
    categoryMerch: "亚克力周边",
    categoryFurniture: "古董家具",
    sizeGuide: "尺码说明",
    cartTitle: "您的购物袋",
    cartEmpty: "购物袋空空如也",
    cartShipping: "运费",
    cartFree: "免费",
    cartTotal: "合计",
    checkoutBtn: "前往结算",
    zoomHint: "滚轮缩放 · 双击重置 · 拖拽移动",
    spinHint: "左右拖拽控制图片 360° 旋转"
  },
  en: {
    siteTitle: "Aesthetic East",
    bannerAnnouncement: "✨ Free US Shipping on Nails & Merch over $50 | White-Glove Freight for Antiques",
    heroBadge: "CURATED ASIAN AESTHETICS",
    heroTitle: "Handcrafted Press-Ons & Timeless Chinese Antiques",
    heroDesc: "Bringing oriental craftsmanship and pop art into modern American homes.",
    categoryNails: "Handcrafted Press-On Nails",
    categoryMerch: "Original Acrylic Merch",
    categoryFurniture: "Antique Chinese Furniture",
    sizeGuide: "Size Guide",
    cartTitle: "Your Cart",
    cartEmpty: "Your cart is empty",
    cartShipping: "Shipping",
    cartFree: "Free",
    cartTotal: "Total",
    checkoutBtn: "Proceed to Checkout",
    zoomHint: "Scroll wheel to zoom · Double click to reset · Drag to move",
    spinHint: "Drag horizontally to spin 360°"
  }
};

const productsData = {
  nails: [
    {
      id: 'nail1',
      tagKey: 'Sweet',
      tagClass: 'bg-rose-500 text-white',
      title: 'Sweet Strawberry Pearl',
      subtitle: 'Pearl Accents · Hand Crafted',
      price: 22.00,
      images: ['images/image.png', 'images/strawberry.jpg', 'images/image_1.png', 'images/image_2.png'],
      // 专用于 360 度展示的同一张图片（若无多角度序列图，使用单图 3D 模拟）
      spinImage: 'images/image.png',
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
      images: ['images/image_1.png', 'images/gothic.jpg', 'images/image.png'],
      spinImage: 'images/image_1.png',
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
      images: ['images/image_2.png', 'images/image_3.png', 'images/image.png'],
      spinImage: 'images/image_2.png',
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
      images: ['images/image_3.png', 'images/image_2.png'],
      spinImage: 'images/image_3.png'
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
      images: ['images/gothic.jpg', 'images/image_1.png'],
      spinImage: 'images/gothic.jpg'
    }
  ]
};