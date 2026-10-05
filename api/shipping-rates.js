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
//   SHIP_FROM_EMAIL    = 发货人邮箱（购买运单时 Shippo 要求必须有邮箱或电话之一，这里一起配好）
//   SHIP_FROM_PHONE    = 发货人电话
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
    country: 'US',
    // 询价这一步本身不需要邮箱/电话，但这个询价生成的 Shippo "shipment" 之后如果被
    // 后台用来直接购买运单（见 create-shipping-label.js），Shippo 会要求发货人带邮箱或
    // 电话（USPS 尤其如此）。提前把这两项也带上，这样下单时问到的报价后面能直接买成功，
    // 不用等购买失败后再触发一次"重新询价"才能买到。
    email: process.env.SHIP_FROM_EMAIL || '',
    phone: process.env.SHIP_FROM_PHONE || ''
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
          street2: addressTo.street2 || '',
          city: addressTo.city || '',
          state: addressTo.state || '',
          zip: addressTo.zip || '',
          country: 'US',
          // 让 Shippo 顺手用 USPS 的地址库核对一下这个收货地址（CASS 校验）。这一步不影响
          // 询价本身是否成功——就算地址校验不通过，只要格式凑合，Shippo 通常还是会把费率
          // 报回来——校验结果单独放在返回的 address_to.validation_results 里，交给前台
          // 决定要不要提醒顾客（见下面的 addressValidation 字段）。
          validate: true
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

    // address_to.validation_results 只有在上面传了 validate:true 时才会有；Shippo 对某些
    // 国际/边缘情况可能根本不返回这个字段，统一兜底成 null，前台拿到 null 时就当作"没法
    // 判断"处理，不弹警告（宁可漏提醒，也不要对系统本来就判断不了的地址乱报错）。
    const addressValidation = (shipment.address_to && shipment.address_to.validation_results) || null;

    res.status(200).json({ shipmentId: shipment.object_id, rates, addressValidation });
  } catch (err) {
    res.status(500).json({ error: '调用 Shippo 接口时出错：' + err.message });
  }
}
