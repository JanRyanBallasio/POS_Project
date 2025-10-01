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
import { qz } from 'qz-tray';

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

      // Check if any products are debug products (have string IDs like "debug-100")
      const hasDebugProducts = cart.some(item => {
        const productId = item.product.id;
        return typeof productId === 'string' && productId.startsWith('debug-');
      });

      if (hasDebugProducts) {
        // Skip database save for debug products - go directly to receipt
        console.log("Debug products detected - skipping database save, proceeding to receipt");
        setStep(3);
        setIsProcessingSale(false);
        return;
      }

      // Normal flow for real products - save to database
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

  // Direct Print Receipt - Backend ESC/POS communication with debug mode
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
      
      // Get HTML from backend for print preview
      const response = await axios.post('/generate-html', payload);
      
      if (response.data.success) {
        // Create hidden iframe for printing (no popup required)
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '800px';
        iframe.style.height = '600px';
        
        document.body.appendChild(iframe);
        
        // Write HTML to iframe
        iframe.contentDocument?.write(response.data.html);
        iframe.contentDocument?.close();
        
        // Wait for content to load, then print
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print();
            // Remove iframe after printing
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }, 500);
        };
        
        console.log(`Receipt preview opened! Items: ${response.data.itemCount}`);
      } else {
        throw new Error(response.data.error || 'HTML generation failed');
      }
            
    } catch (err: any) {
      console.error('Print preview error:', err);
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert(`Print preview failed: ${errorMessage}`);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, amount, change, isProcessingSale]);

  // NEW: Tauri printing function (unlimited items)
  const handleTauriPrint = useCallback(async () => {
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
      
      // Get HTML from backend
      const response = await axios.post('/tauri-print', payload);
      
      if (response.data.success) {
        // Use Tauri to print (no browser limitations)
        await qz.print(response.data.html, {});        
        console.log(`Receipt printed successfully! Items: ${response.data.itemCount}`);
        alert(`Receipt printed successfully!\nItems: ${response.data.itemCount}\nTotal: P${response.data.totalAmount}`);
      } else {
        throw new Error(response.data.error || 'Print failed');
      }
            
    } catch (err: any) {
      console.error('Tauri print error:', err);
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert(`Print failed: ${errorMessage}`);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, amount, change, isProcessingSale]);

  // NEW: Browser printing with pagination for large receipts
  const handleBrowserPrint = useCallback(async () => {
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
      
      const response = await axios.post('/tauri-print', payload);
      
      if (response.data.success) {
        // Browser printing (works everywhere, no limitations)
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(response.data.html);
          printWindow.document.close();
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              setTimeout(() => printWindow.close(), 1000);
            }, 500);
          };
        }
        
        console.log(`Receipt printed successfully! Items: ${response.data.itemCount}`);
        alert(`Receipt printed successfully!\nItems: ${response.data.itemCount}\nTotal: P${response.data.totalAmount}`);
      } else {
        throw new Error(response.data.error || 'Print failed');
      }
            
    } catch (err: any) {
      console.error('Print error:', err);
      const errorMessage = err.response?.data?.error || err.message || "Unknown error";
      alert(`Print failed: ${errorMessage}`);
    } finally {
      setIsProcessingSale(false);
    }
  }, [cart, selectedCustomer, cartTotal, amount, change, isProcessingSale]);

  // Generate plain text receipt (better for thermal printers)
  const generateReceiptText = (data: any) => {
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "2-digit",
    });

    let receipt = `
================================
        YZY STORE
    Eastern Slide, Tuding
================================

Customer: ${data.customer?.name || "N/A"}
Date: ${dateStr}
--------------------------------
Item                QTY  Price  Amount
--------------------------------
`;

    // Add all items
    data.items.forEach((item: any) => {
      const desc = item.desc.length > 20 ? item.desc.substring(0, 17) + "..." : item.desc;
      const qty = item.qty.toString().padStart(3);
      // Fix: Calculate price from amount and qty if price is undefined
      const price = item.price ? item.price.toFixed(2) : (item.amount / item.qty).toFixed(2);
      const amount = item.amount.toFixed(2).padStart(7);
      
      receipt += `${desc.padEnd(20)} ${qty} ${price.padStart(6)} ${amount}\n`;
    });

    receipt += `--------------------------------
Total:                    P${data.cartTotal.toFixed(2)}
Amount:                   P${data.amount.toFixed(2)}
Change:                   P${data.change.toFixed(2)}
--------------------------------
Customer Points: ${data.points || 0}
--------------------------------

THANK YOU - GATANG KA MANEN!

CUSTOMER COPY

================================
`;

    return receipt;
  };

  // Fallback function for new window approach
  const fallbackToNewWindow = useCallback((url: string) => {
    try {
      const newWindow = window.open(url, '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        };
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        // If popup blocked, just open the PDF
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      console.error('New window fallback failed:', err);
      // Last resort: just open the PDF
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }, []);

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
        handleTauriPrint(); // Changed from handlePrintReceipt
      }
    };
    document.addEventListener("keydown", onKey, { capture: true });
    return () => document.removeEventListener("keydown", onKey, { capture: true });
  }, [step, handleTauriPrint]);

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

  const isDebugMode = cart.some(item => {
    const productId = item.product.id;
    return typeof productId === 'string' && productId.startsWith('debug-');
  });

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
        {isDebugMode && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-2">
            <strong>Debug Mode:</strong> This transaction will not be saved to the database.
          </div>
        )}
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
                  onClick={handlePrintReceipt} // Use print preview
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