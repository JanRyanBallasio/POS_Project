const puppeteer = require("puppeteer");

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

function renderHtml({ customer, cartTotal, amount, change, items }) {
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
    <!-- Poppins -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: 80mm auto; margin: 0; }
      html,body { margin:0; padding:0; -webkit-print-color-adjust: exact; }
      body {
        font-family: 'Poppins', Arial, Helvetica, sans-serif;
        color:#111;
        -webkit-font-smoothing:antialiased;
      }

      /* container that we measure */
      .paper {
        box-sizing: border-box;
        width: 80mm;
        padding: 10px 10px 12px 10px;
      }

      .center { text-align:center; }
      .store-name { font-weight:700; font-size:16px; margin-bottom:2px; }
      .store-sub { font-size:10px; color:#444; margin-bottom:8px; }

      .notice { font-size:11px; color:#000; font-weight:600; margin:6px 0; text-align:center; }

      .divider { border-bottom: 1px dashed #444; margin:8px 0; }

      /* rows */
      .row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
      .label { width:110px; font-weight:700; color:#111; font-size:12px; }
      .value { flex:1; text-align:right; color:#111; font-size:12px; word-break:break-word; }

      /* table */
      .table-header, .table-row { display:flex; align-items:flex-start; margin-bottom:6px; }
      .table-header .desc, .table-row .desc { flex:1; font-size:12px; }
      .table-header .desc { font-weight:700; }
      .table-header .col-qty, .table-row .col-qty { width:40px; text-align:center; flex:0 0 40px; font-size:12px; font-weight:700; }
      .table-header .col-amt, .table-row .col-amt { width:70px; text-align:right; flex:0 0 70px; font-size:12px; font-weight:700; }

      .desc { padding-right:8px; white-space:normal; word-break:break-word; }
      .col-qty { padding-left:6px; }
      .col-amt { padding-left:6px; font-variant-numeric: tabular-nums; -webkit-font-feature-settings: "tnum"; font-feature-settings: "tnum"; }

      .total-row { display:flex; justify-content:flex-end; margin-top:8px; font-weight:700; font-size:13px; }
      .small { font-size:11px; color:#444; }

      .footer { text-align:center; margin-top:10px; font-size:11px; font-weight:600; color:#111; }

      /* ensure child elements don't impose huge min-heights */
      .paper * { max-height: none; }

      /* accessibility / small screens */
      @media print {
        .paper { width: 80mm; }
      }
    </style>
  </head>
  <body>
    <div class="paper" id="receipt">
      <div class="center">
        <div class="store-name">YZY Stores</div>
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
        <div class="desc">Description</div>
        <div class="col-qty">Qty</div>
        <div class="col-amt">Amount</div>
      </div>

      ${(items || []).map(it => `
        <div class="table-row">
          <div class="desc">${escapeHtml(it.desc)}</div>
          <div class="col-qty">${escapeHtml(String(it.qty || 0))}</div>
          <div class="col-amt">${fmt(it.amount)}</div>
        </div>
      `).join("")}

      <div class="divider"></div>

      <div class="total-row">
        <div style="padding-right:12px; font-weight:400">Total:</div>
        <div style="width:70px; text-align:right; font-weight:700">${fmt(cartTotal)}</div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <div class="label small">Amount:</div>
        <div class="small" style="text-align:right">${fmt(amount)}</div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <div class="label small">Change:</div>
        <div class="small" style="text-align:right">${fmt(change)}</div>
      </div>

      <div class="divider"></div>

      <div class="notice" style="margin-top:6px; text-align:center;">CUSTOMER COPY — NOT AN OFFICIAL RECEIPT</div>

      <div class="footer">THANK YOU — GATANG KA MANEN!</div>
    </div>
  </body>
  </html>`;
}

exports.generate = async function (req, res) {
  try {
    const raw = req.body || {};
    const data = {
      customer: raw.customer || { name: "N/A" },
      cartTotal: Number(raw.cartTotal || 0),
      amount: Number(raw.amount || 0),
      change: Number(raw.change || 0),
      items: Array.isArray(raw.items)
        ? raw.items.map((it) => ({
          desc: it && it.desc ? String(it.desc) : "",
          qty: Number(it.qty || 0),
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
    });

    await page.close();

    const filename = `receipt-${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", Buffer.byteLength(pdfBuffer));
    // expose Content-Disposition so browsers on other origins can read filename if needed
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition,Content-Length");
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "PDF generation failed", details: String(err) });
  }
}