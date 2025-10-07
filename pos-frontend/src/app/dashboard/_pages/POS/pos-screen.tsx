import { useState, useEffect } from "react";
import { CartProvider, useCart } from "@/contexts/cart-context";

import POSright from "./components/rightColumn/index";
import POSleft from "./components/leftColumn/index";
import { usePosShortcuts } from "@/hooks/pos/usePosShortcuts";
import { Button } from "@/components/ui/button";

function MobileNextButton({ onClick }: { onClick: () => void }) {
  const { cart } = useCart();
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <Button
        className="w-full h-12 md:h-14 text-base md:text-lg bg-[#0B1220] text-white hover:bg-[#0b1220]/90 shadow-lg"
        onClick={onClick}
        disabled={cart.length === 0}
      >
        Next
      </Button>
    </div>
  );
}

function MobileStep1Footer() {
  const { cart } = useCart();
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <Button
        className="w-full h-12 md:h-14 text-base md:text-lg bg-[#0B1220] text-white hover:bg-[#0b1220]/90 shadow-lg"
        disabled={cart.length === 0}
        onClick={() => {
          try {
            window.dispatchEvent(new Event("pos:next-step"));
          } catch {}
        }}
      >
        Next
      </Button>
    </div>
  );
}

export default function MainDashboard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Mobile pane control for step 1
  const [mobilePane, setMobilePane] = useState<'left' | 'right'>('left');

  // Detect desktop viewport to avoid double-mounting POSRight on mobile
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Listen for mobile back-to-products and switch pane + focus search
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleMobileBack = () => {
      setMobilePane("left");
      // After pane switch, nudge focus to product search
      setTimeout(() => {
        try {
          window.dispatchEvent(new Event("focusBarcodeScanner"));
        } catch {}
      }, 60);
    };
    window.addEventListener("pos:mobile-back-to-products", handleMobileBack);
    return () => {
      window.removeEventListener("pos:mobile-back-to-products", handleMobileBack);
    };
  }, [setMobilePane]);

  useEffect(() => {
    // Reset to products when returning to step 1; otherwise show right
    if (step !== 1) setMobilePane('right');
    else setMobilePane('left');
  }, [step]);

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
      <div className="flex flex-col md:flex-row w-full h-full min-h-0 px-4 md:pt-4 pb-4 gap-2">
        {/* Left pane: products */}
        <div className="flex-1 min-h-0">
          <div
            className={
              step === 1
                ? mobilePane === 'left'
                  ? 'pb-24 md:pb-0'
                  : 'hidden md:block'
                : 'hidden md:block'
            }
          >
            <POSleft step={step} />
            {step === 1 && mobilePane === 'left' && !isDesktop && (
              <MobileNextButton onClick={() => setMobilePane('right')} />
            )}
          </div>
        </div>

        {/* Right pane: render ONLY ONE instance */}
        {isDesktop ? (
          <div className="min-h-0 flex flex-col basis-[30%] gap-2">
            <POSright step={step} setStep={setStep} />
          </div>
        ) : (
          (step !== 1 || mobilePane === "right") && (
            <div className="h-full min-h-0 flex flex-col md:hidden">
              <POSright step={step} setStep={setStep} />
              {step === 1 && mobilePane === "right" && (
                <MobileStep1Footer />
              )}
            </div>
          )
        )}
      </div>
    </CartProvider>
  );
}