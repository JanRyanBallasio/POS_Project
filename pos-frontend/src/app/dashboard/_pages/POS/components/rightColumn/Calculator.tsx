import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useRef } from "react";

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

  // NEW: focus handler for global event
  useEffect(() => {
    const handleFocusCash = () => {
      try {
        if (cashInputRef.current && !cartIsEmpty) {
          cashInputRef.current.focus();
          cashInputRef.current.select();
        }
      } catch { }
    };

    window.addEventListener("focusCashInput", handleFocusCash);
    return () => window.removeEventListener("focusCashInput", handleFocusCash);
  }, [cartIsEmpty]);

  const handleCalcButtonClick = (value: string) => {
    if (value === "C") {
      setAmount("");
    } else if (value === "⌫") {
      setAmount(amount.slice(0, -1));
    } else {
      if (value === "." && amount.includes(".")) return;
      setAmount(amount + value);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl+Enter behavior remains (global handler in pos-screen also dispatches focus)
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // When Enter is pressed while the cash input is focused, advance POS step (step 1 complete)
    if (e.key === "Enter" && !e.ctrlKey) {
      if (e.target === cashInputRef.current) {
        e.preventDefault();
        e.stopPropagation();
        // Dispatch the step-1-specific event (cash input confirms step 1 -> step 2)
        window.dispatchEvent(new CustomEvent("pos:step-1-complete"));
      }
    }
  };

  // Add click handler to focus input when user clicks on it
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (cashInputRef.current) {
      cashInputRef.current.focus();
    }
  };

  return (
    <>
      <Label className="text-lg mb-2 font-medium">Cash</Label>
      <Input
        ref={cashInputRef}
        data-pos-cash-input="true"
        className="h-20 !text-5xl text-right font-medium mb-6 border-2 border-gray-300 shadow-sm placeholder:text-5xl placeholder:font-medium placeholder:text-gray-400"
        value={amount}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onClick={handleInputClick}
        placeholder="0.00"
        disabled={cartIsEmpty}
      />
    </>
  );
}