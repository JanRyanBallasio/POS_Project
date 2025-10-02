import { useState, useEffect } from "react";
import { CartProvider } from "@/contexts/cart-context";

import POSright from "./components/rightColumn/index";
import POSleft from "./components/leftColumn/index";
import { usePosShortcuts } from "@/hooks/pos/usePosShortcuts";

export default function MainDashboard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Make step globally visible for any legacy listeners; cleared on unmount.
  useEffect(() => {
    try {
      (window as any).posStep = step;
    } catch (error) {
      console.warn('Operation failed:', error);
    }
    return () => {
      try {
        delete (window as any).posStep;
      } catch (error) {
      console.warn('Operation failed:', error);
    }
    };
  }, [step]);

  // Centralized POS shortcuts (Step 1: F2, Ctrl+Enter, Ctrl+Q, Ctrl+Shift+P)
  usePosShortcuts(step);

  // Ensure scanner input focuses when this page mounts or window regains focus
  useEffect(() => {
    if (typeof window === "undefined") return;

    const focusScanner = () => {
      try {
        window.dispatchEvent(new Event("focusBarcodeScanner"));
      } catch (error) {
      console.warn('Operation failed:', error);
    }
    };

    // Immediate + short delayed dispatch to cover timing differences
    focusScanner();
    const t = setTimeout(focusScanner, 120);

    // Also focus when the browser window regains focus (user alt-tabs back)
    window.addEventListener("focus", focusScanner);

    return () => {
      clearTimeout(t);
      window.removeEventListener("focus", focusScanner);
    };
  }, []);

  // Ctrl+B for step back with capture to win over other listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCtrlB = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.dispatchEvent(new Event("pos:step-1-back"));
      }
    };

    window.addEventListener("keydown", handleCtrlB, true);
    return () => window.removeEventListener("keydown", handleCtrlB, true);
  }, []);

  return (
    <CartProvider>
      <div className="flex flex-col lg:flex-row w-full h-full py-4 px-4 gap-2">
        {/* Left side */}
        <div className="flex-1">
          <POSleft step={step} />
        </div>

        {/* Right side (hidden on flex-col, shown only on lg+ when flex-row applies) */}
        <div className="hidden lg:flex flex-col basis-[30%] gap-2">
          <POSright step={step} setStep={setStep} />
        </div>
      </div>
    </CartProvider>
  );
}