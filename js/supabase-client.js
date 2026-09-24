// 填入你在 Supabase 控制台获取到的 URL 和 Key
const SUPABASE_URL = 'https://hptnyyxpxvpyyhrrutds.supabase.co'; // 替换为你的 Project URL
const SUPABASE_ANON_KEY = 'sb_publishable_9t4ON7BTWAu7-xEsPsP5AA_-TXo2ih1';                 // 替换为你的 anon public Key

// 初始化 Supabase 客户端
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 从 Supabase 数据库拉取全部商品信息并格式化
 */
async function fetchProductsFromSupabase() {
  try {
    const { data: products, error } = await supabaseClient
      .from('products')
      .select(`
        id,
        category_id,
        title_en,
        subtitle_en,
        price,
        tag_key,
        tag_class,
        spin_image,
        product_images ( image_url, display_order ),
        nail_options ( shapes, sizes )
      `);

    if (error) {
      console.error('Supabase 读取数据错误:', error.message);
      return null;
    }

    // 转换为原本 app.js 所需的数据结构
    const formattedData = { nails: [], merch: [], furniture: [] };

    products.forEach(item => {
      const formattedItem = {
        id: item.id,
        tagKey: item.tag_key,
        tagClass: item.tag_class,
        title: item.title_en,
        subtitle: item.subtitle_en,
        price: parseFloat(item.price),
        spinImage: item.spin_image,
        images: item.product_images && item.product_images.length > 0 
          ? item.product_images.sort((a,b) => a.display_order - b.display_order).map(i => i.image_url) 
          : [item.spin_image],
        shapes: item.nail_options?.shapes || [],
        sizes: item.nail_options?.sizes || []
      };

      if (formattedData[item.category_id]) {
        formattedData[item.category_id].push(formattedItem);
      }
    });

    return formattedData;
  } catch (err) {
    console.error('网络或服务异常:', err.message);
    return null;
  }
}