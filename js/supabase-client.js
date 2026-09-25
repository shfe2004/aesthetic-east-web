
// Supabase 客户端配置与数据拉取适配器

// 请根据你的 Supabase 项目实际参数进行初始化
// 填入你在 Supabase 控制台获取到的 URL 和 Key
const SUPABASE_URL = 'https://hptnyyxpxvpyyhrrutds.supabase.co'; // 替换为你的 Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG55eXhweHZweXlocnJ1dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDgwNjQsImV4cCI6MjEwNTc4NDA2NH0.-CUuIFQ6J7GzUbAkZfY8e5sqSEwBznhX1yQLcju6MVo';                 // 替换为你的 anon public Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 从 Supabase 动态读取商品并正确解析 JSON 规格数组
async function fetchProductsFromSupabase() {
  try {
    const { data: products, error } = await supabaseClient
      .from('products')
      .select(`
        *,
        nail_options (*),
        product_images (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = { nails: [], merch: [], furniture: [] };

    products.forEach(p => {
      const nailOpt = (p.nail_options && p.nail_options.length > 0) ? p.nail_options[0] : {};

      // 精准安全解析 shapes 与 sizes，无强制改写
      let parsedShapes = [];
      let parsedSizes = [];

      if (nailOpt.shapes) {
        parsedShapes = typeof nailOpt.shapes === 'string' ? JSON.parse(nailOpt.shapes) : nailOpt.shapes;
      }
      if (nailOpt.sizes) {
        parsedSizes = typeof nailOpt.sizes === 'string' ? JSON.parse(nailOpt.sizes) : nailOpt.sizes;
      }

      // 多图提取与排序
      let imgList = [];
      if (p.product_images && p.product_images.length > 0) {
        imgList = p.product_images.sort((a, b) => a.display_order - b.display_order).map(i => i.image_url);
      } else if (p.spin_image) {
        imgList = [p.spin_image];
      }

      const itemData = {
        id: p.id,
        title: p.title_en,
        subtitle: p.subtitle_en || '',
        price: parseFloat(p.price),
        tagKey: p.tag_key || 'New',
        tagClass: p.tag_class || 'bg-stone-900 text-white',
        images: imgList,
        spinImage: p.spin_image,
        shapes: parsedShapes,
        sizes: parsedSizes
      };

      if (p.category_id === 'nails') {
        result.nails.push(itemData);
      } else if (p.category_id === 'merch') {
        result.merch.push(itemData);
      } else if (p.category_id === 'furniture') {
        result.furniture.push(itemData);
      }
    });

    return result;

  } catch (err) {
    console.error("Supabase 数据读取失败:", err);
    return null;
  }
}