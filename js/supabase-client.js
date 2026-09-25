// Supabase 客户端配置与全容错适配器

const SUPABASE_URL = 'https://hptnyyxpxvpyyhrrutds.supabase.co'; // 替换为你的 Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdG55eXhweHZweXlocnJ1dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDgwNjQsImV4cCI6MjEwNTc4NDA2NH0.-CUuIFQ6J7GzUbAkZfY8e5sqSEwBznhX1yQLcju6MVo';                 // 替换为你的 anon public Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 通用强力规范化解析函数
function normalizeArrayData(rawInput) {
  if (!rawInput) return [];
  if (Array.isArray(rawInput)) {
    return rawInput.map(x => String(x).trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  if (typeof rawInput === 'string') {
    let s = rawInput.trim();
    if (s.length === 0) return [];
    try {
      let parsed = JSON.parse(s);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) {
        return parsed.map(x => String(x).trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      }
    } catch (e) {}

    if (s.includes(',')) {
      return s.split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    return [s.replace(/^["']|["']$/g, '')];
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

    if (error) {
      console.error("Supabase 查询报错:", error);
      throw error;
    }

    console.log("Supabase 返回原始数据:", products);

    const result = { nails: [], merch: [], furniture: [] };

    (products || []).forEach(p => {
      const nailOpt = (p.nail_options && p.nail_options.length > 0) ? p.nail_options[0] : {};

      const parsedShapes = normalizeArrayData(nailOpt.shapes);
      const parsedSizes = normalizeArrayData(nailOpt.sizes);

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
        price: parseFloat(p.price || 0),
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
    console.error("fetchProductsFromSupabase 异常:", err);
    return null;
  }
}