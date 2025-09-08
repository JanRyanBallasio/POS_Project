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

  const handleCustomerAutoSelect = useCallback((customer: Customer) => {
    selectCustomer(customer);
    setCustomerQuery(customer.name);
  }, []);

  const {
    customerQuery,
    setCustomerQuery,
    filteredCustomers,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
    allCustomers,
    setAllCustomers,
  } = useCustomerTagging(handleCustomerAutoSelect); // Pass the callback here

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

      // Refresh customer data if needed (but don't keep them selected)
      try {
        const customerResp = await axios.get('/customers');
        if (customerResp.data?.success && Array.isArray(customerResp.data.data)) {
          setAllCustomers(customerResp.data.data);
        }
      } catch (err) {
        console.warn('Failed to refresh customer data:', err);
      }

      // CRITICAL FIX: Reset ALL state - including customer data - IMMEDIATELY
      clearCustomer(); // Clear customer FIRST
      setStep(1);
      setAmount("");
      setChange(0);
      clearCart();
      
      // CRITICAL FIX: Clear global flags immediately
      (window as any).customerSearchActive = false;
      
      // Delay refocus slightly to ensure all state is reset
      setTimeout(() => {
        refocusScanner();
      }, 100);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error saving sale: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, clearCustomer, clearCart, refocusScanner, isProcessingSale, setAllCustomers]);

  // Handle Ctrl+Enter for different steps
  useEffect(() => {
    const handlePosNext = () => {
      console.log("🔥 RightColumn handlePosNext triggered:", {
        step,
        isProcessingSale,
        customerSearchActive: (window as any).customerSearchActive,
        activeElement: document.activeElement,
        activeElementTag: document.activeElement?.tagName,
      });

      if (isProcessingSale) {
        console.log("❌ RightColumn: Processing sale, ignoring");
        return;
      }

      // CRITICAL FIX: Check global flag first
      if ((window as any).customerSearchActive) {
        console.log("❌ RightColumn: Customer search globally active, ignoring pos:next-step");
        return;
      }

      // CRITICAL FIX: Check if event originated from customer search
      const activeElement = document.activeElement;
      const isCustomerSearch = activeElement && (
        (activeElement as HTMLElement).getAttribute('data-customer-search') === 'true' ||
        (activeElement as HTMLInputElement).placeholder?.toLowerCase().includes('search name') ||
        (activeElement as HTMLElement).closest('[data-customer-search]') !== null
      );
      
      if (isCustomerSearch) {
        console.log("❌ RightColumn: Customer search active, ignoring pos:next-step");
        return;
      }

      // FIXED: Handle ALL steps including step 1
      if (step === 1) {
        // Step 1: Move to step 2 only if amount is sufficient
        const amountValue = parseFloat(amount) || 0;
        if (amountValue >= cartTotal && cart.length > 0) {
          console.log("✅ RightColumn: Step 1 -> Step 2");
          setStep(2);
        } else {
          console.log("❌ RightColumn: Insufficient amount or empty cart");
        }
      } else if (step === 2) {
        console.log("✅ RightColumn: Step 2 -> Step 3");
        setStep(3);
      } else if (step === 3) {
        console.log("✅ RightColumn: Step 3 -> New Transaction");
        handleNewTransaction();
      }
    };

    // CRITICAL FIX: Listen for ALL steps
    console.log("🎯 RightColumn: Adding pos:next-step listener for step", step);
    window.addEventListener('pos:next-step', handlePosNext);
    return () => {
      console.log("🗑️ RightColumn: Removing pos:next-step listener for step", step);
      window.removeEventListener('pos:next-step', handlePosNext);
    };
  }, [step, isProcessingSale, handleNewTransaction, amount, cartTotal, cart]); // Add missing dependencies

  // Print PDF (opens in new tab)
  const handlePrintPDF = useCallback(async () => {
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
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank');

      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error generating receipt: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, amount, change, isProcessingSale]);

  // Print Receipt - Optimized for Next.js (client-only)
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
      const url = URL.createObjectURL(blob);

      // Ensure this code only runs on the client
      if (typeof window !== 'undefined') {
        // Dynamically import print-js only on the client
        const printJS = (await import('print-js')).default;
        printJS({
          printable: url,
          type: 'pdf',
          showModal: false,
          onError: (err: any) => alert('Print error: ' + err),
          onLoadingEnd: () => setTimeout(() => URL.revokeObjectURL(url), 10000),
        });
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error printing receipt: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, amount, change, isProcessingSale]);

  // New Transaction - Updated to properly reset customer data


  const handleCustomerAdded = useCallback((newCustomer: Customer) => {
    setAllCustomers((prev) => [...prev, newCustomer]);
    selectCustomer(newCustomer);
    setCustomerQuery(newCustomer.name);
  }, [setAllCustomers, selectCustomer, setCustomerQuery]);

  // Add this effect to clear customer when going back to step 1
  useEffect(() => {
    if (step === 1) {
      // Clear customer data when returning to step 1 from any other step
      clearCustomer();
    }
  }, [step, clearCustomer]);

  // Modified click handler to not interfere with customer search
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't refocus scanner if we're in step 2 or 3, or if clicking on customer search area
    if (step === 2 || step === 3) {
      return;
    }

    // Only refocus if clicking on the card itself, not child elements
    if (e.target === e.currentTarget) {
      refocusScanner();
    }
  };

  useEffect(() => {
    (window as any).posStep = step;
    return () => {
      delete (window as any).posStep;
    };
  }, [step]);

  return (
    <Card className="h-full flex flex-col" onClick={handleCardClick}>
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
                  Finish Transaction <span className="ml-2 text-sm opacity-75">(Ctrl+Enter)</span>
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
                  onClick={handlePrintPDF}
                  disabled={isProcessingSale}
                >
                  Print PDF
                </Button>
                <Button
                  className="w-full h-14 text-xl font-medium"
                  variant="outline"
                  onClick={handleNewTransaction}
                  disabled={isProcessingSale}
                >
                  Close <span className="ml-2 text-sm opacity-75">(Ctrl+Enter)</span>
                </Button>
              </CardFooter>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}