// Supabase 客户端配置与通用解包解析器

const SUPABASE_URL = 'https://hptnyyxpxvpyyhrrutds.supabase.co'; // 替换为你的 Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG55eXhweHZweXlocnJ1dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDgwNjQsImV4cCI6MjEwNTc4NDA2NH0.-CUuIFQ6J7GzUbAkZfY8e5sqSEwBznhX1yQLcju6MVo';                 // 替换为你的 anon public Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 万能强力解包函数（解决一切字符串/JSON/数组嵌套问题）
function parseUniversalSpec(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(item => typeof item === 'string' ? item.replace(/^["']|["']$/g, '') : item);
  }
  if (typeof raw === 'string') {
    let s = raw.trim();
    try {
      let parsed = JSON.parse(s);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); // 双重转义二次解包
      if (Array.isArray(parsed)) return parsed.map(item => String(item).replace(/^["']|["']$/g, ''));
    } catch(e) {}

    if (s.includes(',')) {
      return s.split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    if (s.length > 0) return [s.replace(/^["']|["']$/g, '')];
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

      const shapes = parseUniversalSpec(nailOpt.shapes);
      const sizes = parseUniversalSpec(nailOpt.sizes);

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
    console.error("Supabase 数据读取失败:", err);
    return null;
  }
}