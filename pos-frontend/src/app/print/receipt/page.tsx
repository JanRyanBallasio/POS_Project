"use client";

import React, { useEffect, useMemo, useState } from "react";
import PrintReceipt from "@/components/printing/PrintReceipt";

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
  const id = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("id") || "";
  }, []);

  useEffect(() => {
    if (!id) return;
    try {
      const key = `print:${id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Data;
        setData(parsed);
        const t = setTimeout(() => {
          try { window.print(); } catch {}
        }, 250);

        const handleAfterPrint = () => {
          try { localStorage.removeItem(key); } catch {}
          setTimeout(() => window.close(), 150);
        };
        window.addEventListener("afterprint", handleAfterPrint, { once: true });

        return () => {
          clearTimeout(t);
          window.removeEventListener("afterprint", handleAfterPrint);
        };
      }
    } catch (e) {
      console.error("Failed to load print data:", e);
    }
  }, [id]);

  if (!id || !data) {
    return <div style={{ padding: 16, fontFamily: "sans-serif" }}><p>Loading receipt...</p></div>;
  }

  return (
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
  );
}