import { create } from "zustand";

type ProductFormState = {
  name: string;
  barcode: string;
  category_id: string;
  category_name: string;
  price: string;
  quantity: string;
  unit: string;
  setName: (v: string) => void;
  setBarcode: (v: string) => void;
  setCategoryId: (v: string) => void;
  setCategoryName: (v: string) => void;
  setPrice: (v: string) => void;
  setQuantity: (v: string) => void;
  setUnit: (v: string) => void;
  reset: () => void;
};

export const useProductFormStore = create<ProductFormState>((set) => ({
  name: "",
  barcode: "",
  category_id: "",
  category_name: "",
  price: "",
  quantity: "",
  unit: "pcs", // Default to pcs
  setName: (v) => set({ name: v }),
  setBarcode: (v) => set({ barcode: v }),
  setCategoryId: (v) => set({ category_id: v }),
  setCategoryName: (v) => set({ category_name: v }),
  setPrice: (v) => set({ price: v }),
  setQuantity: (v) => set({ quantity: v }),
  setUnit: (v) => set({ unit: v }),
  reset: () =>
    set({
      name: "",
      barcode: "",
      category_id: "",
      category_name: "",
      price: "",
      quantity: "",
      unit: "pcs", // Reset to pcs
    }),
}));