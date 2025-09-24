const puppeteer = require("puppeteer");
const fs = require("fs");


let browserPromise = null;
async function tryLaunchWithCandidates(candidates, baseOpts) {
  for (const exe of candidates) {
    if (!exe) continue;
    try {
      const opts = Object.assign({}, baseOpts, { executablePath: exe });
      return await puppeteer.launch(opts);
    } catch (err) {
      /* try next */
    }
  }
  // final attempt without executablePath (default)
  return await puppeteer.launch(baseOpts);
}
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const baseOpts = {
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        headless: true,
      };

      // allow explicit override
      const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
      const candidates = [
        envPath,
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      ].filter(Boolean);

      console.log("Puppeteer: executable candidates =", candidates);

      // prefer candidates that actually exist on disk
      const existing = candidates.filter((p) => {
        try {
          return fs.existsSync(p);
        } catch (e) {
          return false;
        }
      });

      console.log("Puppeteer: existing candidates =", existing);

      const tryList = existing.length ? existing.concat(candidates.filter(p => !existing.includes(p))) : candidates;

      // try each candidate explicitly and log failures
      for (const exe of tryList) {
        if (!exe) continue;
        try {
          console.log("Puppeteer: attempting launch with executablePath =", exe);
          const opts = Object.assign({}, baseOpts, { executablePath: exe });
          const b = await puppeteer.launch(opts);
          console.log("Puppeteer: launched successfully with", exe);
          return b;
        } catch (err) {
          console.error("Puppeteer: launch failed with", exe, "-", err && err.message ? err.message : err);
        }
      }

      // final attempt without executablePath (will use puppeteer's cache if available)
      console.log("Puppeteer: attempting launch without executablePath (final attempt)");
      return await puppeteer.launch(baseOpts);
    })();

    const closeBrowser = async () => {
      try {
        const b = await browserPromise;
        if (b && typeof b.close === "function") await b.close();
      } catch (_) { }
    };
    process.on("exit", closeBrowser);
    process.on("SIGINT", closeBrowser);
    process.on("SIGTERM", closeBrowser);
  }
  return browserPromise;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
  );
}
function fmt(n) {
  return "₱" + Number(n || 0).toFixed(2);
}

// function renderHtml({ customer, cartTotal, amount, change, items, points }) {
//   const dateStr = new Date().toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "2-digit",
//   });

//   return `<!doctype html>
//   <html>
//   <head>
//     <meta charset="utf-8"/>
//     <meta name="viewport" content="width=device-width,initial-scale=1"/>
//     <style>
//       @page { size: 80mm auto; margin: 0; }
//       html,body { margin:0; padding:0; -webkit-print-color-adjust: exact; }
//       body {
//         font-family: 'Courier New', Courier, monospace;
//         color:#111;
//         font-size:13px;
//         -webkit-font-smoothing:antialiased;
//       }
//       .paper {
//         box-sizing: border-box;
//         width: 80mm;
//         padding: 10px 10px 12px 10px;
//       }
//       .center { text-align:center; }
//       .store-name { font-weight:bold; font-size:16px; margin-bottom:2px; letter-spacing:1px;}
//       .store-sub { font-size:11px; color:#444; margin-bottom:8px; }
//       .divider { border-bottom: 1px dashed #444; margin:8px 0; }
//       .row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
//       .label { width:90px; font-weight:bold; color:#111; font-size:13px; }
//       .value { flex:1; text-align:right; color:#111; font-size:13px; word-break:break-word; }
//       .table-header { display:flex; font-weight:bold; font-size:13px; margin-bottom:2px; letter-spacing:1px;}
//       .col-desc { flex:2.5; text-align:left; }
//       .col-qty { flex:0.7; text-align:right; }
//       .col-prc { flex:1; text-align:right; }
//       .col-amt { flex:1; text-align:right; }
//       .item-row { display:flex; font-size:13px; margin-bottom:8px; }
//       .total-row { display:flex; justify-content:flex-end; margin-top:8px; font-weight:bold; font-size:14px; }
//       .footer { text-align:center; margin-top:10px; font-size:12px; font-weight:bold; color:#111; }
//       .points-row { margin-top:8px; font-size:13px; font-weight:bold; text-align:center; }
//       .customer-copy { text-align:center; margin-top:12px; font-size:13px; font-weight:bold; color:#222; letter-spacing:2px;}
//     </style>
//   </head>
//   <body>
//     <div class="paper" id="receipt">
//       <div class="center">
//         <div class="store-name">YZY Stores</div>
//         <div class="store-sub">Eastern Slide, Tuding</div>
//       </div>
//       <div class="divider"></div>
//       <div class="row">
//         <div class="label">Customer:</div>
//         <div class="value">${escapeHtml(customer?.name || "N/A")}</div>
//       </div>
//       <div class="row">
//         <div class="label">Date:</div>
//         <div class="value">${escapeHtml(dateStr)}</div>
//       </div>
//       <div class="divider"></div>
//       <div class="table-header">
//         <div class="col-desc">Item</div>
//         <div class="col-qty">QTY</div>
//         <div class="col-prc">Price</div>
//         <div class="col-amt">Amount</div>
//       </div>
//       ${(items || []).map(it => `
//         <div class="item-row">
//           <div class="col-desc">${escapeHtml(it.desc)}</div>
//           <div class="col-qty">${escapeHtml(String(it.qty || 0))}</div>
//           <div class="col-prc">${Number(it.price || it.amount/(it.qty||1)||0).toFixed(2)}</div>
//           <div class="col-amt">${Number(it.amount || 0).toFixed(2)}</div>
//         </div>
//       `).join("")}
//       <div class="divider"></div>
//       <div class="total-row">
//         <div style="padding-right:12px; font-weight:normal">Total:</div>
//         <div style="width:70px; text-align:right;">${fmt(cartTotal)}</div>
//       </div>
//       <div style="display:flex;justify-content:space-between;margin-top:8px">
//         <div class="label" style="font-size:12px;">Amount:</div>
//         <div style="text-align:right;font-size:12px;">${fmt(amount)}</div>
//       </div>
//       <div style="display:flex;justify-content:space-between;margin-top:6px">
//         <div class="label" style="font-size:12px;">Change:</div>
//         <div style="text-align:right;font-size:12px;">${fmt(change)}</div>
//       </div>
//       <div class="points-row">
//         Customer Points: ${typeof points === "number" ? points : "0"}
//       </div>
//       <div class="divider"></div>
//       <div class="footer">THANK YOU — GATANG KA MANEN!</div>
//       <div class="customer-copy">CUSTOMER COPY</div>
//     </div>
//   </body>
//   </html>`;
// }
function renderHtml({ customer, cartTotal, amount, change, items, points }) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      @page { size: 80mm auto; margin: 0; }
      html,body { margin:0; padding:0; -webkit-print-color-adjust: exact; }
      body {
        font-family: 'Courier New', Courier, monospace;
        color:#111;
        font-size:13px;
        -webkit-font-smoothing:antialiased;
      }
      .paper {
        box-sizing: border-box;
        width: 80mm;
        padding: 0 10px 20px 10px; /* top padding removed, bottom added for feed */
      }
      .center { text-align:center; }
      .logo { margin: 0 auto 5px auto; display:block; max-width:50px; }
      .store-sub { font-size:11px; color:#444; margin-bottom:8px; }
      .divider { border-bottom: 1px dashed #444; margin:8px 0; }
      .row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
      .label { width:90px; font-weight:bold; color:#111; font-size:13px; }
      .value { flex:1; text-align:right; color:#111; font-size:13px; word-break:break-word; }
      .table-header { display:flex; font-weight:bold; font-size:13px; margin-bottom:2px; letter-spacing:1px;}
      .col-desc { flex:2.5; text-align:left; }
      .col-qty { flex:0.7; text-align:right; }
      .col-prc { flex:1; text-align:right; }
      .col-amt { flex:1; text-align:right; }
      .item-row { display:flex; font-size:13px; margin-bottom:8px; }
      .total-row { display:flex; justify-content:flex-end; margin-top:8px; font-weight:bold; font-size:14px; }
      .footer { text-align:center; margin-top:10px; font-size:12px; font-weight:bold; color:#111; }
      .points-row { margin-top:8px; font-size:13px; font-weight:bold; text-align:center; }
      .customer-copy { text-align:center; margin-top:12px; font-size:13px; font-weight:bold; color:#222; letter-spacing:2px;}
      .bottom-space { height:50px; } /* Extra feed space */
    </style>
  </head>
  <body>
    <div class="paper" id="receipt">
      <div class="center">
        <div class="store-name" style="font-weight:bold; font-size:16px; margin-bottom:2px; letter-spacing:1px;">YZY Store</div>
        <div class="store-sub">Eastern Slide, Tuding</div>
      </div>
      <div class="divider"></div>
      <div class="row">
        <div class="label">Customer:</div>
        <div class="value">${escapeHtml(customer?.name || "N/A")}</div>
      </div>
      <div class="row">
        <div class="label">Date:</div>
        <div class="value">${escapeHtml(dateStr)}</div>
      </div>
      <div class="divider"></div>
      <div class="table-header">
        <div class="col-desc">Item</div>
        <div class="col-qty">QTY</div>
        <div class="col-prc">Price</div>
        <div class="col-amt">Amount</div>
      </div>
      ${(items || []).map(it => `
        <div class="item-row">
          <div class="col-desc">${escapeHtml(it.desc)}</div>
          <div class="col-qty">${escapeHtml(String(it.qty || 0))}</div>
          <div class="col-prc">${Number(it.price || it.amount/(it.qty||1)||0).toFixed(2)}</div>
          <div class="col-amt">${Number(it.amount || 0).toFixed(2)}</div>
        </div>
      `).join("")}
      <div class="divider"></div>
      <div class="total-row">
        <div style="padding-right:12px; font-weight:normal">Total:</div>
        <div style="width:70px; text-align:right;">${fmt(cartTotal)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <div class="label" style="font-size:12px;">Amount:</div>
        <div style="text-align:right;font-size:12px;">${fmt(amount)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <div class="label" style="font-size:12px;">Change:</div>
        <div style="text-align:right;font-size:12px;">${fmt(change)}</div>
      </div>
      <div class="points-row">
        Customer Points: ${typeof points === "number" ? points : "0"}
      </div>
      <div class="divider"></div>
      <div class="footer">THANK YOU — GATANG KA MANEN!</div>
      <div class="customer-copy">CUSTOMER COPY</div>
      <div class="bottom-space"></div>
    </div>
  </body>
  </html>`;
}


exports.generate = async function (req, res) {
  try {
    const raw = req.body || {};
    // Prefer customer.points, fallback to raw.points, then 0
    const customerPoints =
      (raw.customer && typeof raw.customer.points === "number")
        ? raw.customer.points
        : (typeof raw.points === "number" ? raw.points : 0);

    const data = {
      customer: raw.customer || { name: "N/A" },
      cartTotal: Number(raw.cartTotal || 0),
      amount: Number(raw.amount || 0),
      change: Number(raw.change || 0),
      points: customerPoints,
      items: Array.isArray(raw.items)
        ? raw.items.map((it) => ({
            desc: it && it.desc ? String(it.desc) : "",
            qty: Number(it.qty || 0),
            price: typeof it.price === "number" ? it.price : (Number(it.amount || 0) / Number(it.qty || 1)),
            amount: Number(it.amount || 0),
          }))
        : [],
    };

    const MAX_ITEMS = 2000;
    if (data.items.length > MAX_ITEMS) data.items = data.items.slice(0, MAX_ITEMS);

    const html = renderHtml(data);

    const browser = await getBrowser();
    const page = await (await browser).newPage();

    // viewport width roughly equals 80mm at 96dpi (1mm ≈ 3.78px)
    const widthPx = Math.round(80 * 3.78);
    await page.setViewport({ width: widthPx, height: 800 });

    // render and wait for fonts/resources
    await page.setContent(html, { waitUntil: "networkidle0" });

    // measure the .paper element height in CSS pixels
    const paperHeightPx = await page.evaluate(() => {
      const el = document.getElementById('receipt') || document.querySelector('.paper') || document.body;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const mt = parseFloat(style.marginTop || 0);
      const mb = parseFloat(style.marginBottom || 0);
      return Math.ceil(rect.height + mt + mb);
    });

    // convert px -> mm (assuming 96dpi)
    const pxToMm = 25.4 / 96;
    let heightMm = Math.ceil(paperHeightPx * pxToMm) + 2; // small padding to avoid clipping

    // clamp size
    const MIN_HEIGHT_MM = 40;
    const MAX_HEIGHT_MM = 4000;
    if (heightMm < MIN_HEIGHT_MM) heightMm = MIN_HEIGHT_MM;
    if (heightMm > MAX_HEIGHT_MM) heightMm = MAX_HEIGHT_MM;

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: "80mm",
      height: `${heightMm}mm`,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
      // Optimize for thermal printers
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      // Reduce complexity for thermal printer compatibility
      scale: 1.0,
      // Add these options for better thermal printer support
      format: undefined, // Let the width/height control the format
      tagged: false, // Disable PDF tagging for simpler output
    });

    await page.close();

    const filename = `receipt-${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", Buffer.byteLength(pdfBuffer));
    // expose Content-Disposition so browsers on other origins can read filename if needed
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition,Content-Length");
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "PDF generation failed", details: String(err) });
  }
}