import React from "react";

interface Customer {
  id?: string;
  name: string;
  points?: number;
}

interface ReceiptProps {
  selectedCustomer: Customer | null;
  cartTotal: number;
}

export default function Receipt({ selectedCustomer, cartTotal }: ReceiptProps) {
  // Points earned (allow decimals)
  const pointsEarned = cartTotal > 0 ? Number((cartTotal / 100)) : 0;

  // Use backend-updated total points if present. Do NOT compute totals locally to avoid doubling.
  const updatedTotalPoints =
    selectedCustomer && typeof selectedCustomer.points === "number"
      ? Number(selectedCustomer.points)
      : null;
  // We intentionally avoid deriving previousPoints by subtraction (old + earned) to prevent double-counting.

  // Friendly formatting for points (show up to 2 decimals, trim trailing zeros)
  const fmtPoints = (n: number) => {
    const s = Number(n.toFixed(2)).toString();
    return s;
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <h2 className="text-3xl font-bold mb-4">Transaction Successful!</h2>

      {/* Customer name (if present) */}
      {selectedCustomer ? (
        <div className="text-lg mb-1">
          Customer: <span className="font-medium">{selectedCustomer.name}</span>
        </div>
      ) : null}

      <p className="mb-4">Thank you for your purchase.</p>
      <div className="text-lg mb-1">
        Points earned: <span className="font-medium">{fmtPoints(pointsEarned)}</span>
      </div>

      {updatedTotalPoints !== null ? (
        <div className="text-lg">
          Customer points: <span className="font-medium">{fmtPoints(updatedTotalPoints)}</span>
        </div>
      ) : null}
    </div>
  );
}