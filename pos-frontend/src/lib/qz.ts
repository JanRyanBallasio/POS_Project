// Lightweight QZ Tray wrapper with lazy loading
// Usage: await initQZ(); await setPrinterByName('YOUR_PRINTER'); await printRaw(escposBytes);
let qzReady = false;

function qzLib(): any {
  // @ts-ignore
  return (window as any).qz;
}

async function loadQZScript(): Promise<void> {
  if (qzLib()) return;

  // Avoid duplicate loads
  const existing = document.querySelector('script[data-qz]') as HTMLScriptElement | null;
  if (existing) {
    // If QZ is already attached, we’re done
    if (qzLib()) return;

    // Otherwise wait for the existing tag to finish loading
    await new Promise<void>((resolve) => {
      existing.addEventListener('load', () => resolve(), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/vendor/qz-tray.js'; // served from Next public/
    s.async = true;
    s.defer = true;
    s.dataset.qz = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load /vendor/qz-tray.js'));
    document.head.appendChild(s);
  });
}

export async function initQZ() {
  if (qzReady) return;
  await loadQZScript();
  const qz = qzLib();
  if (!qz) throw new Error('QZ Tray library not available. Is QZ Tray running?');

  // In dev you can allow unsigned; in prod you should set certificate/signing
  qz.api.setPromiseType((p: any) => new Promise(p));
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
  qzReady = true;
}

export async function setPrinterByName(name: string) {
  const qz = qzLib();
  if (!qzReady) await initQZ();
  const cfg = qz.configs.create(name, {
    encoding: 'binary',
    rasterize: false,
  });
  // @ts-ignore
  (window as any).__qz_cfg = cfg;
  return cfg;
}

export async function printRaw(data: Uint8Array) {
  const qz = qzLib();
  if (!qzReady) await initQZ();
  // @ts-ignore
  const cfg = (window as any).__qz_cfg || qz.configs.create(null, { encoding: 'binary', rasterize: false });
  const bytes = Array.from(data);
  return qz.print(cfg, [{ type: 'raw', format: 'command', data: bytes }]);
}

export async function getPrinters(): Promise<string[]> {
  const qz = qzLib();
  if (!qzReady) await initQZ();
  return qz.printers.find();
}

export async function getDefaultPrinter(): Promise<string | null> {
  const qz = qzLib();
  if (!qzReady) await initQZ();
  try {
    return await qz.printers.getDefault();
  } catch {
    return null;
  }
}