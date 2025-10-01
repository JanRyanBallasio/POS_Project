// pos-frontend/src/app/print/receipt/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import PrintReceipt from "@/components/printing/PrintReceipt";
import { invoke } from '@tauri-apps/api/core';
import { buildEscposReceipt } from '../../../lib/escpos';

type ReceiptItem = { desc: string; qty: number; price?: number; amount: number };
type Data = {
  store?: { name?: string; address1?: string; address2?: string };
  customer?: { name?: string | null };
  cartTotal: number;
  amount: number;
  change: number;
  points?: number;
  items: ReceiptItem[];
};

export default function ReceiptPage() {
  const [data, setData] = useState<Data | null>(null);
  const [printers, setPrinters] = useState<string[]>([]);
  const [printerName, setPrinterName] = useState<string | null>(null);

  const id = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("id") || "";
  }, []);

  // Load data and bind keyboard print
  useEffect(() => {
    if (!id) return;
    try {
      const key = `print:${id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Data;
        setData(parsed);

        const onKey = async (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            e.stopPropagation();
            try {
              const esc = buildEscposReceipt(parsed);
              const pn = localStorage.getItem('print:defaultPrinter') || null;
              await invoke('print_receipt_direct', { receiptData: esc, itemCount: parsed.items.length, printerName: pn });
              try { localStorage.removeItem(key); } catch {}
              window.close();
            } catch (err: any) {
              alert(err?.message || String(err));
            }
          }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }
    } catch (e) {
      console.error("Failed to load print data:", e);
    }
  }, [id]);

  // Load printers and pick last saved or default
  useEffect(() => {
    (async () => {
      try {
        const list = await invoke<string[]>('list_printers').catch(() => []);
        setPrinters(Array.isArray(list) ? list : []);
        const saved = localStorage.getItem('print:defaultPrinter') || '';
        if (saved && list && (list as string[]).includes(saved)) {
          setPrinterName(saved);
        } else {
          const def = await invoke<string>('get_default_printer_name').catch(() => '');
          setPrinterName(def || null);
        }
      } catch {}
    })();
  }, []);

  if (!id || !data) {
    return <div style={{ padding: 16, fontFamily: "sans-serif" }}><p>Loading receipt...</p></div>;
  }

  return (
    <>
      <PrintReceipt
        store={{ name: data.store?.name ?? "YZY STORE", address1: data.store?.address1 ?? "Eastern Slide, Tuding", address2: data.store?.address2 }}
        customer={data.customer}
        date={undefined}
        items={data.items}
        cartTotal={data.cartTotal}
        amount={data.amount}
        change={data.change}
        points={data.points}
      />
      <div className="no-print" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={printerName ?? ''}
          onChange={(e) => setPrinterName(e.target.value || null)}
          style={{ height: 32, minWidth: 260 }}
        >
          <option value="">Default printer</option>
          {printers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => { if (printerName) localStorage.setItem('print:defaultPrinter', printerName); }}>Set as default</button>
        <button onClick={async () => {
          try {
            const esc = buildEscposReceipt(data);
            await invoke('print_receipt_direct', { receiptData: esc, itemCount: data.items.length, printerName: printerName ?? null });
            try { localStorage.removeItem(`print:${id}`); } catch {}
            window.close();
          } catch (e: any) { alert(e?.message || String(e)); }
        }}>Print (Thermal, ESC/POS)</button>
        <button onClick={() => window.print()}>System Print (A4/Graphic)</button>
        <button onClick={() => window.close()}>Close</button>
      </div>
    </>
  );
}