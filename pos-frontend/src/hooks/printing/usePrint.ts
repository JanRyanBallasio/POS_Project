import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
// NEW: QZ Tray helpers
import { initQZ, setPrinterByName, printRaw as qzPrintRaw, getDefaultPrinter } from '@/lib/qz';

type PrintData = {
  store?: { name?: string; address1?: string; address2?: string };
  customer?: { name?: string | null };
  cartTotal: number;
  amount: number;
  change: number;
  points?: number;
  items: Array<{ desc: string; qty: number; price?: number; amount: number }>;
};

function genId() {
  return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function persistPrintPayload(id: string, data: PrintData) {
  localStorage.setItem(`print:${id}`, JSON.stringify(data));
}

function removePrintPayload(id: string) {
  try { localStorage.removeItem(`print:${id}`); } catch { }
}

export function usePrint() {
  const openPrintPreview = async (data: PrintData) => {
    const id = genId();
    persistPrintPayload(id, data);

    const label = `print-preview-${id}`;
    const win = new WebviewWindow(label, {
      title: 'Print Preview',
      url: `/print/receipt?id=${id}`,
      width: 420,
      height: 800,
      resizable: true,
      center: true,
      visible: true,

    });
    win.once('tauri://created', () => console.log('Print preview window created:', label));
    win.once('tauri://error', (e) => {
      console.error('Failed to create print preview window:', e);
      alert('Failed to open print preview window. Check Tauri capabilities.');
    });
    win.once('tauri://destroyed', () => removePrintPayload(id));
    return win;
  };

  // Existing native direct printing via Tauri command (fallback)
  const printDirect = async (escposData: string, itemCount: number, printerName?: string) => {
    await invoke('print_receipt_direct', {
      receipt_data: escposData,
      item_count: itemCount,
      printer_name: printerName ?? null,
    });
  };

  // NEW: QZ Tray direct raw printing
  const printViaQZ = async (escposData: string, preferredPrinter?: string) => {
    await initQZ();
    const target = preferredPrinter || (await getDefaultPrinter()) || '';
    await setPrinterByName(target);
    // Convert string to Uint8Array for raw ESC/POS
    const buf = new TextEncoder().encode(escposData);
    await qzPrintRaw(buf);
  };

  return { openPrintPreview, printDirect, printViaQZ };
}