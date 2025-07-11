import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { Search } from "lucide-react";

const dummyCustomers = [
  { id: "1", name: "Juan Dela Cruz", points: 12 },
  { id: "2", name: "Maria Santos", points: 25 },
  { id: "3", name: "Pedro Reyes", points: 7 },
  { id: "4", name: "Ana Lopez", points: 40 },
];

export default function POSRightColUpper() {
  const { cartTotal, refocusScanner } = useCart();
  const [amount, setAmount] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [change, setChange] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerQuery, setCustomerQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(dummyCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<
    null | (typeof dummyCustomers)[0]
  >(null);

  useEffect(() => {
    setFilteredCustomers(
      dummyCustomers.filter((c) =>
        c.name.toLowerCase().includes(customerQuery.toLowerCase())
      )
    );
  }, [customerQuery]);

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

      // Award points if customer selected
      if (selectedCustomer) {
        // 10 pesos = 1 point
        const earned = Math.floor(cartTotal / 10);
        alert(
          `${selectedCustomer.name} earned ${earned} point(s)! (Old: ${selectedCustomer.points})`
        );
        // In real app, update backend here
      }
    } else {
      alert("Insufficient amount");
    }
    refocusScanner();
  };

  const handleNewTransaction = () => {
    setIsSubmitted(false);
    setAmount("");
    setCustomerQuery(""); // <-- Add this
    setSelectedCustomer(null); // <-- Add this
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
          {step === 1 && (
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
              {/* Calculator Layout */}
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
              <CardFooter className="px-4 pb-4 pt-4">
                <Button
                  className="w-full h-14 text-xl font-medium"
                  onClick={() => {
                    const amountValue = parseFloat(amount) || 0;
                    if (amountValue >= cartTotal) {
                      setChange(amountValue - cartTotal);
                      setStep(2);
                    } else {
                      alert("Insufficient amount");
                    }
                  }}
                  disabled={!amount || parseFloat(amount) < cartTotal}
                >
                  Next
                </Button>
              </CardFooter>
            </>
          )}
          {step === 2 && (
            <>
              <div className="py-5 border-t border-b">
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
              </div>
              <div className="flex justify-between text-3xl font-bold pt-5">
                <span>Change:</span>
                <span>₱ {change.toFixed(2)}</span>
              </div>
              <div className="flex-1" />
              <Label htmlFor="customer-search" className="mb-2">
                Customer Name
              </Label>
              <div className="relative mb-2">
                <Search
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  id="customer-search"
                  className="pl-9"
                  placeholder="Search Name"
                  value={customerQuery}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setSelectedCustomer(null);
                  }}
                  autoComplete="off"
                />
                {customerQuery && !selectedCustomer && (
                  <div className="absolute z-10 left-0 right-0 bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {filteredCustomers.length === 0 && (
                      <div className="p-2 text-gray-500 text-center">
                        No results
                      </div>
                    )}
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerQuery(customer.name);
                        }}
                      >
                        <span>{customer.name}</span>
                        <span className="text-xs text-gray-500">
                          {customer.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <CardFooter className="px-4 pb-4 pt-4 flex flex-col gap-2">
                <Button
                  className="w-full h-14 text-xl font-medium"
                  onClick={() => {
                    if (selectedCustomer) {
                      const earned = Math.floor(cartTotal / 10);
                      alert(
                        `${selectedCustomer.name} earned ${earned} point(s)! (Old: ${selectedCustomer.points})`
                      );
                    }
                    setStep(3);
                  }}
                >
                  Print Receipt
                </Button>
                <Button
                  className="w-full h-14 text-xl font-medium"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Finish Transaction
                </Button>
              </CardFooter>
            </>
          )}
          {step === 3 && (
            <>
              <div className="flex flex-col items-center justify-center flex-1">
                <h2 className="text-3xl font-bold mb-4">Receipt Printed!</h2>
                <p className="mb-8">Thank you for your purchase.</p>
              </div>
              <CardFooter className="px-4 pb-4 pt-4">
                <Button
                  className="w-full h-14 text-xl font-medium"
                  onClick={() => {
                    setStep(1);
                    setAmount("");
                    setCustomerQuery("");
                    setSelectedCustomer(null);
                    setChange(0);
                  }}
                >
                  New Transaction
                </Button>
              </CardFooter>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
