import { useState, useEffect } from "react";
import { CartProvider } from "@/contexts/cart-context";

import POSright from "./components/rightColumn/index";
import POSleft from "./components/leftColumn/index";

export default function MainDashboard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Sync React step into a global so the existing document-level keyboard handler
  // (useCartKeyboard) can detect the current POS step. Cleared on unmount.
  useEffect(() => {
    try {
      (window as any).posStep = step;
    } catch { }
    return () => {
      try {
        delete (window as any).posStep;
      } catch { }
    };
  }, [step]);

  // ensure scanner input in POS immediately receives focus when this page mounts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const focusScanner = () => {
      try {
        window.dispatchEvent(new Event("focusBarcodeScanner"));
      } catch { }
    };

    // immediate + a short delayed dispatch to cover timing differences
    focusScanner();
    const t = setTimeout(focusScanner, 120);

    // also focus when the browser window regains focus (user alt-tabs back)
    window.addEventListener("focus", focusScanner);

    return () => {
      clearTimeout(t);
      window.removeEventListener("focus", focusScanner);
    };
  }, []);

  // Handle Ctrl+Enter and dispatch a focus event for the cash input
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCtrlEnter = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        // Only act while on the POS page (this component is only mounted on the POS page)
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event("focusCashInput"));
      }
    };

    window.addEventListener("keydown", handleCtrlEnter);
    return () => window.removeEventListener("keydown", handleCtrlEnter);
  }, []);

  // Handle Ctrl+B for step back functionality with event capture
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCtrlB = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        // Prevent browser bold shortcut and sidebar collapse
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Dispatch the step back event
        window.dispatchEvent(new Event("pos:step-1-back"));
      }
    };

    // Use capture phase to ensure this runs before other listeners
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