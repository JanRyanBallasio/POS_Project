"use client";

import { createContext, useContext, useState } from "react";

interface ProductModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  barcode: string;
  setBarcode: (barcode: string) => void;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(undefined);

export function ProductModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [barcode, setBarcode] = useState("");

  return (
    <ProductModalContext.Provider value={{ open, setOpen, barcode, setBarcode }}>
      {children}
    </ProductModalContext.Provider>
  );
}

export function useProductModal() {
  const ctx = useContext(ProductModalContext);
  if (!ctx) throw new Error("useProductModal must be used within ProductModalProvider");
  return ctx;
}