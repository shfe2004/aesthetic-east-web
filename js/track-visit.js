// /api/track-visit.js
// Vercel Serverless Function —— 接收前台发来的一条访问记录，补上地理位置信息后存进 Supabase。
//
// 地理位置怎么来的：不需要接入任何第三方地理位置查询服务（这类服务通常要收费或限制调用次数）。
// 网站部署在 Vercel 上之后，Vercel 的边缘网络会自动给每个到达服务器函数的请求附带几个表示
// "这个请求大概从哪里发出来的" 的请求头，包括：
//   x-vercel-ip-country         国家代码，如 US / CN
//   x-vercel-ip-country-region  州/省，如 CA
//   x-vercel-ip-city            城市（URL 编码过，需要 decodeURIComponent）
// 这些头在本地用 `vercel dev` 调试或在其它平台上可能是空的，属于正常现象，
// 线上部署到 Vercel 正式环境后才会有真实值。
//
// 为什么用 Supabase 的 anon key 而不是更"高权限"的 service role key：
// 这张表只允许匿名用户执行"写入"操作，并且后台已经在 Supabase 里用 Row Level Security
// 限制了只有登录管理员才能"读取"这张表（见 sql/create_site_visits_table.sql），
// 所以这里用 anon key 已经足够，不用额外在 Vercel 里配置和保管一份更敏感的 service role key。
//
// 部署前需要在 Vercel 项目的 Settings -> Environment Variables 里添加（如果你已经为
// api/product-feed.js 配置过，这两个是同一份，不用重复添加）：
//   SUPABASE_URL        = 你的 Supabase 项目地址
//   SUPABASE_ANON_KEY    = 你的 Supabase anon public key
// 加完环境变量记得去 Vercel 项目里手动点一次 "Redeploy"。

// 允许写入的 source 分类，跟前台 js/app.js 里分类逻辑保持一致，防止被人恶意塞入乱七八糟的值
const VALID_SOURCES = new Set(['instagram', 'facebook', 'tiktok', 'search', 'direct', 'referral', 'other']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    // 这里不抛出显眼的错误给前台——统计功能缺失不应该影响正常顾客浏览购物，
    // 安静地返回失败即可，前台那边本来也是"发了就不管"，不会弹窗打扰客人。
    res.status(500).json({ error: '服务器还没配置 SUPABASE_URL / SUPABASE_ANON_KEY。' });
    return;
  }

  const body = req.body || {};
  const path = typeof body.path === 'string' ? body.path.slice(0, 500) : '';
  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 1000) : '';
  const source = VALID_SOURCES.has(body.source) ? body.source : 'other';
  const referralDomain = typeof body.referralDomain === 'string' ? body.referralDomain.slice(0, 255) : null;

  // Vercel 自动附带的地理位置请求头（本地调试/非 Vercel 环境下通常拿不到，留空即可，不影响主流程）
  const country = req.headers['x-vercel-ip-country'] || null;
  const region = req.headers['x-vercel-ip-country-region'] || null;
  const cityRaw = req.headers['x-vercel-ip-city'];
  let city = null;
  if (cityRaw) {
    try { city = decodeURIComponent(cityRaw); } catch { city = cityRaw; }
  }

  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/site_visits`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify([{
        path,
        referrer,
        source,
        referral_domain: referralDomain,
        country,
        region,
        city
      }])
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Supabase insert failed: HTTP ${insertRes.status} ${errText}`);
    }

    res.status(204).end();
  } catch (err) {
    console.error('记录访问统计失败:', err);
    // 同样安静失败，不影响访客体验
    res.status(500).json({ error: 'failed to record visit' });
  }
}
