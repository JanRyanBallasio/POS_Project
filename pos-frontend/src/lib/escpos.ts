// pos-frontend/src/lib/escpos.ts

export type EscposItem = {
  desc: string;
  qty: number;
  price?: number;
  amount: number;
};

export type EscposData = {
  customer?: { name?: string | null };
  cartTotal: number;
  amount: number;
  change: number;
  points?: number;
  items: EscposItem[];
};

function padLeft(s: string | number, len: number) {
  const str = String(s);
  return str.length >= len ? str.slice(0, len) : " ".repeat(len - str.length) + str;
}
function padRight(s: string | number, len: number) {
  const str = String(s);
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

/**
 * Build an ESC/POS receipt string for 80mm printers.
 * Includes init, header, items, totals, and full auto‑cut.
 */
export function buildEscposReceipt(data: EscposData) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  let r = "";

  // Initialize
  r += "\x1B\x40"; // ESC @
  // Ensure a standard code page (adjust if your printer needs a different one)
  r += "\x1B\x74\x00"; // ESC t 0  => CP437
  
  // Header (center + bold)
  r += "\x1B\x61\x01"; // center
  r += "\x1B\x45\x01"; // bold on
  r += "YZY STORE\n";
  r += "Eastern Slide, Tuding\n";
  r += "\x1B\x45\x00"; // bold off
  r += "\x1B\x61\x00"; // left

  // Customer / date
  r += "--------------------------------\n";
  r += `Customer: ${data.customer?.name || "N/A"}\n`;
  r += `Date: ${dateStr}\n`;
  r += "--------------------------------\n";

  // Table header
  r += "# Description        Qty Price Amount\n";
  r += "--------------------------------\n";

  // Items
  data.items.forEach((it, i) => {
    const desc =
      it.desc.length > 15 ? it.desc.substring(0, 12) + "..." : it.desc;
    const qty = padLeft(it.qty, 3);
    const price =
      typeof it.price === "number"
        ? it.price
        : it.qty > 0
        ? it.amount / it.qty
        : 0;
    const priceStr = padLeft(`P${price.toFixed(2)}`, 6);
    const amountStr = padLeft(`P${it.amount.toFixed(2)}`, 7);
    r += `${padLeft(i + 1, 2)} ${padRight(desc, 15)} ${qty} ${priceStr} ${amountStr}\n`;
  });

  // Totals
  r += "--------------------------------\n";
  r += `Total:                    P${data.cartTotal.toFixed(2)}\n`;
  r += `Amount:                   P${data.amount.toFixed(2)}\n`;
  r += `Change:                   P${data.change.toFixed(2)}\n`;
  r += "--------------------------------\n";
  r += `Customer Points: ${data.points ?? 0}\n`;
  r += "--------------------------------\n\n";

  // Footer
  r += "\x1B\x61\x01"; // center
  r += "CUSTOMER COPY - NOT AN OFFICIAL RECEIPT\n\n";
  r += "THANK YOU - GATANG KA MANEN!\n";
  r += "\x1B\x61\x00"; // left
  r += "--------------------------------\n\n";

  // Feed and cut (increase feed if your printer trims too close)
  r += "\x1B\x64\x03"; // feed 3 lines
  r += "\x1D\x56\x00"; // GS V 0 (full cut)

  return r;
}