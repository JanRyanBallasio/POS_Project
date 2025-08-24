"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ModalName = string | null;

interface ProductModalContextValue {
  // new preferred API
  activeModal: ModalName;
  modalProps?: any;
  openModal: (name: string, props?: any) => void;
  closeModal: () => void;
  // backward compatibility helpers (kept for existing components)
  open: boolean; // convenience for product modal specifically
  setOpen: (v: boolean) => void;
  barcode: string;
  setBarcode: (v: string) => void;
}

const ProductModalContext = createContext<ProductModalContextValue>({
  activeModal: null,
  modalProps: undefined,
  openModal: () => {},
  closeModal: () => {},
  open: false,
  setOpen: () => {},
  barcode: "",
  setBarcode: () => {},
});

export const ProductModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [modalProps, setModalProps] = useState<any>(undefined);
  const [barcode, setBarcode] = useState<string>("");

  const openModal = (name: string, props?: any) => {
    setActiveModal(name);
    setModalProps(props);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalProps(undefined);
  };

  // backward compat: treat the "product register" modal name as "addProduct"
  const open = activeModal === "addProduct";
  const setOpen = (v: boolean) => {
    if (v) {
      openModal("addProduct");
    } else {
      // only close if the product modal is currently open
      if (activeModal === "addProduct") closeModal();
    }
  };

  return (
    <ProductModalContext.Provider
      value={{
        activeModal,
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