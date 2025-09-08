import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/contexts/cart-context";
import { useCustomerTagging } from "@/hooks/pos/rightCol/useCustomerTagging";
import Calculator from "./Calculator";
import CustomerSearch from "./CustomerSearch";
import PaymentSummary from "./PaymentSummary";
import Receipt from "./Receipt";
import AddCustomerModal from "./AddCustomerModal";
import type { Customer } from "@/hooks/pos/rightCol/useCustomerTagging";
import axios from "@/lib/axios";

interface POSRightColProps {
  step: 1 | 2 | 3;
  setStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
}

export default function RightColumn({ step, setStep }: POSRightColProps) {
  const { cart, cartTotal, refocusScanner, clearCart } = useCart();
  const [amount, setAmount] = useState("");
  const [change, setChange] = useState(0);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

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
    allCustomers,
    setAllCustomers,
  } = useCustomerTagging();

  // Calculator
  const handleNext = useCallback(() => {
    const amountValue = parseFloat(amount) || 0;
    if (amountValue >= cartTotal) {
      setChange(amountValue - cartTotal);
      setStep(2);
    } else {
      alert("Insufficient amount");
    }
  }, [amount, cartTotal, setStep]);

  // Print Receipt - Optimized
  const handlePrintReceipt = useCallback(async () => {
    if (isProcessingSale) return;

    const items = cart.map((item) => ({
      desc: item.product?.name ?? item.product?.barcode ?? "Item",
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
      setIsProcessingSale(true);
      const res = await axios.post('/receipt', payload, {
        responseType: 'blob'
      });

      const blob = res.data;
      const cd = res.headers['content-disposition'] || "";
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error generating receipt: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, amount, change, isProcessingSale]);

  // New Transaction - Optimized
  const handleNewTransaction = useCallback(async () => {
    if (isProcessingSale || cart.length === 0) return;

    try {
      setIsProcessingSale(true);
      
      const salesPayload = {
        customer_id: selectedCustomer?.id || null,
        total_purchase: cartTotal,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };
      
      await axios.post('/sales', salesPayload);
      
      // Reset state
      setStep(1);
      setAmount("");
      clearCustomer();
      setChange(0);
      clearCart();
      refocusScanner();
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error saving sale: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, setStep, clearCustomer, clearCart, refocusScanner, isProcessingSale]);

  const handleCustomerAdded = useCallback((newCustomer: Customer) => {
    setAllCustomers((prev) => [...prev, newCustomer]);
    selectCustomer(newCustomer);
    setCustomerQuery(newCustomer.name);
  }, [setAllCustomers, selectCustomer, setCustomerQuery]);

  return (
    <Card className="h-full flex flex-col" onClick={refocusScanner}>
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
                <Button 
                  className="w-full h-14 text-xl font-medium" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={isProcessingSale}
                >
                  Back
                </Button>
                <Button 
                  className="w-full h-14 text-xl font-medium" 
                  onClick={() => setStep(3)}
                  disabled={isProcessingSale}
                >
                  Finish Transaction
                </Button>
              </CardFooter>
            </>
          )}
          {step === 3 && (
            <>
              <Receipt selectedCustomer={selectedCustomer} cartTotal={cartTotal} />
              <CardFooter className="px-4 pb-4 pt-4 flex flex-col gap-2">
                <Button 
                  className="w-full h-14 text-xl font-medium" 
                  onClick={handlePrintReceipt}
                  disabled={isProcessingSale}
                >
                  {isProcessingSale ? "Processing..." : "Print Receipt"}
                </Button>
                <Button 
                  className="w-full h-14 text-xl font-medium" 
                  variant="outline" 
                  onClick={handleNewTransaction}
                  disabled={isProcessingSale}
                >
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