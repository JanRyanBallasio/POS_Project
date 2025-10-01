import React from "react";

interface PaymentSummaryProps {
  amount: string;
  cartTotal: number;
  change: number;
}

export default function PaymentSummary({
  amount,
  cartTotal,
  change,
}: PaymentSummaryProps) {
  // normalize amount
  let paid = parseFloat(String(amount || "0"));
  if (!Number.isFinite(paid) || isNaN(paid)) paid = 0;

  const enough = paid >= cartTotal;

  return (
    <div className=" mt-2">
      {/* Amount Paid */}
      <div className="flex items-center justify-between text-base md:text-md leading-6">
        <span className="text-gray-600">Amount Paid:</span>
        <span className="tabular-nums font-medium">₱{paid.toFixed(2)}</span>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between text-base md:text-md leading-6 mt-3">
        <span className="text-gray-600">Total:</span>
        <span className="tabular-nums font-medium">₱{cartTotal.toFixed(2)}</span>
      </div>

      <hr className="my-4 border-gray-200" />

      {/* Change */}
      <div className="flex items-center justify-between text-base md:text-lg">
        <span className="text-gray-600">Change:</span>
        <span
          className={[
            "tabular-nums font-semibold",
            enough ? "text-green-600" : "text-red-600",
          ].join(" ")}
        >
          ₱{change.toFixed(2)}
        </span>
      </div>
    </div>
  );
}