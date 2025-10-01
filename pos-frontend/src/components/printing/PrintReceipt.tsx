// pos-frontend/src/components/printing/PrintReceipt.tsx
import React from "react";

type ReceiptItem = {
  desc: string;
  qty: number;
  price?: number;
  amount: number;
};

type PrintReceiptProps = {
  store?: {
    name?: string;
    address1?: string;
    address2?: string;
  };
  customer?: { name?: string | null };
  date?: string;
  items: ReceiptItem[];
  cartTotal: number;
  amount: number;
  change: number;
  points?: number;
};

export default function PrintReceipt({
  store,
  customer,
  date,
  items,
  cartTotal,
  amount,
  change,
  points,
}: PrintReceiptProps) {
  const safeDate =
    date ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#f5f5f5" }}>
      <div
        id="receipt-root"
        style={{
          width: "80mm",
          background: "#fff",
          color: "#000",
          padding: "10px",
          boxSizing: "border-box",
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          lineHeight: 1.2,
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
@page {
  size: 80mm auto;
  margin: 0;
}
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.no-print {
  display: inline-flex;
}
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 80mm !important;
  }
  .no-print {
    display: none !important;
  }
}
.separator {
  border-top: 1px dashed #000;
  margin: 6px 0;
  height: 1px;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  padding: 2px 0;
  text-align: left;
  font-size: 11px;
  white-space: nowrap;
}
.right { text-align: right; }
.center { text-align: center; }
.header { text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 14px; }
.footer { margin-top: 12px; text-align: center; font-weight: bold; }
.summary { margin: 8px 0; }
.summary-line { display: flex; justify-content: space-between; margin: 2px 0; }
.actions {
  position: sticky;
  bottom: 0;
  margin-top: 10px;
  display: flex;
  gap: 8px;
}
.actions button {
  flex: 1;
  height: 36px;
  font-size: 14px;
}
`,
          }}
        />
        <div className="header">
          <div>{store?.name ?? "YZY STORE"}</div>
          <div>{store?.address1 ?? "Eastern Slide, Tuding"}</div>
          {store?.address2 ? <div>{store.address2}</div> : null}
        </div>

        <div className="separator" />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Customer:</span>
          <span>{customer?.name || "N/A"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Date:</span>
          <span>{safeDate}</span>
        </div>

        <div className="separator" />

        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th className="right">Qty</th>
              <th className="right">Price</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const price =
                typeof it.price === "number" ? it.price : it.amount / Math.max(1, it.qty);
              const desc = it.desc.length > 20 ? `${it.desc.slice(0, 17)}...` : it.desc;
              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{desc}</td>
                  <td className="right">{it.qty}</td>
                  <td className="right">P{price.toFixed(2)}</td>
                  <td className="right">P{it.amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="separator" />

        <div className="summary">
          <div className="summary-line">
            <span>Total:</span>
            <span>P{cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Amount:</span>
            <span>P{amount.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Change:</span>
            <span>P{change.toFixed(2)}</span>
          </div>
        </div>

        <div className="separator" />

        <div className="summary-line">
          <span>Customer Points:</span>
          <span>{points ?? 0}</span>
        </div>

        <div className="separator" />

        <div className="footer">
          <div>CUSTOMER COPY - NOT AN OFFICIAL RECEIPT</div>
          <div>THANK YOU - GATANG KA MANEN!</div>
        </div>

        <div className="separator" />

        <div className="actions no-print">
          <button onClick={() => window.print()}>Print</button>
          <button onClick={() => window.close()}>Close</button>
        </div>
      </div>
    </div>
  );
}