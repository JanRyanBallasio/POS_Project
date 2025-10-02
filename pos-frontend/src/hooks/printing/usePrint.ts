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

// Generate ESC/POS receipt content matching the image format
function generateESCPOSReceipt(data: PrintPayload): string {
  let commands = '';
  
  // Initialize printer
  commands += '\x1B\x40'; // ESC @
  
  // Header - Center aligned with logo placeholder
  commands += '\x1B\x61\x01'; // Center
  commands += '\x1B\x45\x01'; // Bold on
  commands += 'YZY\n'; // Logo text
  commands += '\x1B\x45\x00'; // Bold off
  commands += '\n';
  commands += `${data.store?.address1 || 'Eastern Slide, Tuding'}\n`;
  commands += '\n';
  
  // Left align for content
  commands += '\x1B\x61\x00'; // Left
  
  // Customer and date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  });
  
  const customerName = data.customer?.name || 'N/A';
  commands += `Customer: ${customerName}\n`;
  commands += `Date: ${date}\n`;
  commands += '--------------------------------\n';
  
  // Items header - matching the image format
  commands += 'Item                 QTY  Price  Amount\n';
  commands += '--------------------------------\n';
  
  // Items - format to match the image
  data.items.forEach((item) => {
    const desc = item.desc.length > 20 
      ? item.desc.substring(0, 17) + '...' 
      : item.desc.padEnd(20);
    
    const qty = item.qty.toString().padStart(3);
    const price = (item.price || 0).toFixed(2).padStart(6);
    const amount = item.amount.toFixed(2).padStart(7);
    
    commands += `${desc} ${qty} ${price} ${amount}\n`;
  });
  
  // Totals section - matching the image
  commands += '--------------------------------\n';
  commands += `                       TOTAL: ${data.cartTotal.toFixed(2).padStart(7)}\n`;
  commands += `                      AMOUNT: ${data.amount.toFixed(2).padStart(7)}\n`;
  commands += `                      CHANGE: ${data.change.toFixed(2).padStart(7)}\n`;
  commands += '--------------------------------\n';
  
  if (data.points !== undefined && data.points > 0) {
    commands += `Customer Points: ${data.points}\n`;
    commands += '--------------------------------\n';
  }
  
  // Footer - matching the image
  commands += '\n';
  commands += '\x1B\x61\x01'; // Center align
  commands += 'CUSTOMER COPY - NOT AN OFFICIAL RECEIPT\n';
  commands += 'THANK YOU - GATANG KA MANEN!\n';
  commands += '\x1B\x61\x00'; // Left align
  
  // Cut paper
  commands += '\n\n';
  commands += '\x1B\x64\x03'; // Feed 3 lines
  commands += '\x1D\x56\x00'; // Full cut
  
  return commands;
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
    
    // Test with sample data
    const testData: PrintPayload = {
      store: { name: "YZY STORE", address1: "Eastern Slide, Tuding" },
      customer: { name: "Test Customer" },
      cartTotal: 10.00,
      amount: 10.00,
      change: 0.00,
      points: 0,
      items: [
        {
          desc: "Debug Product 1",
          qty: 1,
          price: 10.00,
          amount: 10.00
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