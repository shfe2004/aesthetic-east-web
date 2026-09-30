// /api/product-feed.js
// Vercel Serverless Function —— 生成一份 Meta（Instagram/Facebook Shop/Marketplace 共用同一套后台
// Commerce Manager）能识别的商品目录订阅（RSS 2.0 + Google/Meta 购物专用字段）。
//
// 用法：部署后，去 Meta Commerce Manager -> 数据来源 -> 排定时间的订阅（Scheduled Feed），
// 填入这个函数的完整网址（例如 https://你的网站.vercel.app/api/product-feed），
// 设置好抓取频率（比如每天一次），以后你在自己后台增删改商品，Meta 会在下一次抓取时自动跟上，
// 不需要再去 IG/FB 后台手动改。
//
// 数据来源都是本来就公开可读的表（products / nail_options / product_images /
// nail_variant_availability——最后这个只暴露"有没有货"的布尔值，不会把具体库存数字泄露出去），
// 所以这里用 Supabase 的 URL + anon key 直接读取，不涉及任何需要保密的密钥。
//
// 部署前需要在 Vercel 项目的 Settings -> Environment Variables 里添加：
//   SUPABASE_URL        = 你的 Supabase 项目地址（跟 js/supabase-client.js 里那个一样）
//   SUPABASE_ANON_KEY    = 你的 Supabase anon public key（跟 js/supabase-client.js 里那个一样）
//   SITE_URL             = 你网站的完整地址，例如 https://你的网站.vercel.app（不要带最后的斜杠）
// 这几个都不是敏感信息（anon key 本来就写在前台代码里谁都能看到），加完照常需要 Redeploy 一次。

function escapeXml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(str) {
  return `<![CDATA[${String(str == null ? '' : str).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

async function supabaseSelect(baseUrl, apiKey, table, query) {
  const url = `${baseUrl}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (!res.ok) {
    throw new Error(`查询 ${table} 失败：HTTP ${res.status}`);
  }
  return res.json();
}

// SHAPE 缩写复用后台打印标签用的那份，这里只是给 item id 拼接用，跟库存那边的 SKU 逻辑没有强绑定关系
const SHAPE_ABBR = { Almond: 'ALM', Coffin: 'COF', Stiletto: 'STI', Square: 'SQU' };

function buildFeedItemId(productId, shape, size) {
  const shapeAbbr = SHAPE_ABBR[shape] || (shape || '').slice(0, 3).toUpperCase();
  return `${productId}-${shapeAbbr}-${size}`.toUpperCase();
}

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');

  if (!supabaseUrl || !supabaseKey || !siteUrl) {
    res.status(500).send('服务器还没配置 SUPABASE_URL / SUPABASE_ANON_KEY / SITE_URL，请先在 Vercel 环境变量里添加并重新部署。');
    return;
  }

  try {
    const [products, nailOptions, productImages, nailAvailability] = await Promise.all([
      supabaseSelect(supabaseUrl, supabaseKey, 'products', 'select=*'),
      supabaseSelect(supabaseUrl, supabaseKey, 'nail_options', 'select=*'),
      supabaseSelect(supabaseUrl, supabaseKey, 'product_images', 'select=*&order=display_order.asc'),
      // 这个视图查不到就当作"没有配置库存"处理，不阻断整个 feed 生成
      supabaseSelect(supabaseUrl, supabaseKey, 'nail_variant_availability', 'select=*').catch(() => [])
    ]);

    const items = [];

    products.forEach(p => {
      const title = p.title_en || p.title || '';
      const description = p.subtitle_en || p.subtitle || title;
      const price = parseFloat(p.price || 0).toFixed(2);
      const imgs = productImages
        .filter(img => img.product_id === p.id)
        .map(img => img.image_url);
      const mainImage = imgs[0] || p.spin_image || '';
      const extraImages = imgs.slice(1, 11); // Meta 最多接受10张附加图片

      if (p.category_id === 'nails') {
        const opt = nailOptions.find(o => o.product_id === p.id);
        let shapes = [];
        let sizes = [];
        try { shapes = Array.isArray(opt?.shapes) ? opt.shapes : JSON.parse(opt?.shapes || '[]'); } catch (e) { shapes = []; }
        try { sizes = Array.isArray(opt?.sizes) ? opt.sizes : JSON.parse(opt?.sizes || '[]'); } catch (e) { sizes = []; }

        if (shapes.length === 0 || sizes.length === 0) {
          // 没配置规格的穿戴甲商品，当成单个商品处理，不做变体拆分
          items.push({
            id: p.id,
            groupId: null,
            title,
            description,
            price,
            image: mainImage,
            extraImages,
            available: true // 没配置库存视为"未设置"，沿用不阻拦的老规矩
          });
          return;
        }

        shapes.forEach(shape => {
          sizes.forEach(size => {
            const row = nailAvailability.find(a => a.product_id === p.id && a.shape === shape && a.size === size);
            // 找不到这一行记录 = 后台还没为这个组合设置过库存，按"未配置库存"不阻拦上架
            const available = row ? !!row.in_stock : true;
            items.push({
              id: buildFeedItemId(p.id, shape, size),
              groupId: p.id,
              title: `${title} - ${shape} / ${size}`,
              description,
              price,
              image: mainImage,
              extraImages,
              available,
              variantShape: shape,
              variantSize: size
            });
          });
        });
      } else {
        items.push({
          id: p.id,
          groupId: null,
          title,
          description,
          price,
          image: mainImage,
          extraImages,
          available: (parseInt(p.stock_quantity || 0, 10) > 0)
        });
      }
    });

    const itemsXml = items.map(item => {
      const link = `${siteUrl}/?product=${encodeURIComponent(item.groupId || item.id)}`;
      const extraImagesXml = item.extraImages.map(img => `      <g:additional_image_link>${cdata(img)}</g:additional_image_link>`).join('\n');
      const variantXml = item.variantShape
        ? `      <g:item_group_id>${escapeXml(item.groupId)}</g:item_group_id>\n      <g:pattern>${cdata(item.variantShape)}</g:pattern>\n      <g:size>${cdata(item.variantSize)}</g:size>\n`
        : '';
      return `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <title>${cdata(item.title)}</title>
      <description>${cdata(item.description)}</description>
      <link>${cdata(link)}</link>
      <g:image_link>${cdata(item.image)}</g:image_link>
${extraImagesXml ? extraImagesXml + '\n' : ''}      <g:availability>${item.available ? 'in stock' : 'out of stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${item.price} USD</g:price>
${variantXml}    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Aesthetic East Product Feed</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Auto-generated product catalog for Meta Commerce Manager (Instagram / Facebook Shop / Marketplace)</description>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Meta 自己会按你在后台设置的频率来抓取，这里加个短缓存只是为了避免短时间内被重复请求时反复查数据库
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send('生成商品目录失败：' + err.message);
  }
}
