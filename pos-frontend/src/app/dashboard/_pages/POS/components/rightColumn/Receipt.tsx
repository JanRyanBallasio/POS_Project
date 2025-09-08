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
  const pointsEarned = selectedCustomer ? Math.floor(cartTotal) : 0;

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <h2 className="text-3xl font-bold mb-4">Transaction Successful!</h2>
      <p className="mb-4">Thank you for your purchase.</p>
    </div>
  );
}