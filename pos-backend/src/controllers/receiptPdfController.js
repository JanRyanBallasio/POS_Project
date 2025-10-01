const fs = require('fs');
const path = require('path');

function buildHTMLReceipt(data) {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const itemsHTML = (data.items || []).map((item, index) => {
    const qty = Number(item?.qty || 0);
    const amount = Number(item?.amount || 0);
    const price = typeof item?.price === 'number' ? item.price : (qty > 0 ? amount / qty : 0);
    const descRaw = typeof item?.desc === 'string' ? item.desc : '';
    const desc = descRaw.length > 20 ? `${descRaw.slice(0, 17)}...` : descRaw;

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${desc}</td>
        <td class="right">${qty}</td>
        <td class="right">P${price.toFixed(2)}</td>
        <td class="right">P${amount.toFixed(2)}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.2; margin: 0; padding: 10px; width: 80mm; background: #fff; color: #000; }
    .header { text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 14px; }
    .separator { border-top: 1px dashed #000; margin: 6px 0; height: 1px; }
    .row { display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 0; text-align: left; font-size: 11px; white-space: nowrap; }
    .right { text-align: right; }
    .summary { margin: 8px 0; }
    .summary-line { display: flex; justify-content: space-between; margin: 2px 0; }
    .footer { margin-top: 12px; text-align: center; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div>${data.store?.name || 'YZY STORE'}</div>
    <div>${data.store?.address1 || 'Eastern Slide, Tuding'}</div>
    ${data.store?.address2 ? `<div>${data.store.address2}</div>` : ``}
  </div>

  <div class="separator"></div>

  <div class="row"><span>Customer:</span><span>${data.customer?.name || 'N/A'}</span></div>
  <div class="row"><span>Date:</span><span>${dateStr}</span></div>

  <div class="separator"></div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Price</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <div class="separator"></div>

  <div class="summary">
    <div class="summary-line"><span>Total:</span><span>P${Number(data.cartTotal || 0).toFixed(2)}</span></div>
    <div class="summary-line"><span>Amount:</span><span>P${Number(data.amount || 0).toFixed(2)}</span></div>
    <div class="summary-line"><span>Change:</span><span>P${Number(data.change || 0).toFixed(2)}</span></div>
  </div>

  <div class="separator"></div>

  <div class="summary-line"><span>Customer Points:</span><span>${Number(data.points || 0)}</span></div>

  <div class="separator"></div>

  <div class="footer">
    <div>CUSTOMER COPY - NOT AN OFFICIAL RECEIPT</div>
    <div>THANK YOU - GATANG KA MANEN!</div>
  </div>

  <div class="separator"></div>
</body>
</html>`;
}

exports.generate = async function (req, res) {
  try {
    const raw = req.body || {};
    const data = {
      store: raw.store || undefined,
      customer: raw.customer || { name: 'N/A' },
      cartTotal: Number(raw.cartTotal || 0),
      amount: Number(raw.amount || 0),
      change: Number(raw.change || 0),
      points: Number(raw.points || 0),
      items: Array.isArray(raw.items) ? raw.items.map(it => ({
        desc: typeof it?.desc === 'string' ? it.desc : '',
        qty: Number(it?.qty || 0),
        price: typeof it?.price === 'number' ? it.price : undefined,
        amount: Number(it?.amount || 0),
      })) : [],
    };

    const html = buildHTMLReceipt(data);

    const receiptsDir = path.join(__dirname, '../../receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    const filename = `receipt_${Date.now()}.html`;
    const filepath = path.join(receiptsDir, filename);
    fs.writeFileSync(filepath, html, 'utf8');

    res.json({ success: true, message: 'Receipt generated', html, filepath });
  } catch (err) {
    console.error('Receipt generate error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate receipt', details: String(err) });
  }
};