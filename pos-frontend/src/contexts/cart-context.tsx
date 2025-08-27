// ...existing code...
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  RefObject,
  useEffect,
  useCallback,
} from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { useProductModal } from "@/contexts/productRegister-context";

interface CartItem {
  product: Product;
  quantity: number;
  id: string;
}

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  scanError: string | null;
  isScanning: boolean;
  scanAndAddToCart: (barcode: string) => Promise<void>;
  refocusScanner: () => void;
  setScannerRef: (ref: RefObject<HTMLInputElement>) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  deleteCartItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerInputRef, setScannerInputRef] =
    useState<RefObject<HTMLInputElement> | null>(null);

  const { setBarcode: setContextBarcode, openModal, setOpen: setProductModalOpen } =
    useProductModal();

  const clearCart = useCallback(() => setCart([]), []);

  const setScannerRef = useCallback((ref: RefObject<HTMLInputElement>) => {
    setScannerInputRef(ref);
  }, []);

  const refocusScanner = useCallback(() => {
    setTimeout(() => {
      try {
        if (scannerInputRef?.current) {
          scannerInputRef.current.focus();
        }
      } catch {}
    }, 100);
  }, [scannerInputRef]);

  const updateCartItemQuantity = useCallback((id: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const updateCartItemPrice = useCallback((id: string, price: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, product: { ...item.product, price } } : item
      )
    );
  }, []);

  const deleteCartItem = useCallback((id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  }, []);

  const scanAndAddToCart = useCallback(
    async (barcode: string): Promise<void> => {
      if (!barcode) return;
      try {
        setIsScanning(true);
        setScanError(null);

        const product = await productApi.getByBarcode(barcode);

        if (product) {
          setCart((prevCart) => {
            const existing = prevCart.find(
              (item) => item.product.barcode === product.barcode
            );
            if (existing) {
              return prevCart.map((item) =>
                item.product.barcode === product.barcode
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              );
            } else {
              const cartItem: CartItem = {
                product,
                quantity: 1,
                id: Date.now().toString(),
              };
              return [...prevCart, cartItem];
            }
          });
        } else {
          // Product not found: open add-product modal and prefill barcode
          if (typeof setContextBarcode === "function") {
            setContextBarcode(barcode);
          }
          if (typeof openModal === "function") {
            openModal("addProduct");
          } else if (typeof setProductModalOpen === "function") {
            setProductModalOpen(true);
          }
          setScanError(`Product not found: ${barcode}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error scanning barcode";
        setScanError(errorMessage);
      } finally {
        setIsScanning(false);
        // refocus scanner for the next scan
        refocusScanner();
      }
    },
    [openModal, setProductModalOpen, setContextBarcode, refocusScanner]
  );

  // Listen for product:added events so newly created products can be added immediately
  useEffect(() => {
    const onProductAdded = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;

      const addedProduct: Product | undefined = detail.product;
      const barcode: string | undefined = detail.barcode;

      // If product object was returned by the modal, add it directly to cart (no backend round-trip)
      if (addedProduct) {
        setCart((prevCart) => {
          const existing = prevCart.find((item) => item.product.barcode === addedProduct.barcode);
          if (existing) {
            return prevCart.map((item) =>
              item.product.barcode === addedProduct.barcode ? { ...item, quantity: item.quantity + 1 } : item
            );
          } else {
            const cartItem: CartItem = {
              product: addedProduct,
              quantity: 1,
              id: Date.now().toString(),
            };
            return [...prevCart, cartItem];
          }
        });
      } else if (barcode) {
        // if only barcode was provided, attempt to fetch product and add (defensive)
        (async () => {
          try {
            const product = await productApi.getByBarcode(barcode);
            if (product) {
              setCart((prevCart) => {
                const existing = prevCart.find((item) => item.product.barcode === product.barcode);
                if (existing) {
                  return prevCart.map((item) =>
                    item.product.barcode === product.barcode ? { ...item, quantity: item.quantity + 1 } : item
                  );
                } else {
                  const cartItem: CartItem = {
                    product,
                    quantity: 1,
                    id: Date.now().toString(),
                  };
                  return [...prevCart, cartItem];
                }
              });
            }
          } catch {
            // ignore fetch errors here; modal likely handled creation
          }
        })();
      }

      // Clear the hidden scanner input value so the next hardware scan starts fresh,
      // dispatch an 'input' event so the barcode hook's React state stays in sync, then focus.
      try {
        const el = scannerInputRef?.current;
        if (el) {
          try {
            el.value = "";
          } catch {}
          // Sync any listeners (handleBarcodeChange) with an input event
          el.dispatchEvent(new Event("input", { bubbles: true }));
          // Focus after a short delay to ensure scanner writes into the empty field
          setTimeout(() => {
            try {
              el.focus();
              // defensive caret reset
              if (typeof el.setSelectionRange === "function") {
                el.setSelectionRange(0, 0);
              }
            } catch {}
          }, 50);
        }
      } catch {}
    };

    window.addEventListener("product:added", onProductAdded as EventListener);
    return () => window.removeEventListener("product:added", onProductAdded as EventListener);
  }, [scannerInputRef]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      cartTotal,
      scanError,
      isScanning,
      scanAndAddToCart,
      refocusScanner,
      setScannerRef,
      updateCartItemQuantity,
      updateCartItemPrice,
      deleteCartItem,
      clearCart,
    }),
    [
      cart,
      cartTotal,
      scanError,
      isScanning,
      scanAndAddToCart,
      refocusScanner,
      setScannerRef,
      updateCartItemQuantity,
      updateCartItemPrice,
      deleteCartItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const useCartKeyboard = (selectedRowId: string | null) => {
  const { cart, updateCartItemQuantity } = useCart();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedRowId) return;
      if (e.key === "+") {
        const item = cart.find((i) => i.id === selectedRowId);
        if (item) updateCartItemQuantity(item.id, item.quantity + 1);
      }
      if (e.key === "-") {
        const item = cart.find((i) => i.id === selectedRowId);
        if (item && item.quantity > 1)
          updateCartItemQuantity(item.id, item.quantity - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRowId, cart, updateCartItemQuantity]);
};