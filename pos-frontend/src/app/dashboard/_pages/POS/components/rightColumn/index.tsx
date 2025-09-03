import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useCustomerTagging } from "@/hooks/pos/rightCol/useCustomerTagging";
import Calculator from "./Calculator";
import CustomerSearch from "./CustomerSearch";
import PaymentSummary from "./PaymentSummary";
import Receipt from "./Receipt";
import AddCustomerModal from "./AddCustomerModal";
import type { Customer } from "@/hooks/pos/rightCol/useCustomerTagging";
import { API_BASE } from "@/lib/axios";

interface POSRightColProps {
  step: 1 | 2 | 3;
  setStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
}

export default function RightColumn({ step, setStep }: POSRightColProps) {
  const { cart, cartTotal, refocusScanner, clearCart } = useCart();
  const [amount, setAmount] = useState("");
  const [change, setChange] = useState(0);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

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
    fetchCustomers,
    allCustomers,
    setAllCustomers,
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

  // Print Receipt -> call backend /api/receipt
  const handlePrintReceipt = async () => {
    const base = API_BASE.replace(/\/+$/, ""); // ensures no trailing slash
    const items = cart.map((item) => ({
      desc: item.product?.name ?? item.product?.title ?? item.product?.barcode ?? "Item",
      qty: Number(item.quantity || 0),
      amount: Number(((item.product?.price || 0) * item.quantity).toFixed(2)),
    }));

    const payload = {
      customer: selectedCustomer || { name: "N/A" },
      cartTotal: Number(cartTotal || 0),
      amount: Number(parseFloat(amount) || cartTotal || 0),
      change: Number(change || 0),
      items,
    };

    try {
      const res = await fetch(`${base}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Receipt API error:", res.status, res.statusText, txt);
        alert("Failed to generate receipt PDF");
        return;
      }

      // get PDF blob and force download
      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const m = cd.match(/filename="?(.+?)"?($|;)/);
      const filename = m ? m[1] : `receipt-${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print receipt error:", err);
      alert("Error generating receipt");
    }
  };

  // New Transaction
  const handleNewTransaction = async () => {
    try {
      const base = API_BASE.replace(/\/+$/, "");
      await fetch(`${base}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id || null,
          total_purchase: cartTotal,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });
    } catch (err) {
      console.error("Save sale error:", err);
    }

    setStep(1);
    setAmount("");
    clearCustomer();
    setChange(0);
    refocusScanner();
    clearCart();
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    setAllCustomers((prev) => [...prev, newCustomer]);
    selectCustomer(newCustomer);
    setCustomerQuery(newCustomer.name);
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
              cartIsEmpty={cart.length === 0}
            />
          )}
          {step === 2 && (
            <>
              <PaymentSummary amount={amount} cartTotal={cartTotal} change={change} />
              <div className="flex-1" />
              <CustomerSearch
                customerQuery={customerQuery}
                setCustomerQuery={setCustomerQuery}
                filteredCustomers={filteredCustomers}
                selectedCustomer={selectedCustomer}
                selectCustomer={selectCustomer}
                clearCustomer={clearCustomer}
                onAddCustomer={() => setAddCustomerOpen(true)}
              />
              <AddCustomerModal
                open={addCustomerOpen}
                onOpenChange={setAddCustomerOpen}
                onCustomerAdded={handleCustomerAdded}
              />
              <CardFooter className="px-4 pb-4 pt-4 flex flex-col gap-3">
                <Button className="w-full h-14 text-xl font-medium" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="w-full h-14 text-xl font-medium" onClick={() => setStep(3)}>
                  Finish Transaction
                </Button>
              </CardFooter>
            </>
          )}
          {step === 3 && (
            <>
              <Receipt selectedCustomer={selectedCustomer} cartTotal={cartTotal} />
              <CardFooter className="px-4 pb-4 pt-4 flex flex-col gap-2">
                <Button className="w-full h-14 text-xl font-medium" onClick={handlePrintReceipt}>
                  Print Receipt
                </Button>
                <Button className="w-full h-14 text-xl font-medium" variant="outline" onClick={handleNewTransaction}>
                  Close
                </Button>
              </CardFooter>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}