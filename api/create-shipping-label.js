// /api/create-shipping-label.js
// Vercel Serverless Function —— 后台点"生成运单"时调用，真正向 Shippo 购买运单
// （之前 /api/shipping-rates.js 只是"询价"，从没有真的买过运单，所以一直没有运单号）。
//
// 跟 shipping-rates.js 一样的原因：Shippo 密钥不能出现在浏览器能看到的任何地方，
// 必须放在这个服务器函数里，只在 Vercel 后台的环境变量里存着。
//
// 这个接口只应该由【已登录的管理员】调用——不然任何人都能在你的 Shippo 账号里乱花钱买运单。
// 做法：前台调用这个接口时，把管理员当前登录的 Supabase session 的 access token 放进
// Authorization 请求头里带过来；这个函数拿着这个 token 去问 Supabase "这个 token 对应的人
// 是不是一个真实登录用户"，同时也拿着同一个 token 去读/写 orders 表——这样可以直接复用
// orders 表现有的 RLS 权限设置（只有登录管理员能读订单、现在也只有登录管理员能改订单），
// 不需要额外引入 Supabase 的"服务角色密钥"（那个密钥权限更大、风险更高，这里刻意不用它）。
//
// 部署到 Vercel 后，除了已经配置过的 SHIPPO_API_TOKEN / SHIP_FROM_* 这几个环境变量，
// 还需要再加两个（跟前台 js 里用的是同一对公开值，不是新的密钥）：
//   SUPABASE_URL       = 你 Supabase 项目的 URL
//   SUPABASE_ANON_KEY  = 你 Supabase 项目的 anon key
// 加完同样记得去 Vercel 项目里点一次 "Redeploy"。

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const shippoToken = process.env.SHIPPO_API_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!shippoToken) {
    res.status(500).json({ error: '服务器还没配置 SHIPPO_API_TOKEN，请先在 Vercel 项目的环境变量里添加并重新部署。' });
    return;
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: '服务器还没配置 SUPABASE_URL / SUPABASE_ANON_KEY，请先在 Vercel 项目的环境变量里添加并重新部署。' });
    return;
  }

  // ---- 第一步：确认调用者是登录的管理员 ----
  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!accessToken) {
    res.status(401).json({ error: '未登录，无法生成运单。' });
    return;
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` }
  });
  if (!userRes.ok) {
    res.status(401).json({ error: '登录状态已失效，请重新登录后台后再试一次。' });
    return;
  }

  const { order_id } = req.body || {};
  if (!order_id) {
    res.status(400).json({ error: '缺少订单号。' });
    return;
  }

  // 用管理员自己的 access token 去读 orders 表——复用 orders_admin_read 这条 RLS 策略，
  // 不需要服务角色密钥也能正常读到（前提是这个 token 确实是登录管理员的）。
  const supabaseHeaders = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    const orderRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order_id)}&select=*`, {
      headers: supabaseHeaders
    });
    const orders = await orderRes.json();
    if (!orderRes.ok || !orders || orders.length === 0) {
      res.status(404).json({ error: '找不到这个订单。' });
      return;
    }
    const order = orders[0];

    // 已经生成过运单的订单，不重新购买（避免手滑多点一次、白白多花一次 Shippo 的运单费），
    // 直接把之前存的结果原样返回。
    if (order.tracking_number && order.label_status === 'success') {
      res.status(200).json({
        alreadyGenerated: true,
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        labelUrl: order.label_url
      });
      return;
    }

    // 人工核算运费的订单（购物车里含古董家具），从来没有向 Shippo 询过价，
    // 没有 shippo_rate_id，没法自动生成运单。
    if (order.needs_manual_shipping || !order.shippo_rate_id) {
      res.status(400).json({ error: '这是人工核算运费的订单（通常是含古董家具），不能自动生成运单，请联系顾客另外安排物流。' });
      return;
    }

    let transaction = await purchaseTransactionWithRate(shippoToken, order.shippo_rate_id);

    // 之前询价时那条报价（shippo_rate_id）如果已经过期/失效，Shippo 会在这里报错——
    // 这时候用订单当时存下的收货地址 + 包裹信息（shipping_parcel）重新问一次价，
    // 尽量找一条跟原来同一家快递、同一个服务等级的新报价，再用新报价去买运单。
    if (!transaction.ok) {
      if (!order.shipping_parcel) {
        res.status(502).json({ error: `原来的运费报价已经失效，且这笔订单没有保存包裹信息，无法自动重新询价。Shippo 返回：${transaction.error}` });
        return;
      }
      const requote = await requoteAndPurchase(shippoToken, order);
      if (!requote.ok) {
        await writeLabelError(supabaseUrl, supabaseHeaders, order_id, requote.error);
        res.status(502).json({ error: `生成运单失败（已自动重新询价一次仍失败）：${requote.error}` });
        return;
      }
      transaction = requote;
    }

    const { trackingNumber, trackingUrl, labelUrl, transactionId } = transaction;

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order_id)}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        label_url: labelUrl,
        shippo_transaction_id: transactionId,
        label_status: 'success',
        label_error: null,
        label_generated_at: new Date().toISOString()
      })
    });
    if (!patchRes.ok) {
      const patchErrText = await patchRes.text();
      // 运单已经买成功了（钱已经花出去了），只是写回数据库这一步失败——这种情况必须原样
      // 把买到的运单信息返回给后台，不能让管理员以为"没买成功"又点一次，重复购买浪费钱。
      res.status(200).json({
        trackingNumber, trackingUrl, labelUrl,
        warning: `运单已购买成功，但写回订单记录时出错（不影响运单本身）：${patchErrText}`
      });
      return;
    }

    res.status(200).json({ trackingNumber, trackingUrl, labelUrl });
  } catch (err) {
    res.status(500).json({ error: '生成运单时出错：' + err.message });
  }
}

// 用一条已有的 Shippo 报价 ID 直接购买运单
async function purchaseTransactionWithRate(shippoToken, rateId) {
  try {
    const resp = await fetch('https://api.goshippo.com/transactions/', {
      method: 'POST',
      headers: { Authorization: `ShippoToken ${shippoToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate: rateId, label_file_type: 'PDF', async: false })
    });
    const data = await resp.json();
    if (!resp.ok || data.status === 'ERROR' || (data.messages && data.messages.length > 0 && !data.tracking_number)) {
      const msg = (data.messages && data.messages.map(m => m.text).join('; ')) || data.detail || '购买运单失败（报价可能已过期）';
      return { ok: false, error: msg };
    }
    return {
      ok: true,
      trackingNumber: data.tracking_number,
      trackingUrl: data.tracking_url_provider,
      labelUrl: data.label_url,
      transactionId: data.object_id
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// 原来的报价失效时：用订单保存的收货地址 + 包裹信息重新问一次价，挑一条跟原来同一家
// 快递、同一个服务等级的（找不到就用新报价里最便宜的那条），再用这条新报价购买运单。
async function requoteAndPurchase(shippoToken, order) {
  const addressFrom = {
    name: process.env.SHIP_FROM_NAME || '',
    street1: process.env.SHIP_FROM_STREET1 || '',
    city: process.env.SHIP_FROM_CITY || '',
    state: process.env.SHIP_FROM_STATE || '',
    zip: process.env.SHIP_FROM_ZIP || '',
    country: 'US'
  };
  const parcel = order.shipping_parcel;

  try {
    const shipmentRes = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: { Authorization: `ShippoToken ${shippoToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_from: addressFrom,
        address_to: {
          name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
          street1: order.address || '',
          city: order.city || '',
          state: order.state || '',
          zip: order.zip || '',
          country: 'US'
        },
        parcels: [{
          length: String(parcel.length), width: String(parcel.width), height: String(parcel.height),
          distance_unit: 'cm', weight: String(parcel.weightG), mass_unit: 'g'
        }],
        async: false
      })
    });
    const shipment = await shipmentRes.json();
    if (!shipmentRes.ok || !shipment.rates || shipment.rates.length === 0) {
      return { ok: false, error: (shipment && shipment.detail) || '重新询价失败' };
    }

    const rates = shipment.rates.filter(r => r.amount).sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    const sameAsBefore = rates.find(r => r.provider === order.shipping_carrier && r.servicelevel && r.servicelevel.name === order.shipping_service);
    const chosenRate = sameAsBefore || rates[0];

    return await purchaseTransactionWithRate(shippoToken, chosenRate.object_id);
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// 失败也记一下，方便管理员在后台看到"上次失败的原因"，不用光看到一个"生成运单"按钮
// 一直点不动也不知道为什么。
async function writeLabelError(supabaseUrl, supabaseHeaders, orderId, errorMsg) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ label_status: 'error', label_error: errorMsg })
    });
  } catch (_) {
    // 记录失败原因这一步本身失败也无所谓，不影响把原始错误返回给前台
  }
}
