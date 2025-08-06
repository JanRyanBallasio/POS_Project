import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useCustomerTagging } from "@/hooks/pos/rightCol/useCustomerTagging";
import Calculator from "./Calculator";
import CustomerSearch from "./CustomerSearch";
import PaymentSummary from "./PaymentSummary";
import Receipt from "./Receipt";
import { PDFViewer } from "@react-pdf/renderer";

import ReceiptPDF from "./ReceiptPDF";
import { pdf } from "@react-pdf/renderer";

interface POSRightColProps {
  step: 1 | 2 | 3;
  setStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
}

export default function RightColumn({ step, setStep }: POSRightColProps) {
  const { cart, cartTotal, refocusScanner, clearCart } = useCart();
  const [amount, setAmount] = useState("");
  const [change, setChange] = useState(0);

  useEffect(() => {
    const amountValue = parseFloat(amount) || 0;
    setChange(amountValue - cartTotal);
  }, [amount, cartTotal]);

  const {
    customerQuery,
    setCustomerQuery,
    filteredCustomers,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
  } = useCustomerTagging();

  // Calculator
  const handleNext = () => {
    const amountValue = parseFloat(amount) || 0;
    if (amountValue >= cartTotal) {
      setChange(amountValue - cartTotal);
      setStep(2);
    } else {
      alert("Insufficient amount");
    }
  };

  // Print Receipt
  const handlePrintReceipt = async () => {
    const blob = await pdf(
      <ReceiptPDF
        cartTotal={cartTotal}
        amount={amount}
        change={change}
        customer={selectedCustomer}
        items={cart.map((item) => ({
          desc: item.product.name, // or whatever field is the product name
          qty: item.quantity,
          amount: item.product.price * item.quantity,
        }))}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  // New Transaction
  const handleNewTransaction = async () => {
    // Save sale to backend
    await fetch("http://13.211.162.106:5000:5000/api/sales", {
    // await fetch("http://localhost:5000/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: selectedCustomer?.id || null,
        total_purchase: cartTotal,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      }),
    });
    setStep(1);
    setAmount("");
    clearCustomer();
    setChange(0);
    refocusScanner();
    clearCart();
  };

  return (
    <Card className="h-full flex flex-col" onClick={() => refocusScanner()}>
      <CardContent className="flex-1 flex flex-col p-4 pb-0">
        <h1 className="text-xl font-medium">Total</h1>
        <div className="w-full py-3 mb-2">
          <div className="flex justify-between text-5xl font-medium">
            <h1>₱</h1>
            <h1>{cartTotal.toFixed(2)}</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {step === 1 && (
            <Calculator
              amount={amount}
              setAmount={setAmount}
              cartTotal={cartTotal}
              refocusScanner={refocusScanner}
              onNext={handleNext}
              cartIsEmpty={cart.length === 0} // <-- add this prop
            />
          )}
          {step === 2 && (
            <>
              <PaymentSummary
                amount={amount}
                cartTotal={cartTotal}
                change={change}
              />
              <div className="flex-1" />
              <CustomerSearch
                customerQuery={customerQuery}
                setCustomerQuery={setCustomerQuery}
                filteredCustomers={filteredCustomers}
                selectedCustomer={selectedCustomer}
                selectCustomer={selectCustomer}
              />
              <CardFooter className="px-4 pb-4 pt-4 flex flex-col gap-3">
                <Button
                  className="w-full h-14 text-xl font-medium"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="w-full h-14 text-xl font-medium"
                  onClick={() => setStep(3)}
                >
                  Next
                </Button>
              </CardFooter>
            </>
          )}
          {step === 3 && (
            <>
              <Receipt
                selectedCustomer={selectedCustomer}
                cartTotal={cartTotal}
              />
              <CardFooter className="px-4 pb-4 pt-4 flex flex-col gap-2">
                <Button
                  className="w-full h-14 text-xl font-medium"
                  onClick={handlePrintReceipt}
                >
                  Print Receipt
                </Button>
                <Button
                  className="w-full h-14 text-xl font-medium"
                  variant="outline"
                  onClick={handleNewTransaction}
                >
                  Finish Transaction
                </Button>
              </CardFooter>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
