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
  return (
    <>
      <div className="py-5 border-t border-b">
        <div className="flex justify-between text-xl mb-3">
          <span>Amount Paid:</span>
          <span className="font-medium">
            ₱ {parseFloat(amount).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xl mb-3">
          <span>Total:</span>
          <span className="font-medium">₱ {cartTotal.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex justify-between text-3xl font-bold pt-5">
        <span>Change:</span>
        <span>₱ {change.toFixed(2)}</span>
      </div>
    </>
  );
}