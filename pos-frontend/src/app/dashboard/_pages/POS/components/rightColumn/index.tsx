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

export default function POSRight({ step, setStep }: { step: 1 | 2 | 3; setStep: (s: 1 | 2 | 3) => void }) {
  const { cart, cartTotal, clearCart } = useCart();
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

  // EXISTING: handleNewTransaction currently posts and clears state (keep as "clear after receipt" for manual use)
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

      // Reset ALL state - including customer data - IMMEDIATELY
      clearCustomer();
      setStep(1);
      setAmount("");
      setChange(0);
      clearCart();

      // Clear global flags immediately
      (window as any).customerSearchActive = false;

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error saving sale: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, clearCustomer, clearCart, setAllCustomers]);

  // NEW: finalizeSale - POST /sales, refresh customers, select updated customer, then show receipt (Step 3)
  const finalizeSale = useCallback(async () => {
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

      const resp = await axios.post('/sales', salesPayload);
      const payload = resp?.data;

      // OPTIMIZATION: Simplify customer update logic
      if (payload?.data?.customer) {
        setAllCustomers((prev: any[] = []) => {
          const idx = prev.findIndex((p) => String(p.id) === String(payload.data.customer.id));
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = payload.data.customer;
            return copy;
          }
          return [...prev, payload.data.customer];
        });
        selectCustomer(payload.data.customer);
      }

      setStep(3);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error finalizing sale: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, setAllCustomers, selectCustomer, setStep, isProcessingSale]);


  // NEW: completeTransaction (close receipt) — clear cart/customer and reset UI
  const completeTransaction = useCallback(() => {
    try {
      clearCustomer();
      setStep(1);
      setAmount("");
      setChange(0);
      clearCart();
      (window as any).customerSearchActive = false;
    } catch (err) {
      console.warn("completeTransaction error:", err);
    }
  }, [clearCustomer, setStep, setAmount, setChange, clearCart]);

  // Print Receipt (server-generated PDF via /receipt) — old behavior
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
      const res = await axios.post('/receipt', payload, { responseType: 'blob' });
      const blob = res.data;
      const url = URL.createObjectURL(blob);

      // Client-only: prefer print-js, but always fallback to opening the PDF in a new tab.
      if (typeof window !== 'undefined') {
        try {
          const printJS = (await import('print-js')).default;
          if (printJS) {
            printJS({
              printable: url,
              type: 'pdf',
              showModal: false,
              onError: (err: any) => alert('Print error: ' + err),
              onLoadingEnd: () => setTimeout(() => URL.revokeObjectURL(url), 10000),
            });
            return;
          }
        } catch (err) {
          console.warn('print-js import failed, falling back to window.open', err);
        }

        // Fallback: open PDF in new tab (runs only on client)
        try {
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (err) {
          console.warn('Failed to open PDF in new tab:', err);
          // last resort: revoke URL later
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert("Error printing receipt: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, amount, change, isProcessingSale]);

  // Print to PDF (fallback to window.print for now)
  const handlePrintPDF = useCallback(() => {
    try {
      // TODO: replace with PDF generation logic if available
      window.print();
    } catch (err) {
      console.warn("Print PDF failed:", err);
    }
  }, []);

  // Called when a new customer has been added from the AddCustomerModal
  const handleCustomerAdded = useCallback(
    (customer: any) => {
      try {
        // Add new customer to local list and select them
        setAllCustomers((prev: any[] = []) => [...prev, customer]);
        setAddCustomerOpen(false);
        // selectCustomer comes from useCustomerTagging
        if (typeof selectCustomer === "function") selectCustomer(customer);
      } catch (err) {
        console.warn("handleCustomerAdded error:", err);
      }
    },
    [setAllCustomers, selectCustomer]
  );

  // Card click handler
  const handleCardClick = useCallback(() => {
    // Card click functionality can be added here if needed
  }, []);

  // NEW: centralized step-advance handler used by keyboard listeners
  const handlePosNext = useCallback(() => {
    if (isProcessingSale) {
      return;
    }

    if (step === 2) {
      // Immediately finalize the transaction (will POST /sales, update customer points, then show receipt)
      void finalizeSale();
      return;
    }

    if (step === 3) {
      // Do not re-submit the sale here — finalizeSale already submitted on Step 2.
      completeTransaction();
      return;
    }

    if ((window as any).customerSearchActive) {
      return;
    }

    const activeElement = document.activeElement;
    const isCustomerSearch = activeElement && (
      (activeElement as HTMLElement).getAttribute('data-customer-search') === 'true' ||
      (activeElement as HTMLInputElement).placeholder?.toLowerCase().includes('search name') ||
      (activeElement as HTMLElement).closest('[data-customer-search]') !== null
    );

    if (isCustomerSearch) {
      return;
    }

    if (step === 1) {
      // use existing validation function for step 1
      handleNext();
      return;
    }

    if (step === 3) {
      // Do not re-submit the sale here — finalizeSale already submitted on Step 2.
      completeTransaction();
      return;
    }
  }, [step, isProcessingSale, finalizeSale, handleNext, completeTransaction, setStep]);

  // Handle Ctrl+Enter / pos:next-step (backwards compatible)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('pos:next-step', handlePosNext);
    return () => {
      window.removeEventListener('pos:next-step', handlePosNext);
    };
  }, [handlePosNext, step]);

  // Listen for pos:step-1-back (Ctrl+B) — when on Step 2, go back to Step 1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStep1Back = (e: Event) => {
      if (step === 2) {
        setStep(1);
      }
    };
    window.addEventListener("pos:step-1-back", onStep1Back);
    return () => window.removeEventListener("pos:step-1-back", onStep1Back);
  }, [step, setStep]);

  // Listen for customer:add (Ctrl+Shift+C) — open AddCustomerModal
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onCustomerAdd = (e: Event) => {
      setAddCustomerOpen(true);
    };
    window.addEventListener("customer:add", onCustomerAdd);
    return () => window.removeEventListener("customer:add", onCustomerAdd);
  }, [setAddCustomerOpen]);

  // Global keyboard shortcut for Step 3: Shift+P -> print receipt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      // Only respond on Step 3, only Shift+P (no Ctrl/Alt)
      if (step === 3 && e.shiftKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        e.stopPropagation();
        handlePrintReceipt();
      }
    };
    document.addEventListener("keydown", onKey, { capture: true });
    return () => document.removeEventListener("keydown", onKey, { capture: true });
  }, [step, handlePrintReceipt]);

  // Step-specific listeners (step-1 / step-2)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStep1Complete = (e: Event) => {
      if (step !== 1) return;
      handlePosNext();
    };

    const handleStep2Complete = (e: Event) => {
      if (step !== 2) return;
      handlePosNext();
    };

    const handleStep3Complete = (e: Event) => {
      if (step !== 3) return;
      // Do NOT re-submit the sale from Step 3; just close/reset the UI.
      completeTransaction();
    };

    window.addEventListener('pos:step-1-complete', handleStep1Complete);
    window.addEventListener('pos:step-2-complete', handleStep2Complete);
    window.addEventListener('pos:step-3-complete', handleStep3Complete);
    return () => {
      window.removeEventListener('pos:step-1-complete', handleStep1Complete);
      window.removeEventListener('pos:step-2-complete', handleStep2Complete);
      window.removeEventListener('pos:step-3-complete', handleStep3Complete);
    };
  }, [step, handlePosNext, completeTransaction]);

  // Handle Enter key for finishing transaction in Steps 2 and 3
  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
      // Only handle Enter in Steps 2 and 3
      if (step !== 2 && step !== 3) return;

      // Don't handle Enter if customer search is active
      if ((window as any).customerSearchActive) return;

      // Don't handle Enter if we're processing
      if (isProcessingSale) return;

      // Only handle Enter if no modifier keys are pressed
      if (e.ctrlKey || e.shiftKey || e.altKey) return;

      // Check if we're focused on an input field
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        return;
      }

      e.preventDefault();

      if (step === 2) {
        // In Step 2, finish the transaction (finalize sale)
        void finalizeSale();
      } else if (step === 3) {
        // In Step 3, close the transaction (complete transaction)
        completeTransaction();
      }
    };

    document.addEventListener('keydown', handleEnterKey);
    return () => document.removeEventListener('keydown', handleEnterKey);
  }, [step, isProcessingSale, finalizeSale, completeTransaction]);

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
            <>
              <Calculator
                amount={amount}
                setAmount={setAmount}
                cartTotal={cartTotal}
                cartIsEmpty={cart.length === 0}
              />
              <div className="flex-1" />
              <CardFooter className="px-4 pb-4 pt-4 flex flex-col gap-3">
                <Button
                  className="w-full h-14 text-xl font-medium"
                  onClick={handleNext}
                  disabled={cart.length === 0 || !amount || parseFloat(amount) < cartTotal}
                >
                  Next
                </Button>
              </CardFooter>
            </>
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
                onCustomerSelected={() => {
                  // When customer is selected and Enter is pressed, finish transaction
                  if (selectedCustomer) {
                    void finalizeSale();
                  }
                }}
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
                  onClick={() => void finalizeSale()}
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
                  onClick={completeTransaction}
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