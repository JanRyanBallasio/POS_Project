import { useState } from "react";
import { CartProvider } from "@/contexts/cart-context";

import POSright from "./components/rightColumn/index";
import POSleft from "./components/leftColumn/index";

export default function MainDashboard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <CartProvider>
      <div className="flex flex-col w-full h-[880px] bg-neutral-100 py-4 px-4">
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
