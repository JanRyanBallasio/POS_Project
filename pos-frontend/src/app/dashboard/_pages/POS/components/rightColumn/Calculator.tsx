import React, { useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CalculatorProps {
  amount: string;
  setAmount: (val: string) => void;
  cartTotal: number;
  cartIsEmpty?: boolean;
}

export default function Calculator({
  amount,
  setAmount,
  cartTotal,
  cartIsEmpty = false,
}: CalculatorProps) {
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Keep existing global focus behavior
  useEffect(() => {
    const handleFocusCash = () => {
      try {
        if (cashInputRef.current && !cartIsEmpty) {
          cashInputRef.current.focus();
          cashInputRef.current.select();
        }
      } catch (error) {
        console.warn('Failed to focus cash input:', error);
      }
    };
    window.addEventListener("focusCashInput", handleFocusCash);
    return () => window.removeEventListener("focusCashInput", handleFocusCash);
  }, [cartIsEmpty]);

  const paid = useMemo(() => {
    const n = parseFloat(String(amount || "0"));
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const change = useMemo(() => paid - (cartTotal || 0), [paid, cartTotal]);
  const enoughCash = change >= 0;
  const showChange = String(amount ?? "").trim().length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === "Enter" && !e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent("pos:step-1-complete"));
    }
  };

  return (
    <div className="w-full">
      {/* Cash Payment first */}
      <Label htmlFor="pos-cash" className="block mb-2 text-sm md:text-base font-medium text-gray-700">
        Cash Payment
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 font-semibold">
          ₱
        </span>
        <Input
          id="pos-cash"
          ref={cashInputRef}
          data-pos-cash-input="true"
          value={amount}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          disabled={cartIsEmpty}
          className={[
            "h-12 md:h-14 pl-8",
            "text-base md:text-lg",
            "text-left font-medium tabular-nums",
            "border-2 border-gray-200 bg-gray-50",
            "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
            "placeholder:text-gray-400",
            "rounded-xl",
          ].join(" ")}
          inputMode="decimal"
        />
      </div>

      {/* Change below cash payment */}
      {showChange && (
        <div className="mt-4">
          <Label className="block mb-2 text-sm md:text-base font-medium text-gray-700">
            Change
          </Label>
          <div
            className={[
              "h-12 md:h-14 rounded-xl border-2 bg-white",
              "flex items-center justify-between px-4",
            ].join(" ")}
          >
            <span className="text-sm md:text-base text-gray-600">₱</span>
            <span
              className={[
                "tabular-nums font-semibold text-base md:text-lg",
                enoughCash ? "text-green-600" : "text-red-600",
              ].join(" ")}
            >
              {Math.abs(change).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}