import { useState, useEffect } from "react";
import { CartProvider } from "@/contexts/cart-context";

import POSright from "./components/rightColumn/index";
import POSleft from "./components/leftColumn/index";

export default function MainDashboard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  return (
    <CartProvider>
      <div className="flex flex-col w-full h-full py-4 px-4">
        <div className="flex gap-2 h-full">
          <div className="flex-[70%]">
            <POSleft step={step} />
          </div>
          <div className="flex flex-col flex-[30%] gap-2">
            <POSright step={step} setStep={setStep} />
          </div>
        </div>
      </div>
    </CartProvider>
  );
}