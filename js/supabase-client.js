// Supabase 客户端与健壮数据拉取适配器

const SUPABASE_URL = 'https://hptnyyxpxvpyyhrrutds.supabase.co'; // 替换为你的 Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG55eXhweHZweXlocnJ1dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDgwNjQsImV4cCI6MjEwNTc4NDA2NH0.-CUuIFQ6J7GzUbAkZfY8e5sqSEwBznhX1yQLcju6MVo';                 // 替换为你的 anon public Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 核心：深度容错解析函数（无论数据库传回何种嵌套格式，精准解析出真实数组）
function robustParseSpec(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;

  if (typeof input === 'string') {
    let str = input.trim();
    // 循环剥离可能存在的双重转义引号与 JSON 字符串
    for (let i = 0; i < 3; i++) {
      if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('"') && str.endsWith('"'))) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === 'string') str = parsed.trim();
        } catch (e) {
          break;
        }
      }
    }
    // 逗号分隔兜底
    if (str.includes(',')) {
      return str.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    if (str.length > 0 && !str.startsWith('[')) {
      return [str.replace(/^["']|["']$/g, '')];
    }
  }
  return [];
}

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

      // 使用深度容错解析引擎，精准提取 shapes 和 sizes
      const shapes = robustParseSpec(nailOpt.shapes);
      const sizes = robustParseSpec(nailOpt.sizes);

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
        shapes: shapes,
        sizes: sizes
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
    console.error("Supabase 读取失败:", err);
    return null;
  }
}