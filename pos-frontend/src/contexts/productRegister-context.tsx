"use client";

import { createContext, useContext, useState } from "react";

const ProductModalContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
  barcode: string | null;
  setBarcode: (v: string | null) => void;
}>({
  open: false,
  setOpen: () => {},
  barcode: null,
  setBarcode: () => {},
});

export function useProductModal() {
  return useContext(ProductModalContext);
}

export function ProductModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);

  return (
    <ProductModalContext.Provider value={{ open, setOpen, barcode, setBarcode }}>
      {children}
    </ProductModalContext.Provider>
  );
}