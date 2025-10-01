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

// Check if running in Tauri
function isTauri() {
  return typeof window !== 'undefined' && (window as any).__TAURI__;
}

// Get backend URL for Tauri app
function getBackendUrl() {
  if (isTauri()) {
    // Use your specific backend URL WITHOUT /api
    return 'http://3.107.238.186:5000';
  }
  // For web, use the existing logic
  return 'http://localhost:5000';
}

export function usePrint() {
  // ✅ Add connection test function
  const testConnection = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/print/test`);
      if (!res.ok) throw new Error(`Connection test failed: ${res.status}`);
      return await res.json();
    } catch (error) {
      throw new Error(`Cannot connect to print server: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const printReceipt = async (data: PrintPayload) => {
    if (isTauri()) {
      // Use backend API to get logo support
      try {
        // ✅ Test connection first
        await testConnection();
        
        // ✅ Validate data before sending
        if (!data.items || data.items.length === 0) {
          throw new Error("No items to print");
        }

        console.log('[PRINT] Sending data to backend:', {
          items: data.items.length,
          total: data.cartTotal,
          customer: data.customer?.name
        });

        const res = await fetch(`${getBackendUrl()}/print/receipt`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(data),
        });
        
        console.log('[PRINT] Backend response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error('[PRINT] Backend error:', errorText);
          throw new Error(`Print failed: ${res.status} ${errorText}`);
        }
        
        const result = await res.json();
        console.log('[PRINT] Backend success:', result);
        return result;
      } catch (error: any) {
        console.error('[PRINT] Error details:', error);
        // ✅ Better error handling
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error("Cannot connect to print server. Please check your connection.");
        }
        throw new Error(`Print failed: ${error.message || String(error)}`);
      }
    } else {
      // Web browser fallback
      throw new Error("Printing not supported in web browser");
    }
  };

  return { printReceipt, testConnection };
}