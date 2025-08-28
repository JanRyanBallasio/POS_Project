// ...existing code...
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ModalName = string;

interface ProductModalContextValue {
  // stacked modals API
  activeModals: ModalName[]; // stack of opened modal names (first opened -> last opened)
  activeModal: ModalName | null; // convenience: last opened modal or null
  isOpen: (name: ModalName) => boolean;
  modalProps?: Record<string, any>;
  openModal: (name: ModalName, props?: any) => void;
  closeModal: (name?: ModalName) => void;
  // backward compatibility helpers (kept for existing components)
  open: boolean; // convenience for product modal specifically
  setOpen: (v: boolean) => void;
  barcode: string;
  setBarcode: (v: string) => void;
}

const ProductModalContext = createContext<ProductModalContextValue>({
  activeModals: [],
  activeModal: null,
  isOpen: () => false,
  modalProps: undefined,
  openModal: () => {},
  closeModal: () => {},
  open: false,
  setOpen: () => {},
  barcode: "",
  setBarcode: () => {},
});

export const ProductModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModals, setActiveModals] = useState<ModalName[]>([]);
  const [modalProps, setModalProps] = useState<Record<string, any> | undefined>(undefined);
  const [barcode, setBarcode] = useState<string>("");

  const openModal = (name: ModalName, props?: any) => {
    setActiveModals((prev) => {
      if (prev.includes(name)) return prev;
      return [...prev, name];
    });
    setModalProps((prev) => ({ ...(prev || {}), [name]: props }));
  };

  const closeModal = (name?: ModalName) => {
    if (typeof name === "string") {
      setActiveModals((prev) => prev.filter((m) => m !== name));
      setModalProps((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next[name];
        return Object.keys(next).length ? next : undefined;
      });
    } else {
      // no name -> close all
      setActiveModals([]);
      setModalProps(undefined);
    }
  };

  const isOpen = (name: ModalName) => activeModals.includes(name);

  // backward compat: treat the "product register" modal name as "addProduct"
  const open = isOpen("addProduct");
  const setOpen = (v: boolean) => {
    if (v) {
      openModal("addProduct");
    } else {
      // only remove the product modal entry
      closeModal("addProduct");
    }
  };

  const activeModal = activeModals.length ? activeModals[activeModals.length - 1] : null;

  return (
    <ProductModalContext.Provider
      value={{
        activeModals,
        activeModal,
        isOpen,
        modalProps,
        openModal,
        closeModal,
        open,
        setOpen,
        barcode,
        setBarcode,
      }}
    >
      {children}
    </ProductModalContext.Provider>
  );
};

export const useProductModal = () => useContext(ProductModalContext);
// ...existing code...