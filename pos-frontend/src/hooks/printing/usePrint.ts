// pos-frontend/src/hooks/printing/usePrint.ts
export type PrintItem = { desc: string; qty: number; price?: number; amount: number };
export type PrintPayload = {
  store?: { name?: string; address1?: string; address2?: string };
  customer?: { name?: string | null };
  cartTotal: number;
  amount: number;
  change: number;
  points?: number;
  items: PrintItem[];
  printerName?: string | null; // optional override; default printer if omitted
};

function getBase() {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const origin = window.location.origin || '';
  return origin.includes('localhost') ? 'http://localhost:5000' : origin;
}

export function usePrint() {
  const base = getBase();

  const printReceipt = async (data: PrintPayload) => {
    const res = await fetch(`${base.replace(/\/$/, '')}/print/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Print failed: ${res.status} ${t}`);
    }
    return res.json();
  };

  const listPrinters = async (): Promise<string[]> => {
    const res = await fetch(`${base.replace(/\/$/, '')}/print/printers`);
    if (!res.ok) return [];
    const j = await res.json().catch(() => ({} as any));
    return Array.isArray(j.printers) ? j.printers : [];
  };

  return { printReceipt, listPrinters };
}