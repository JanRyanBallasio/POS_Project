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

// Get backend URL with better environment detection
function getBackendUrl() {
  if (isTauri()) {
    // For Tauri apps, always use localhost since backend runs locally
    return 'http://localhost:5000';
  }
  
  // For web browser - use your AWS backend URL
  return process.env.NODE_ENV === 'production' 
    ? 'http://3.107.238.186:5000'  // Your AWS server IP
    : 'http://localhost:5000';
}

export function usePrint() {
  // Enhanced connection test with retry logic
  const testConnection = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[PRINT] Testing connection attempt ${i + 1}/${retries}`);
        const res = await fetch(`${getBackendUrl()}/api/print/enhanced/test`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        const result = await res.json();
        console.log('[PRINT] Connection test successful:', result);
        return result;
      } catch (error: any) {
        console.warn(`[PRINT] Connection test attempt ${i + 1} failed:`, error.message);
        
        if (i === retries - 1) {
          throw new Error(`Cannot connect to print server after ${retries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // Get available printers
  const getAvailablePrinters = async (): Promise<Printer[]> => {
    try {
      console.log('[PRINT] Fetching available printers...');
      const res = await fetch(`${getBackendUrl()}/api/print/enhanced/printers`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      
      const result = await res.json();
      console.log('[PRINT] Available printers:', result);
      return result.printers || [];
    } catch (error: any) {
      console.error('[PRINT] Failed to get printers:', error);
      return [{ name: 'Default Printer', status: 'Available', isDefault: true }];
    }
  };

  const printReceipt = async (data: PrintPayload) => {
    if (isTauri()) {
      try {
        console.log('[PRINT] Starting enhanced print process...');
        
        // Test connection first
        await testConnection();
        
        // Validate data
        if (!data.items || data.items.length === 0) {
          throw new Error("No items to print");
        }

        // Ensure all required fields are present
        const sanitizedData = {
          store: data.store || { name: "YZY STORE", address1: "Eastern Slide, Tuding" },
          customer: data.customer || { name: "N/A" },
          cartTotal: Number(data.cartTotal || 0),
          amount: Number(data.amount || 0),
          change: Number(data.change || 0),
          points: Number(data.points || 0),
          items: data.items.map(item => ({
            desc: String(item.desc || ''),
            qty: Number(item.qty || 0),
            price: Number(item.price || 0),
            amount: Number(item.amount || 0)
          })),
          printerName: data.printerName || null
        };

        console.log('[PRINT] Sending sanitized data:', {
          itemCount: sanitizedData.items.length,
          total: sanitizedData.cartTotal,
          customer: sanitizedData.customer.name,
          printer: sanitizedData.printerName || 'default'
        });

        const res = await fetch(`${getBackendUrl()}/api/print/enhanced`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(sanitizedData),
          signal: AbortSignal.timeout(30000) // 30 second timeout for printing
        });
        
        console.log('[PRINT] Backend response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error('[PRINT] Backend error response:', errorText);
          throw new Error(`Print failed (${res.status}): ${errorText}`);
        }
        
        const result = await res.json();
        console.log('[PRINT] Print successful:', result);
        return result;
        
      } catch (error: any) {
        console.error('[PRINT] Print error:', error);
        
        // Provide user-friendly error messages
        if (error.name === 'AbortError') {
          throw new Error("Print request timed out. Please check your printer connection.");
        }
        if (error.message.includes('fetch')) {
          throw new Error("Cannot connect to print server. Please ensure the backend is running.");
        }
        
        throw new Error(`Print failed: ${error.message}`);
      }
    } else {
      throw new Error("Printing is only supported in the desktop app");
    }
  };

  return { 
    printReceipt, 
    testConnection, 
    getAvailablePrinters,
    isTauri: isTauri(),
    backendUrl: getBackendUrl()
  };
}