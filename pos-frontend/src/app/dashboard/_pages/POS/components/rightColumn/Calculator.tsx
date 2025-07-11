import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import React from "react";

interface CalculatorProps {
  amount: string;
  setAmount: (val: string) => void;
  cartTotal: number;
  refocusScanner: () => void;
  onNext: () => void;
}

export default function Calculator({
  amount,
  setAmount,
  cartTotal,
  refocusScanner,
  onNext,
}: CalculatorProps) {
  const handleCalcButtonClick = (value: string) => {
    if (value === "C") {
      setAmount("");
    } else if (value === "⌫") {
      setAmount(amount.slice(0, -1));
    } else {
      if (value === "." && amount.includes(".")) return;
      setAmount(amount + value);
    }
    refocusScanner();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setTimeout(refocusScanner, 3000);
  };

  return (
    <>
      <Label className="text-lg mb-2 font-medium">Cash</Label>
      <Input
        className="h-20 !text-5xl text-right font-medium mb-6 border-2 border-gray-300 shadow-sm placeholder:text-5xl placeholder:font-medium placeholder:text-gray-400"
        value={amount}
        onChange={handleInputChange}
        placeholder="0.00"
        onBlur={refocusScanner}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
          <Button
            key={num}
            onClick={() => handleCalcButtonClick(num.toString())}
            variant="outline"
            className="h-16 text-2xl font-medium"
          >
            {num}
          </Button>
        ))}
        <Button
          onClick={() => handleCalcButtonClick(".")}
          variant="outline"
          className="h-16 text-2xl font-medium"
        >
          .
        </Button>
        <Button
          onClick={() => handleCalcButtonClick("0")}
          variant="outline"
          className="h-16 text-2xl font-medium"
        >
          0
        </Button>
        <Button
          onClick={() => handleCalcButtonClick("⌫")}
          variant="outline"
          className="h-16 text-2xl font-medium"
        >
          ⌫
        </Button>
        <Button
          onClick={() => handleCalcButtonClick("C")}
          variant="outline"
          className="h-16 text-2xl font-medium col-span-3"
        >
          Clear
        </Button>
      </div>
      <div className="px-4 pb-4 pt-4">
        <Button
          className="w-full h-14 text-xl font-medium"
          onClick={onNext}
          disabled={!amount || parseFloat(amount) < cartTotal}
        >
          Next
        </Button>
      </div>
    </>
  );
}
