// pos-frontend/src/hooks/printing/usePrint.ts
import { invoke } from '@tauri-apps/api/core';

export type PrintItem = { desc: string; qty: number; price?: number; amount: number };
export type PrintPayload = {
  store?: { name?: string; address1?: string; address2?: string };
  customer?: { name?: string | null };
  cartTotal: number;
  amount: number;
  change: number;
  points?: number;
  items: PrintItem[];
  printerName?: string | null;
};

export type Printer = {
  name: string;
  status: string;
  isDefault: boolean;
};

// Check if running in Tauri
function isTauri() {
  return typeof window !== 'undefined' && (window as any).__TAURI__;
}

// Helper functions matching the backend
function padLeft(s: string | number, len: number): string {
  const str = String(s ?? '');
  return str.length >= len ? str.slice(0, len) : ' '.repeat(len - str.length) + str;
}

function padRight(s: string | number, len: number): string {
  const str = String(s ?? '');
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

function centerText(text: string | number, width: number): string {
  const str = String(text ?? '');
  if (str.length >= width) return str;
  const left = Math.floor((width - str.length) / 2);
  const right = width - str.length - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
}

// Generate ESC/POS receipt content matching your backend EXACTLY
function generateESCPOSReceipt(data: PrintPayload): string {
  const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' });
  const LINE_WIDTH = 48; // 80mm printer width

  let r = '';
  r += '\x1B\x40'; // init
  r += '\x1B\x74\x00'; // encoding
  r += '\x1B\x61\x01'; // center

  // Store info centered - add store name
  if (data.store?.name) r += centerText(data.store.name, LINE_WIDTH) + '\n';
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
    // Add Peso symbol to price
    const price = padLeft(`P${(it.price ?? (it.amount || 0) / Math.max(1, it.qty || 1)).toFixed(2)}`, 10);
    const amount = padLeft(`P${(it.amount || 0).toFixed(2)}`, 10);

    r += padRight(lines[0], 24) + qty + price + amount + '\n';
    for (let i = 1; i < lines.length; i++) {
      r += padRight(lines[i], 24) + '\n';
    }
    // Add extra spacing for readability
    r += '\n';
  }

  r += ''.padEnd(LINE_WIDTH, '-') + '\n';
  // Add Peso symbols to totals
  r += padLeft('TOTAL:', 38) + padLeft(`P${(data.cartTotal || 0).toFixed(2)}`, 10) + '\n';
  r += padLeft('AMOUNT:', 38) + padLeft(`P${(data.amount || 0).toFixed(2)}`, 10) + '\n';
  r += padLeft('CHANGE:', 38) + padLeft(`P${(data.change || 0).toFixed(2)}`, 10) + '\n';
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

export function usePrint() {
  const printReceipt = async (data: PrintPayload) => {
    if (!isTauri()) {
      throw new Error("Direct printing is only available in the desktop app");
    }

    try {
      console.log('[DIRECT PRINT] Starting direct print process...');
      
      // Validate data
      if (!data.items || data.items.length === 0) {
        throw new Error("No items to print");
      }

      // Generate ESC/POS receipt content
      const receiptContent = generateESCPOSReceipt(data);
      
      console.log('[DIRECT PRINT] Generated receipt content, length:', receiptContent.length);
      console.log('[DIRECT PRINT] Items:', data.items.length);

      // Call Tauri command directly
      const result = await invoke<string>('print_receipt_direct', {
        receiptData: receiptContent,
        itemCount: data.items.length,
        printerName: data.printerName || null
      });

      console.log('[DIRECT PRINT] Print successful:', result);
      return result;
      
    } catch (error: any) {
      console.error('[DIRECT PRINT] Print error:', error);
      throw new Error(`Print failed: ${error.message || error}`);
    }
  };

  const testConnection = async () => {
    if (!isTauri()) {
      throw new Error("Test connection only available in desktop app");
    }
    
    // Test with sample data matching Image 2
    const testData: PrintPayload = {
      store: { name: "YZY", address1: "Eastern Slide, Tuding" },
      customer: { name: "N/A" },
      cartTotal: 23.00,
      amount: 50.00,
      change: 27.00,
      points: 0,
      items: [
        {
          desc: "Debug Product 1",
          qty: 1,
          price: 10.00,
          amount: 10.00
        },
        {
          desc: "MAGIC SARAP TRIPID 21G",
          qty: 1,
          price: 13.00,
          amount: 13.00
        }
      ]
    };

    return await printReceipt(testData);
  };

  const getAvailablePrinters = async (): Promise<Printer[]> => {
    // For direct printing, we just return default printer
    return [{ name: 'Default Printer', status: 'Available', isDefault: true }];
  };

  return { 
    printReceipt, 
    testConnection, 
    getAvailablePrinters,
    isTauri: isTauri(),
    isDirect: true
  };
}