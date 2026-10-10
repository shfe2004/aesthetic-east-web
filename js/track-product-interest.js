// /api/track-product-interest.js
// Vercel Serverless Function —— 接收前台批量上报的"商品浏览停留时长"，存进 Supabase 的
// product_interest 表，供后台"商品兴趣分析"板块统计用。具体怎么测出"停留时长"的，
// 以及匿名访客 ID 是怎么回事，见 sql/add_product_interest_tracking.sql 顶部的说明。
//
// 跟 /api/track-visit 保持同一套思路：用 anon key（不是更高权限的 service role key），
// 因为这张表的写入策略本来就对任何人开放，读取策略已经用 RLS 限制成只有登录管理员能看
// （见 sql/add_product_interest_tracking.sql），不需要额外的高权限 key。
//
// 部署前需要在 Vercel 项目的 Settings -> Environment Variables 里确认已经有（如果部署过
// api/track-visit.js 就已经配置过，这两个是同一份，不用重复添加）：
//   SUPABASE_URL
//   SUPABASE_ANON_KEY

// 一次最多批量接受多少条，防止有人恶意灌一个超大数组把数据库写爆
const MAX_ENTRIES_PER_REQUEST = 50;
// 单个商品 ID / 分类字符串的长度上限，同样是防御性截断，不是业务需要
const MAX_ID_LENGTH = 100;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    // 跟 track-visit.js 一样，这里安静失败就好，不能因为统计功能没配置好就影响顾客正常浏览
    res.status(500).json({ error: '服务器还没配置 SUPABASE_URL / SUPABASE_ANON_KEY。' });
    return;
  }

  const body = req.body || {};
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId.slice(0, MAX_ID_LENGTH) : '';
  const entries = Array.isArray(body.entries) ? body.entries.slice(0, MAX_ENTRIES_PER_REQUEST) : [];

  if (!visitorId || entries.length === 0) {
    // 不是真正的错误（比如页面刚打开就被关掉，累计停留时长是 0，前台根本不会发这个请求），
    // 但请求体确实不完整，直接 400 返回，不写入任何东西
    res.status(400).json({ error: 'missing visitorId or entries' });
    return;
  }

  // 逐条清洗：丢掉格式不对的条目，而不是因为数组里有一条脏数据就整批都不存
  const rows = entries
    .filter(e => e && typeof e.productId === 'string' && e.productId.length > 0)
    .map(e => ({
      visitor_id: visitorId,
      product_id: e.productId.slice(0, MAX_ID_LENGTH),
      category: typeof e.category === 'string' ? e.category.slice(0, MAX_ID_LENGTH) : null,
      // dwell_ms 做个合理范围限制：负数没有意义，单条超过 30 分钟大概率是前台计时逻辑
      // 出了问题（比如电脑休眠后恢复，时间差算出一个离谱的大数），截断到 30 分钟封顶，
      // 避免脏数据把"平均停留时长"这个统计指标拉得完全失真。
      dwell_ms: Math.max(0, Math.min(Math.round(Number(e.dwellMs) || 0), 30 * 60 * 1000))
    }))
    .filter(r => r.dwell_ms > 0); // 停留 0 毫秒的不用存，省数据库空间

  if (rows.length === 0) {
    res.status(204).end();
    return;
  }

  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/product_interest`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(rows)
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Supabase insert failed: HTTP ${insertRes.status} ${errText}`);
    }

    res.status(204).end();
  } catch (err) {
    console.error('记录商品浏览兴趣失败:', err);
    // 同样安静失败，不影响访客体验——而且这类请求基本是用 sendBeacon 在页面关闭前发出去的，
    // 顾客根本看不到也不会看到任何响应
    res.status(500).json({ error: 'failed to record product interest' });
  }
}
