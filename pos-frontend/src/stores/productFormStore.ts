import { create } from "zustand";

type ProductFormState = {
  name: string;
  barcode: string;
  category_id: string;
  category_name: string;
  price: number;
  quantity: number;
  setName: (v: string) => void;
  setBarcode: (v: string) => void;
  setCategoryId: (v: string) => void;
  setCategoryName: (v: string) => void;
  setPrice: (v: number) => void;
  setQuantity: (v: number) => void;
  reset: () => void;
};

export const useProductFormStore = create<ProductFormState>((set) => ({
  name: "",
  barcode: "",
  category_id: "",
  category_name: "",
  price: 0,
  quantity: 0,
  setName: (v) => set({ name: v }),
  setBarcode: (v) => set({ barcode: v }),
  setCategoryId: (v) => set({ category_id: v }),
  setCategoryName: (v) => set({ category_name: v }),
  setPrice: (v) => set({ price: v }),
  setQuantity: (v) => set({ quantity: v }),
  reset: () =>
    set({
      name: "",
      barcode: "",
      category_id: "",
      category_name: "",
      price: 0,
      quantity: 0,
    }),
}));