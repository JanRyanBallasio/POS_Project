import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { useProductModal } from "@/contexts/productRegister-context";
import { useCartStore, useCartTotal, CartItem } from "@/stores/cartStore";

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  scanError: string | null;
  isScanning: boolean;
  lastAddedItemId: string | null;
  scanAndAddToCart: (barcode: string, preValidatedProduct?: Product | null) => Promise<void>;
  addProductToCart: (product: Product) => string;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  deleteCartItem: (id: string) => void;
  clearCart: () => void;
  setScanError: (error: string | null) => void;
  setIsScanning: (isScanning: boolean) => void;
  setLastAddedItemId: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const productEqual = (a: Product, b: Product) => {
  if (a?.id && b?.id) return a.id === b.id;
  return Boolean(a?.barcode && b?.barcode && a.barcode === b.barcode);
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Use Zustand store
  const {
    cart,
    lastAddedItemId,
    scanError,
    isScanning,
    addProductToCart: storeAddProductToCart,
    updateCartItemQuantity: storeUpdateCartItemQuantity,
    updateCartItemPrice: storeUpdateCartItemPrice,
    deleteCartItem: storeDeleteCartItem,
    clearCart: storeClearCart,
    setScanError,
    setIsScanning,
    setLastAddedItemId,
  } = useCartStore();

  const cartTotal = useCartTotal();

  const [pendingScans, setPendingScans] = React.useState<Set<string>>(new Set());
  const lastScanTimeRef = useRef<Map<string, number>>(new Map());

  const { setBarcode: setContextBarcode, openModal, setOpen: setProductModalOpen } =
    useProductModal();

  const clearCart = useCallback(() => {
    storeClearCart();
    lastScanTimeRef.current = new Map();
  }, [storeClearCart]);

  const deleteCartItem = useCallback((id: string) => {
    let nextSelectedId: string | null = null;
    if (cart.length > 0) {
      const idx = cart.findIndex((item) => item.id === id);
      if (cart.length > 1) {
        nextSelectedId = idx > 0 ? cart[idx - 1].id : cart[1]?.id ?? null;
      }
    }

    storeDeleteCartItem(id);

    try {
      window.dispatchEvent(
        new CustomEvent("cart:item-deleted", {
          detail: { deletedId: id, nextSelectedId },
        })
      );
    } catch { /* ignore */ }
  }, [cart, storeDeleteCartItem]);

  const updateCartItemQuantity = useCallback((id: string, quantity: number) => {
    storeUpdateCartItemQuantity(id, quantity);
  }, [storeUpdateCartItemQuantity]);

  const updateCartItemPrice = useCallback((id: string, price: number) => {
    storeUpdateCartItemPrice(id, price);
  }, [storeUpdateCartItemPrice]);

  const addOrIncrement = useCallback((product: Product): string => {
    // ✅ Simple and clean - let the store handle everything
    return storeAddProductToCart(product);
  }, [storeAddProductToCart]);

  const addProductToCart = useCallback((product: Product): string => {
    return addOrIncrement(product);
  }, [addOrIncrement]);

  const scanAndAddToCart = useCallback(
    async (barcode: string, preValidatedProduct?: Product | null): Promise<void> => {
      if (!barcode) return;

      const cleanedBarcode = String(barcode).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      if (!cleanedBarcode) {
        setScanError("Invalid barcode");
        return;
      }
      if (pendingScans.has(cleanedBarcode)) return;

      try {
        setIsScanning(true);
        setScanError(null);
        setPendingScans((prev) => new Set([...prev, cleanedBarcode]));

        let product: Product | null = preValidatedProduct ?? null;
        if (!product) {
          try {
            product = await productApi.getByBarcode(cleanedBarcode);
          } catch {
            product = null;
          }
        }

        if (product) {
          addOrIncrement(product);
          setScanError(null);
        } else {
          // ✅ FIXED: Don't add placeholder or open modal directly
          // Instead, dispatch an event to trigger the confirmation dialog
          try {
            window.dispatchEvent(new CustomEvent("unregistered-barcode", {
              detail: { barcode: cleanedBarcode }
            }));
          } catch { }
          setScanError(`Product not found: ${cleanedBarcode}`);
        }
      } catch (error) {
        setScanError(error instanceof Error ? error.message : "Error scanning barcode");
        console.warn("[scanAndAddToCart] Error:", error);
      } finally {
        setPendingScans((prev) => {
          const next = new Set(prev);
          next.delete(cleanedBarcode);
          return next;
        });
        setIsScanning(false);
      }
    },
    [pendingScans, addOrIncrement, setScanError, setIsScanning]
  );

  useEffect(() => {
    const onProductAdded = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;

      const addedProduct: Product | undefined = detail.product;
      const barcode: string | undefined = detail.barcode;

      if (addedProduct) {
        addOrIncrement(addedProduct);
      } else if (barcode) {
        (async () => {
          try {
            const product = await productApi.getByBarcode(barcode);
            if (product) addOrIncrement(product);
          } catch { }
        })();
      }
    };

    window.addEventListener("product:added", onProductAdded as EventListener);
    return () => window.removeEventListener("product:added", onProductAdded as EventListener);
  }, [addOrIncrement]);

  const value = useMemo(
    () => ({
      cart,
      cartTotal,
      scanError,
      isScanning,
      lastAddedItemId,
      scanAndAddToCart,
      addProductToCart,
      updateCartItemQuantity,
      updateCartItemPrice,
      deleteCartItem,
      clearCart,
      setScanError,
      setIsScanning,
      setLastAddedItemId,
    }),
    [
      cart,
      cartTotal,
      scanError,
      isScanning,
      lastAddedItemId,
      scanAndAddToCart,
      addProductToCart,
      updateCartItemQuantity,
      updateCartItemPrice,
      deleteCartItem,
      clearCart,
      setScanError,
      setIsScanning,
      setLastAddedItemId,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// Keyboard shortcuts for cart actions (unchanged)
export function useCartKeyboard(selectedRowId: string | null) {
  useEffect(() => {
    const dispatch = (name: string, detail?: any) =>
      window.dispatchEvent(new CustomEvent(name, { detail }));

    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isSearchInput = active?.getAttribute?.("data-product-search") === "true";
      const isSearchOpen = active?.getAttribute?.("data-search-open") === "true";

      const key = e.key;

      if (isSearchInput && isSearchOpen) return;

      if (key === "ArrowDown") {
        e.preventDefault();
        dispatch("cart:select-next", { id: selectedRowId });
      } else if (key === "ArrowUp") {
        e.preventDefault();
        dispatch("cart:select-prev", { id: selectedRowId });
      } else if (key === "+" || key === "=") {
        e.preventDefault();
        dispatch("cart:increment-qty", { id: selectedRowId });
      } else if (key === "-") {
        e.preventDefault();
        dispatch("cart:decrement-qty", { id: selectedRowId });
      } else if (e.ctrlKey && e.shiftKey && key.toLowerCase() === "p") {
        e.preventDefault();
        const ps = document.querySelector<HTMLInputElement>('[data-product-search="true"]');
        ps?.blur();
        const id =
          selectedRowId ||
          document.querySelector<HTMLElement>('[data-cart-selected="true"]')?.getAttribute("data-cart-id") ||
          null;
        if (id) dispatch("cart:edit-price", { id });
      } else if (key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        dispatch("cart:focus-cash", { id: selectedRowId });
      } else if (e.ctrlKey && key.toLowerCase() === "q") {
        e.preventDefault();
        e.stopPropagation();
        const id =
          selectedRowId ||
          document.querySelector<HTMLElement>('[data-cart-selected="true"]')?.getAttribute("data-cart-id") ||
          null;
        if (id) {
          // Focus the quantity input for the selected item
          const qtyInput = document.querySelector<HTMLInputElement>(`[data-cart-qty-input="${id}"]`);
          if (qtyInput) {
            // Use requestAnimationFrame to ensure focus happens after any competing handlers
            requestAnimationFrame(() => {
              qtyInput.focus();
              qtyInput.select();
            });
          }
        }
      } else if (e.ctrlKey && key.toLowerCase() === "d") {
        e.preventDefault();
        e.stopPropagation();
        const id =
          selectedRowId ||
          document.querySelector<HTMLElement>('[data-cart-selected="true"]')?.getAttribute("data-cart-id") ||
          null;
        if (id) dispatch("cart:delete-item", { id });
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [selectedRowId]);
}
