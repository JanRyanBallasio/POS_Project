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
import axios from "@/lib/axios";
import { usePrint } from "@/hooks/printing/usePrint";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function POSRight({
  step,
  setStep,
}: {
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;
}) {
  const { cart, cartTotal, clearCart } = useCart();
  const [amount, setAmount] = useState("");
  const [change, setChange] = useState(0);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Simplified print dialog state - just confirmation
  const [printOpen, setPrintOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { printReceipt } = usePrint(); // Remove listPrinters

  useEffect(() => {
    const amountValue = parseFloat(amount) || 0;
    setChange(amountValue - cartTotal);
  }, [amount, cartTotal]);

  const openPrintDialog = useCallback(() => {
    setPrintOpen(true);
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
  } = useCustomerTagging();

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

      await axios.post("/sales", salesPayload);

      try {
        const customerResp = await axios.get("/customers");
        if (customerResp.data?.success && Array.isArray(customerResp.data.data)) {
          setAllCustomers(customerResp.data.data);
        }
      } catch (error) {
        console.warn('Operation failed:', error);
      }

      clearCustomer();
      setStep(1);
      setAmount("");
      setChange(0);
      clearCart();
      (window as any).customerSearchActive = false;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || "Unknown error";
      alert("Error saving sale: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [
    cart,
    selectedCustomer,
    cartTotal,
    clearCustomer,
    clearCart,
    setAllCustomers,
    isProcessingSale,
  ]);

  const finalizeSale = useCallback(async () => {
    if (isProcessingSale || cart.length === 0) return;
    try {
      setIsProcessingSale(true);

      const hasDebugProducts = cart.some((item) => {
        const productId = item.product.id;
        return typeof productId === "string" && productId.startsWith("debug-");
      });

      if (hasDebugProducts) {
        setStep(3);
        setIsProcessingSale(false);
        return;
      }

      const salesPayload = {
        customer_id: selectedCustomer?.id || null,
        total_purchase: cartTotal,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      const resp = await axios.post("/sales", salesPayload);
      const payload = resp?.data;

      if (payload?.data?.customer) {
        setAllCustomers((prev: any[] = []) => {
          const idx = prev.findIndex(
            (p) => String(p.id) === String(payload.data.customer.id)
          );
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
      const errorMessage =
        err.response?.data?.error || err.message || "Unknown error";
      alert("Error finalizing sale: " + errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  }, [
    cart,
    selectedCustomer,
    cartTotal,
    setAllCustomers,
    selectCustomer,
    setStep,
    isProcessingSale,
  ]);

  const completeTransaction = useCallback(() => {
    try {
      clearCustomer();
      setStep(1);
      setAmount("");
      setChange(0);
      clearCart();
      (window as any).customerSearchActive = false;
    } catch (error) {
      console.warn('Transaction operation failed:', error);
    }
  }, [clearCustomer, setStep, setAmount, setChange, clearCart]);

  const handlePosNext = useCallback(() => {
    if (isProcessingSale) return;

    if (step === 2) {
      void finalizeSale();
      return;
    }

    if (step === 3) {
      completeTransaction();
      return;
    }

    if ((window as any).customerSearchActive) return;

    const activeElement = document.activeElement as HTMLElement | null;
    const isCustomerSearch =
      activeElement &&
      ((activeElement.getAttribute("data-customer-search") === "true") ||
        (activeElement as HTMLInputElement).placeholder?.toLowerCase().includes("search name") ||
        !!activeElement.closest("[data-customer-search]"));

    if (isCustomerSearch) return;

    if (step === 1) {
      handleNext();
      return;
    }
  }, [step, isProcessingSale, finalizeSale, handleNext, completeTransaction, setStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pos:next-step", handlePosNext);
    return () => {
      window.removeEventListener("pos:next-step", handlePosNext);
    };
  }, [handlePosNext, step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStep1Back = () => {
      if (step === 2) setStep(1);
    };
    window.addEventListener("pos:step-1-back", onStep1Back);
    return () => window.removeEventListener("pos:step-1-back", onStep1Back);
  }, [step, setStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onCustomerAdd = () => setAddCustomerOpen(true);
    window.addEventListener("customer:add", onCustomerAdd);
    return () => window.removeEventListener("customer:add", onCustomerAdd);
  }, [setAddCustomerOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleEnterKey = (e: KeyboardEvent) => {
      if (step !== 2 && step !== 3) return;
      if ((window as any).customerSearchActive) return;
      if (isProcessingSale) return;
      if (e.ctrlKey || e.shiftKey || e.altKey) return;

      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true")
      ) {
        return;
      }

      e.preventDefault();
      if (step === 2) void finalizeSale();
      else if (step === 3) completeTransaction();
    };

    document.addEventListener("keydown", handleEnterKey);
    return () => document.removeEventListener("keydown", handleEnterKey);
  }, [step, isProcessingSale, finalizeSale, completeTransaction]);

  // When the print dialog opens, fetch printers
  useEffect(() => {
    if (!printOpen) return;
    // No longer fetching printers, as we are always using default
  }, [printOpen]);

  const confirmPrint = useCallback(async () => {
    if (isProcessingSale || isPrinting) return;

    const items = cart.map((item) => ({
      desc: item.product?.name ?? item.product?.barcode ?? "Item",
      qty: Number(item.quantity || 0),
      price: Number(item.product?.price || 0),
      amount: Number(((item.product?.price || 0) * item.quantity).toFixed(2)),
    }));

    try {
      setIsPrinting(true);
      
      const result = await printReceipt({
        store: { name: "YZY STORE", address1: "Eastern Slide, Tuding" },
        customer: selectedCustomer || { name: "N/A" },
        cartTotal: Number(cartTotal || 0),
        amount: Number(parseFloat(amount) || cartTotal || 0),
        change: Number(change || 0),
        points: Number(selectedCustomer?.points ?? 0),
        items,
        printerName: null, // Use default printer
      });
      
      setPrintOpen(false);
      alert(`Print successful: ${result}`);
      
    } catch (e: any) {
      console.error('[PRINT ERROR]', e);
      alert(`Print failed: ${e?.message || String(e)}`);
    } finally {
      setIsPrinting(false);
    }
  }, [
    isProcessingSale,
    isPrinting,
    cart,
    selectedCustomer,
    cartTotal,
    amount,
    change,
    printReceipt,
  ]);

  const isDebugMode = cart.some((item) => {
    const productId = item.product.id;
    return typeof productId === "string" && productId.startsWith("debug-");
  });

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col p-4 pb-0">
        {/* Header like the reference: centered, compact, with sublabel */}
        <div className="text-center mb-4">
          <div className="text-sm md:text-base text-gray-600">Total</div>
          <div className="mt-1 flex items-baseline justify-center gap-1 tabular-nums">
            <span className="text-2xl md:text-3xl font-bold">₱</span>
            <span className="text-4xl md:text-5xl font-extrabold leading-none">
              {cartTotal.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {cart.length} {cart.length === 1 ? "item" : "items"}
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

              {/* Quick cash buttons - enforce 6-column grid */}
              <div className="w-full grid grid-cols-3 gap-3 mt-3">
                {[50, 100, 200, 500, 1000].map((v) => (
                  <div key={v} className="col-span-1">
                    <button
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="block w-full h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50
                                 text-sm font-medium text-center"
                    >
                      ₱{v}
                    </button>
                  </div>
                ))}
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => setAmount(String(cartTotal.toFixed(2)))}
                    className="block w-full h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50
                               text-sm font-medium text-center"
                  >
                    Exact
                  </button>
                </div>
              </div>

              <div className="flex-1" />
              <CardFooter className="px-0 pb-4 pt-4">
                <Button
                  className="w-full h-12 md:h-14 text-base md:text-lg  bg-[#0B1220] text-white hover:bg-[#0b1220]/90"
                  onClick={handleNext}
                  disabled={cart.length === 0 || !amount || parseFloat(amount) < cartTotal || isProcessingSale}
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
                  if (selectedCustomer) void finalizeSale();
                }}
              />
              <AddCustomerModal
                open={addCustomerOpen}
                onOpenChange={setAddCustomerOpen}
                onCustomerAdded={(customer: any) => {
                  try {
                    setAllCustomers((prev: any[] = []) => [...prev, customer]);
                    setAddCustomerOpen(false);
                    if (typeof selectCustomer === "function") selectCustomer(customer);
                  } catch (error) {
        console.warn('Operation failed:', error);
      }
                }}
              />
              <CardFooter className="px-0 pb-4 pt-4 flex flex-col gap-3">
                <Button
                  className="w-full h-12 text-base font-medium"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isProcessingSale}
                >
                  Back
                </Button>
                <Button
                  className="w-full h-12 text-base font-medium"
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
                  onClick={openPrintDialog}
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

      {/* Simplified printer confirmation dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Receipt</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Print receipt to default printer?
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Receipt will be sent to your default printer automatically.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPrintOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPrint} disabled={isPrinting}>
              {isPrinting ? "Printing..." : "Print Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}