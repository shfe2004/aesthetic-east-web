const i18n = {
  en: {
    siteTitle: "Aesthetic East",
    bannerAnnouncement: "✨ Free US Shipping on Nails & Merch over $50 | White-Glove Freight for Antiques",
    heroBadge: "CURATED ASIAN AESTHETICS",
    heroTitle: "Handcrafted Press-Ons & Timeless Chinese Antiques",
    heroDesc: "Bringing oriental craftsmanship and pop art into modern American homes.",
    categoryNails: "Handcrafted Press-On Nails",
    categoryMerch: "Original Acrylic Merch",
    categoryFurniture: "Antique Chinese Furniture",
    zoomHint: "Scroll wheel to zoom · Double click to reset · Drag to move",
    spinHint: "Drag horizontally to spin 360°",
    sizeGuide: "Size Guide",
    cartTitle: "Your Cart",
    cartShipping: "Shipping",
    cartFree: "Free",
    cartTotal: "Total",
    checkoutBtn: "Proceed to Checkout",
    cartEmpty: "Your cart is empty."
  },
  zh: {
    siteTitle: "东方美学 Aesthetic East",
    bannerAnnouncement: "✨ 穿戴甲与周边满 $50 包邮 | 古董家具提供白手套专线专送",
    heroBadge: "东方美学甄选",
    heroTitle: "手工穿戴甲 & 传世中国古董家具",
    heroDesc: "将东方匠心与流行艺术融入现代美国家庭。",
    categoryNails: "手工高定穿戴甲",
    categoryMerch: "原创双面亚克力周边",
    categoryFurniture: "明清传世古董家具",
    zoomHint: "滚轮缩放 · 双击重置 · 拖拽移动",
    spinHint: "左右拖拽可 360° 旋转查看",
    sizeGuide: "尺码指南",
    cartTitle: "购物车",
    cartShipping: "运费",
    cartFree: "包邮",
    cartTotal: "合计",
    checkoutBtn: "前往结算",
    cartEmpty: "购物车空空如也。"
  }
};

window.productsData = {
  nails: [
    {
      id: "nail1",
      title: "Sweet Strawberry Pearl",
      subtitle: "Pearl Accents · Hand Crafted",
      price: 22.00,
      tagKey: "Sweet",
      tagClass: "bg-rose-500 text-white",
      images: ["https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800"],
      spinImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800",
      shapes: ["Almond", "Coffin"],
      sizes: ["XS", "S", "M", "L"]
    },
    {
      id: "nail2",
      title: "Y2K Celestial Bow & Star",
      subtitle: "3D Chrome · Silver Charms",
      price: 24.50,
      tagKey: "Y2K Goth",
      tagClass: "bg-purple-600 text-white",
      images: ["https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800"],
      spinImage: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800",
      shapes: ["Stiletto", "Coffin"],
      sizes: ["XS", "S", "M", "L"]
    }
  ],
  merch: [
    {
      id: "merch1",
      title: "Custom Anime Acrylic Standee",
      subtitle: "High-clarity laser cut acrylic with protective film.",
      price: 14.50,
      tagKey: "Double-Sided Print",
      tagClass: "bg-blue-600 text-white",
      images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"],
      spinImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
    }
  ],
  furniture: [
    {
      id: "ant1",
      title: "19th Century Antique Elm Console Table",
      subtitle: "Sourced from Northern China with authentic natural patina.",
      price: 1850.00,
      tagKey: "Late Qing Dynasty",
      tagClass: "bg-amber-900 text-amber-100",
      images: ["https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800"],
      spinImage: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800"
    }
  ]
};