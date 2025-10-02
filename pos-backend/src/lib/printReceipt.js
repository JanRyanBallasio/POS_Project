const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const os = require('os');

function padLeft(s, len) {
  const str = String(s ?? '');
  return str.length >= len ? str.slice(0, len) : ' '.repeat(len - str.length) + str;
}
function padRight(s, len) {
  const str = String(s ?? '');
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}
function centerText(text, width) {
  const str = String(text ?? '');
  if (str.length >= width) return str;
  const left = Math.floor((width - str.length) / 2);
  const right = width - str.length - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
}

async function loadLogoAsRaster(filePath, targetWidth = 144) {
  if (!fs.existsSync(filePath)) return Buffer.alloc(0);
  const img = await loadImage(filePath);
  const width = targetWidth;
  const scale = width / img.width;
  const height = Math.max(1, Math.floor(img.height * scale));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const bytes = [];
  bytes.push(0x1D, 0x76, 0x30, 0x00, (width >> 3) & 0xFF, (width >> 3) >> 8, height & 0xFF, (height >> 8) & 0xFF);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let b = 0; b < 8; b++) {
        const i = ((y * width) + (x + b)) * 4;
        const r = data[i], g = data[i + 1], bch = data[i + 2], a = data[i + 3];
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bch;
        const isBlack = (a > 32) && (luma < 160);
        if (isBlack) byte |= (0x80 >> b);
      }
      bytes.push(byte);
    }
  }
  return Buffer.from(bytes);
}

function buildEscposReceipt(data) {
  const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' });
  const LINE_WIDTH = 48; // 80mm printer width

  let r = '';
  r += '\x1B\x40'; // init
  r += '\x1B\x74\x00'; // encoding
  r += '\x1B\x61\x01'; // center

  // Store info centered
  if (data.store?.address1) r += centerText(data.store.address1, LINE_WIDTH) + '\n';
  if (data.store?.address2) r += centerText(data.store.address2, LINE_WIDTH) + '\n';
  r += '\n';

  // Left align
  r += '\x1B\x61\x00';
  r += `Customer: ${data.customer?.name || 'N/A'}\n`;
  r += `Date: ${dateStr}\n`;
  r += ''.padEnd(LINE_WIDTH, '-') + '\n';

  // Table header (24 + 4 + 10 + 10 = 48)
  r += padRight('Item', 24) + padLeft('QTY', 4) + padLeft('Price', 10) + padLeft('Amount', 10) + '\n';
  r += ''.padEnd(LINE_WIDTH, '-') + '\n';

  // Items
  const items = Array.isArray(data.items) ? data.items : [];
  for (const it of items) {
    const name = String(it.desc || '').trim();
    const lines = [];
    for (let i = 0; i < name.length; i += 24) lines.push(name.slice(i, i + 24));

    const qty = padLeft(it.qty || 0, 4);
    const price = padLeft(`${(it.price ?? (it.amount || 0) / Math.max(1, it.qty || 1)).toFixed(2)}`, 10);
    const amount = padLeft(`${(it.amount || 0).toFixed(2)}`, 10);

    r += padRight(lines[0], 24) + qty + price + amount + '\n';
    for (let i = 1; i < lines.length; i++) {
      r += padRight(lines[i], 24) + '\n';
    }
    // ✅ add extra spacing for readability
    r += '\n';
  }

  r += ''.padEnd(LINE_WIDTH, '-') + '\n';
  r += padLeft('TOTAL:', 38) + padLeft(`${(data.cartTotal || 0).toFixed(2)}`, 10) + '\n';
  r += padLeft('AMOUNT:', 38) + padLeft(`${(data.amount || 0).toFixed(2)}`, 10) + '\n';
  r += padLeft('CHANGE:', 38) + padLeft(`${(data.change || 0).toFixed(2)}`, 10) + '\n';
  r += ''.padEnd(LINE_WIDTH, '-') + '\n';
  r += `Customer Points: ${Number(data.points || 0)}\n`;
  r += ''.padEnd(LINE_WIDTH, '-') + '\n\n';

  // Footer
  r += '\x1B\x61\x01';
  r += 'CUSTOMER COPY - NOT AN OFFICIAL RECEIPT\n';
  r += 'THANK YOU - GATANG KA MANEN!\n';
  r += '\x1B\x61\x00';
  r += '\n\n';
  r += '\x1B\x64\x07'; // feed
  r += '\x1D\x56\x00'; // cut

  return r;
}

async function printViaRawSpooler(bytes, printerName) {
  const tmp = path.join(process.cwd(), `receipt_${Date.now()}.bin`);
  fs.writeFileSync(tmp, bytes);

  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: Use PowerShell with C# code
    const safePath = tmp.replace(/'/g, "''");
    const printerExpr = printerName && String(printerName).trim().length
      ? `'${String(printerName).replace(/'/g, "''")}'`
      : '(Get-CimInstance Win32_Printer | Where-Object {$_.Default -eq $true}).Name';

    const ps = `
$ErrorActionPreference = 'Stop'
$path = '${safePath}'
$bytes = [System.IO.File]::ReadAllBytes($path)
Add-Type -Language CSharp -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinterHelper {
  [StructLayout(LayoutKind.Sequential)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDatatype;
  }
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
}
public class RawPrint {
  public static void SendBytes(string printerName, byte[] bytes) {
    IntPtr h;
    if (!RawPrinterHelper.OpenPrinter(printerName, out h, IntPtr.Zero)) throw new Exception("OpenPrinter failed");
    var di = new RawPrinterHelper.DOCINFOA() { pDocName = "ESC/POS", pDatatype = "RAW" };
    if (!RawPrinterHelper.StartDocPrinter(h, 1, di)) throw new Exception("StartDocPrinter failed");
    if (!RawPrinterHelper.StartPagePrinter(h)) throw new Exception("StartPagePrinter failed");
    int written;
    if (!RawPrinterHelper.WritePrinter(h, bytes, bytes.Length, out written)) throw new Exception("WritePrinter failed");
    RawPrinterHelper.EndPagePrinter(h);
    RawPrinterHelper.EndDocPrinter(h);
    RawPrinterHelper.ClosePrinter(h);
  }
}
"@
$target = ${printerExpr}
if (-not $target) { throw 'No target printer'; }
[RawPrint]::SendBytes($target, $bytes)
`;

    await new Promise((resolve, reject) => {
      const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps]);
      let stderr = '', stdout = '';
      child.stdout.on('data', (d) => stdout += d.toString());
      child.stderr.on('data', (d) => stderr += d.toString());
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`WritePrinter failed (exit ${code}) ${stderr || stdout}`));
      });
    });
  } else {
    // Linux/Unix: Use lp command
    const printerCmd = printerName && String(printerName).trim().length
      ? String(printerName)
      : ''; // Use default printer

    const cmd = printerCmd ? ['lp', '-d', printerCmd, tmp] : ['lp', tmp];

    await new Promise((resolve, reject) => {
      const child = spawn(cmd[0], cmd.slice(1));
      let stderr = '', stdout = '';
      child.stdout.on('data', (d) => stdout += d.toString());
      child.stderr.on('data', (d) => stderr += d.toString());
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Print failed (exit ${code}) ${stderr || stdout}`));
      });
    });
  }

  try { fs.unlinkSync(tmp); } catch { }
}

async function printReceipt(data, opts = {}) {
  const logoPath = path.join(process.cwd(), 'assets/logo.png');
  const maxDots = 576; // fixed for 80mm printers
  let logoWidth = 144; // force 144px logo
  logoWidth = Math.max(64, Math.min(logoWidth, maxDots));
  logoWidth = logoWidth - (logoWidth % 8);

  const logoBuf = await loadLogoAsRaster(logoPath, logoWidth).catch(() => Buffer.alloc(0));
  const text = Buffer.from(buildEscposReceipt(data), 'binary');

  // ✅ no extra linefeed after logo
  const bytes = Buffer.concat([
    Buffer.from('\x1B\x40', 'binary'),      // init
    Buffer.from('\x1B\x33\x00', 'binary'),  // ✅ set line spacing = 0 (removes top gap)
    Buffer.from('\x1B\x61\x01', 'binary'),  // center alignment
    logoBuf,                                // print logo centered
    Buffer.from('\x1B\x32', 'binary'),      // ✅ restore default line spacing after logo
    Buffer.from('\x1B\x61\x01', 'binary'),  // keep center for store info
    text
  ]);
  console.log('[PRINT] bytes', bytes.length, 'printer', opts.printerName || '(default)');
  await printViaRawSpooler(bytes, opts.printerName || null);
  return { success: true };
}

module.exports = { printReceipt };
