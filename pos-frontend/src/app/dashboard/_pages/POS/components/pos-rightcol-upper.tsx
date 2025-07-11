import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";

export default function POSRightColUpper() {
  const { cartTotal, refocusScanner } = useCart();
  const [amount, setAmount] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [change, setChange] = useState(0);

  const handleCalcButtonClick = (value: string) => {
    if (value === "C") {
      // Clear the amount
      setAmount("");
    } else if (value === "⌫") {
      // Backspace - remove last character
      setAmount((prev) => prev.slice(0, -1));
    } else {
      // For numeric buttons and decimal
      setAmount((prev) => {
        // Don't allow multiple decimal points
        if (value === "." && prev.includes(".")) return prev;
        return prev + value;
      });
    }

    // Refocus scanner after any calculator button click
    refocusScanner();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    // Give a bit of time for the user to finish typing
    setTimeout(refocusScanner, 3000);
  };

  const handleSubmit = () => {
    const amountValue = parseFloat(amount) || 0;
    if (amountValue >= cartTotal) {
      setChange(amountValue - cartTotal);
      setIsSubmitted(true);
    } else {
      // You could add an error message here
      alert("Insufficient amount");
    }
    refocusScanner();
  };

  const handleNewTransaction = () => {
    setIsSubmitted(false);
    setAmount("");
    // Add any other reset logic needed
    refocusScanner();
  };

  return (
    <Card className="h-full flex flex-col" onClick={() => refocusScanner()}>
      <CardContent className="flex-1 flex flex-col p-4 pb-0">
        <h1 className="text-xl font-medium">Total</h1>
        <div className="w-full py-3 mb-2">
          <div className="flex justify-between text-5xl font-medium">
            <h1>₱</h1>
            <h1>{cartTotal.toFixed(2)}</h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!isSubmitted ? (
            <>
              <Label className="text-lg mb-2 font-medium">Cash</Label>
              <Input
                className="h-20 !text-5xl text-right font-medium mb-6 border-2 border-gray-300 shadow-sm placeholder:text-5xl placeholder:font-medium placeholder:text-gray-400"
                value={amount}
                onChange={handleInputChange}
                placeholder="0.00"
                onBlur={refocusScanner}
              />

              {/* Calculator Layout */}
              <div className="flex-1 grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg">
                {/* First row */}
                {[7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleCalcButtonClick(num.toString())}
                    variant="outline"
                    className="h-16 text-2xl font-medium"
                  >
                    {num}
                  </Button>
                ))}

                {/* Second row */}
                {[4, 5, 6].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleCalcButtonClick(num.toString())}
                    variant="outline"
                    className="h-16 text-2xl font-medium"
                  >
                    {num}
                  </Button>
                ))}

                {/* Third row */}
                {[1, 2, 3].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleCalcButtonClick(num.toString())}
                    variant="outline"
                    className="h-16 text-2xl font-medium"
                  >
                    {num}
                  </Button>
                ))}

                {/* Fourth row */}
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

                {/* Clear button - full width */}
                <Button
                  onClick={() => handleCalcButtonClick("C")}
                  variant="outline"
                  className="h-16 text-2xl font-medium col-span-3"
                >
                  Clear
                </Button>
              </div>
            </>
          ) : (
            <div className="class">
              <div className="flex justify-between text-xl mb-3">
                <span>Amount Paid:</span>
                <span className="font-medium">
                  ₱ {parseFloat(amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xl mb-3">
                <span>Total:</span>
                <span className="font-medium">₱ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Change:</span>
                <span>₱ {change.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-4">
        {!isSubmitted ? (
          <Button
            className="w-full h-14 text-xl font-medium"
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) < cartTotal}
          >
            Submit
          </Button>
        ) : (
          <Button
            className="w-full h-14 text-xl font-medium"
            onClick={handleNewTransaction}
          >
            Back to Calculator
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
