// /api/shipping-rates.js
// Vercel Serverless Function —— 实时向 Shippo 询价，返回可选的快递方式和运费。
//
// 为什么这段代码必须放在后端（这里），不能直接写进前台 js/app.js：
// Shippo 的密钥（SHIPPO_API_TOKEN）一旦出现在浏览器能看到的任何文件里，
// 任何人打开浏览器控制台或查看网页源码都能把它偷走，拿去用你的账号免费查费率/发快递。
// 放进 Vercel 的服务器函数里，密钥只存在于 Vercel 后台的"环境变量"中，
// 浏览器和网页源码永远看不到，前台只能通过这个函数间接"借用"它一次性用一下。
//
// 部署到 Vercel 后，需要去项目的 Settings → Environment Variables 里添加：
//   SHIPPO_API_TOKEN   = 你的 Shippo Token（先填测试用的 shippo_test_... ，正式上线换成 shippo_live_...）
//   SHIP_FROM_NAME     = 发货人姓名 / 店铺名
//   SHIP_FROM_STREET1  = 发货仓库的街道地址
//   SHIP_FROM_CITY     = 发货仓库所在城市
//   SHIP_FROM_STATE    = 发货仓库所在州（两位缩写，如 CA）
//   SHIP_FROM_ZIP      = 发货仓库邮编
// 加完环境变量后，需要在 Vercel 项目里手动点一次 "Redeploy"（重新部署），新变量才会生效——
// 只是保存环境变量本身不会让正在运行的函数立刻读到新值。

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.SHIPPO_API_TOKEN;
  if (!token) {
    res.status(500).json({ error: '服务器还没配置 SHIPPO_API_TOKEN，请先在 Vercel 项目的环境变量里添加并重新部署。' });
    return;
  }

  const { addressTo, parcel } = req.body || {};
  if (!addressTo || !parcel) {
    res.status(400).json({ error: '缺少收货地址或包裹信息。' });
    return;
  }

  const addressFrom = {
    name: process.env.SHIP_FROM_NAME || '',
    street1: process.env.SHIP_FROM_STREET1 || '',
    city: process.env.SHIP_FROM_CITY || '',
    state: process.env.SHIP_FROM_STATE || '',
    zip: process.env.SHIP_FROM_ZIP || '',
    country: 'US'
  };

  if (!addressFrom.street1 || !addressFrom.city || !addressFrom.state || !addressFrom.zip) {
    res.status(500).json({ error: '服务器还没配置发货仓库地址（SHIP_FROM_ 开头的环境变量），请先在 Vercel 里补上并重新部署。' });
    return;
  }

  try {
    const shipmentRes = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        Authorization: `ShippoToken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address_from: addressFrom,
        address_to: {
          name: addressTo.name || '',
          street1: addressTo.street1 || '',
          city: addressTo.city || '',
          state: addressTo.state || '',
          zip: addressTo.zip || '',
          country: 'US'
        },
        parcels: [
          {
            length: String(parcel.length),
            width: String(parcel.width),
            height: String(parcel.height),
            distance_unit: 'cm',
            weight: String(parcel.weightG),
            mass_unit: 'g'
          }
        ],
        async: false
      })
    });

    const shipment = await shipmentRes.json();

    if (!shipmentRes.ok) {
      res.status(shipmentRes.status).json({
        error: (shipment && shipment.detail) || '向 Shippo 询价失败，请检查地址是否填写正确。',
        raw: shipment
      });
      return;
    }

    const rates = (shipment.rates || [])
      .filter(r => r.amount)
      .map(r => ({
        rateId: r.object_id,
        carrier: r.provider,
        service: r.servicelevel ? r.servicelevel.name : '',
        amount: parseFloat(r.amount),
        currency: r.currency,
        days: r.estimated_days
      }))
      .sort((a, b) => a.amount - b.amount);

    res.status(200).json({ shipmentId: shipment.object_id, rates });
  } catch (err) {
    res.status(500).json({ error: '调用 Shippo 接口时出错：' + err.message });
  }
}
