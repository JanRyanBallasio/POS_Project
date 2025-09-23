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
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-images",
          "--disable-javascript",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-translate",
          "--hide-scrollbars",
          "--mute-audio",
          "--no-default-browser-check",
          "--disable-logging",
          "--disable-permissions-api",
          "--disable-presentation-api",
          "--disable-print-preview",
          "--disable-speech-api",
          "--disable-file-system",
          "--disable-notifications",
          "--disable-geolocation",
          "--disable-device-discovery-notifications"
        ],
        headless: true,
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: 30000,
      };

      // allow explicit override
      const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
      const candidates = [
        envPath,
        "/home/ubuntu/.cache/puppeteer/chrome/linux-140.0.7339.80/chrome-linux64/chrome",
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
      @page { size: 82mm auto; margin: 0; }
      html,body { margin:0; padding:0; -webkit-print-color-adjust: exact; }
      body {
        font-family: 'Courier New', Courier, monospace;
        color:#111;
        font-size:10px; /* FURTHER REDUCED from 11px to 10px */
        -webkit-font-smoothing:antialiased;
        line-height: 1.1; /* TIGHTER line spacing */
      }
      .paper {
        box-sizing: border-box;
        width: 82mm;
        padding: 0 6px 5px 6px; /* REDUCED bottom padding to 5px */
        overflow: hidden;
      }
      
      /* NEW: Force page break after content */
      .paper::after {
        content: "";
        display: block;
        page-break-after: always;
        height: 0;
        margin: 0;
        padding: 0;
      }
      .center { text-align:center; }
      .logo { margin: 0 auto 3px auto; display:block; max-width:50px; }
      .store-sub { font-size:9px; color:#444; margin-bottom:4px; } /* REDUCED from 10px */
      .divider { border-bottom: 1px dashed #444; margin:4px 0; } /* REDUCED margin */
      .row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3px; } /* REDUCED margin */
      .label { width:70px; font-weight:bold; color:#111; font-size:10px; } /* REDUCED width and font size */
      .value { flex:1; text-align:right; color:#111; font-size:10px; word-break:break-word; }
      .table-header { display:flex; font-weight:bold; font-size:10px; margin-bottom:2px; letter-spacing:0.3px;} /* REDUCED font size and letter spacing */
      .col-desc { flex:3.5; text-align:left; word-break:break-word; overflow-wrap:break-word; } /* OPTIMIZED flex ratio */
      .col-qty { flex:0.6; text-align:right; } /* REDUCED from 0.7 to 0.6 */
      .col-prc { flex:1.0; text-align:right; } /* REDUCED from 1.1 to 1.0 */
      .col-amt { flex:1.1; text-align:right; } /* REDUCED from 1.2 to 1.1 */
      .item-row { display:flex; font-size:10px; margin-bottom:3px; align-items:flex-start; } /* REDUCED font size and margin */
      .item-desc { flex:3.5; word-break:break-word; overflow-wrap:break-word; line-height:1.0; } /* OPTIMIZED flex and line height */
      .item-qty { flex:0.6; text-align:right; }
      .item-prc { flex:1.0; text-align:right; }
      .item-amt { flex:1.1; text-align:right; }
      .total-row { display:flex; justify-content:flex-end; margin-top:4px; font-weight:bold; font-size:11px; } /* REDUCED from 12px */
      .footer { text-align:center; margin-top:6px; font-size:10px; font-weight:bold; color:#111; } /* REDUCED from 11px */
      .points-row { margin-top:4px; font-size:10px; font-weight:bold; text-align:center; } /* REDUCED margin and font size */
      .customer-copy { text-align:center; margin-top:6px; font-size:10px; font-weight:bold; color:#222; letter-spacing:0.5px;} /* REDUCED font size and letter spacing */
      
      /* OPTIMIZED: Better handling for long product names */
      .product-name {
        word-break: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        line-height: 1.0;
        max-width: 100%; /* Prevent overflow */
      }
      
      /* NEW: Compact spacing for bulk receipts */
      .compact-mode .item-row { margin-bottom: 2px; }
      .compact-mode .divider { margin: 3px 0; }
      .compact-mode .row { margin-bottom: 2px; }
    </style>
  </head>
  <body>
    <div class="paper ${items && items.length > 50 ? 'compact-mode' : ''}" id="receipt">
      <div class="center">
        <div class="store-name" style="font-weight:bold; font-size:14px; margin-bottom:2px; letter-spacing:0.5px;">YZY Store</div>
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
      ${(items || []).map((it, index) => `
        <div class="item-row">
          <div class="item-desc product-name">${escapeHtml(it.desc)}</div>
          <div class="item-qty">${escapeHtml(String(it.qty || 0))}</div>
          <div class="item-prc">${Number(it.price || it.amount / (it.qty || 1) || 0).toFixed(2)}</div>
          <div class="item-amt">${Number(it.amount || 0).toFixed(2)}</div>
        </div>
      `).join("")}
      <div class="divider"></div>
      <div class="total-row">
        <div style="padding-right:10px; font-weight:normal">Total:</div>
        <div style="width:60px; text-align:right;">${fmt(cartTotal)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <div class="label" style="font-size:11px;">Amount:</div>
        <div style="text-align:right;font-size:11px;">${fmt(amount)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px">
        <div class="label" style="font-size:11px;">Change:</div>
        <div style="text-align:right;font-size:11px;">${fmt(change)}</div>
      </div>
      <div class="points-row">
        Customer Points: ${typeof points === "number" ? points : "0"}
      </div>
      <div class="divider"></div>
      <div class="footer">THANK YOU — GATANG KA MANEN!</div>
      <div class="customer-copy">Customer Copy<br/>For customer reference only.<br/>This document is not valid as a BIR Official Receipt.</div>
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

    // OPTIMIZED: More accurate height calculation
    const estimatedHeight = Math.max(600, data.items.length * 18 + 300); // 18px per item + 300px for headers/footers

    // viewport width for 82mm at 203 DPI (1mm ≈ 7.99px)
    const widthPx = Math.round(82 * 7.99);
    await page.setViewport({ width: widthPx, height: estimatedHeight });

    // render and wait for fonts/resources
    await page.setContent(html, { waitUntil: "networkidle0" });

    // OPTIMIZED: More precise height measurement
    const paperHeightPx = await page.evaluate(() => {
      const el = document.getElementById('receipt') || document.querySelector('.paper') || document.body;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const mt = parseFloat(style.marginTop || 0);
      const mb = parseFloat(style.marginBottom || 0);
      const pt = parseFloat(style.paddingTop || 0);
      const pb = parseFloat(style.paddingBottom || 0);
      return Math.ceil(rect.height + mt + mb + pt + pb);
    });

    // OPTIMIZED: More accurate conversion with minimal padding
    const pxToMm = 25.4 / 203;
    let heightMm = Math.ceil(paperHeightPx * pxToMm) + 2; // REDUCED extra padding from 5mm to 2mm

    // OPTIMIZED: Better height limits
    const MIN_HEIGHT_MM = 30; // REDUCED from 40mm
    const MAX_HEIGHT_MM = Math.max(3000, data.items.length * 6 + 150); // 6mm per item + 150mm for headers

    if (heightMm < MIN_HEIGHT_MM) heightMm = MIN_HEIGHT_MM;
    if (heightMm > MAX_HEIGHT_MM) heightMm = MAX_HEIGHT_MM;

    console.log(`Receipt: ${data.items.length} items, ${heightMm}mm height`); // Debug info

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: "82mm",
      height: `${heightMm}mm`,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });

    await page.close();

    const filename = `receipt-${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", Buffer.byteLength(pdfBuffer));
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition,Content-Length");
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "PDF generation failed", details: String(err) });
  }
}

// NEW: Test endpoint for bulk receipt testing
exports.testBulkReceipt = async function (req, res) {
  try {
    // Generate 100 sample items for testing
    const sampleItems = [];
    const sampleProducts = [
      "SHANGHAI KIKIAM 500G",
      "JACK N JILL CHICHARON NI MANG JUAN ESPESYAL SUKA'T SILI 00G",
      "OISHI SWEET & EXTRA HOT 90G",
      "OISHI PRAN CRACKERS HOT & SPICY 90G",
      "SUPER CRUNCH CORCHTPS CHEFSF 120G",
      "CHEEZ IT CHEESE & HAM BOG",
      "PEE WEE BBQ 25G",
      "TATTAR THINS CUCUMBER 75G",
      "DISHIH MARTYS CRACKLING CHK INASAL 90G",
      "MARTYS CRACI TN SALT AND VINEGAR 90G",
      "CHEEZY WHITE CHEDAR 40G",
      "CHEEZY CHEESE 70G",
      "MARTY'S CRACKLIN 90G",
      "COMBELL EVAPSARAP 380ML",
      "PAMINTA",
      "KNORR CUBES CHICKEN 18G",
      "STAR MARGARINE CLASSIC 100G",
      "PAPA BANANA KETCHUP SWEET SARAP 200G",
      "MANA SLIA'S ORIGINAL OYSTER SAUCE 60G",
      "BABBLE JOE BUBBLE GUM 25PCS 109G",
      "BABBLE JOE STRAWBERRY 100G",
      "BABBLE JOE ORANGE 100G",
      "MENTOS MINT MINI ROLLS 200G",
      "MENTOS ASSORTED FRUITS MINI ROLLS",
      "MENTOS STRAWBERRY",
      "555 SARDINES IN TOMATO SAUCE ORIG. 155g",
      "IB BAGOONG 320ML",
      "PUTI BOTTLE 385ML",
      "ORIGINAL 3 IN 1 36G",
      "MARSHMALLOW 28G"
    ];

    for (let i = 0; i < 30; i++) { // CHANGED from 200 to 150
      const productIndex = i % sampleProducts.length;
      const qty = Math.floor(Math.random() * 10) + 1; // Random quantity 1-10
      const price = Math.floor(Math.random() * 50) + 10; // Random price 10-60
      const amount = qty * price;

      sampleItems.push({
        desc: sampleProducts[productIndex],
        qty: qty,
        price: price,
        amount: amount
      });
    }

    const totalAmount = sampleItems.reduce((sum, item) => sum + item.amount, 0);

    const testData = {
      customer: { name: "TEST CUSTOMER", points: 1500 },
      cartTotal: totalAmount,
      amount: totalAmount,
      change: 0,
      points: 1500,
      items: sampleItems
    };

    const html = renderHtml(testData);

    const browser = await getBrowser();
    const page = await (await browser).newPage();

    // Dynamic viewport height based on number of items
    const estimatedHeight = Math.max(600, testData.items.length * 18 + 300);
    const widthPx = Math.round(82 * 7.99);

    await page.setContent(html, { waitUntil: "networkidle0" });

    // FIXED: Measure actual content height precisely
    const paperHeightPx = await page.evaluate(() => {
      const el = document.getElementById('receipt') || document.querySelector('.paper') || document.body;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const mt = parseFloat(style.marginTop || 0);
      const mb = parseFloat(style.marginBottom || 0);
      const pt = parseFloat(style.paddingTop || 0);
      const pb = parseFloat(style.paddingBottom || 0);
      return Math.ceil(rect.height + mt + mb + pt + pb);
    });

    // FIXED: Get precise content height by measuring the last element
    const contentHeightPx = await page.evaluate(() => {
      const receipt = document.getElementById('receipt');
      if (!receipt) return 0;
      
      // Find the last visible element (customer-copy)
      const lastElement = receipt.querySelector('.customer-copy');
      if (!lastElement) return 0;
      
      const receiptRect = receipt.getBoundingClientRect();
      const lastElementRect = lastElement.getBoundingClientRect();
      
      // Calculate height from top of receipt to bottom of last element
      return Math.ceil(lastElementRect.bottom - receiptRect.top);
    });

    // Convert to mm with minimal thermal printer allowance
    const pxToMm = 25.4 / 203;
    let heightMm = Math.ceil(contentHeightPx * pxToMm) + 5; // Only 5mm for thermal printer safety

    // FIXED: Much more aggressive height limits
    const MIN_HEIGHT_MM = 30;
    const MAX_HEIGHT_MM = Math.max(200, testData.items.length * 1.5 + 50); // MUCH more conservative: 1.5mm per item + 50mm
    
    if (heightMm < MIN_HEIGHT_MM) heightMm = MIN_HEIGHT_MM;
    if (heightMm > MAX_HEIGHT_MM) heightMm = MAX_HEIGHT_MM;

    console.log(`Test Receipt: ${testData.items.length} items, ${heightMm}mm height (content: ${Math.ceil(contentHeightPx * pxToMm)}mm, max allowed: ${MAX_HEIGHT_MM}mm)`);

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: "82mm",
      height: `${heightMm}mm`, // FIXED: Use calculated height, not "auto"
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
      // NEW: Optimize for thermal printers
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    await page.close();

    const filename = `test-bulk-receipt-150-items.pdf`; // CHANGED from 200 to 150
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", Buffer.byteLength(pdfBuffer));
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition,Content-Length");
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Test PDF generation error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Test PDF generation failed", details: String(err) });
  }
};