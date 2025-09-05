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

const genId = () =>
  typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : Date.now().toString();

const productEqual = (a: Product, b: Product) => {
  if (a?.id && b?.id) return a.id === b.id;
  return Boolean(a?.barcode && b?.barcode && a.barcode === b.barcode);
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerInputRef, setScannerInputRef] =
    useState<RefObject<HTMLInputElement> | null>(null);
  const [pendingScans, setPendingScans] = useState<Set<string>>(new Set());

  const { setBarcode: setContextBarcode, openModal, setOpen: setProductModalOpen } =
    useProductModal();

  const clearCart = useCallback(() => setCart([]), []);

  const setScannerRef = useCallback((ref: RefObject<HTMLInputElement>) => {
    setScannerInputRef(ref);
  }, []);

  const refocusScanner = useCallback(() => {
    try {
      if (scannerInputRef?.current) {
        scannerInputRef.current.focus();
      }
    } catch { }
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

  const addOrIncrement = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => productEqual(item.product, product));
      if (existing) {
        return prevCart.map((item) =>
          productEqual(item.product, product) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const cartItem: CartItem = {
        product,
        quantity: 1,
        id: genId(),
      };
      return [...prevCart, cartItem];
    });
  }, []);

  const scanAndAddToCart = useCallback(
    async (barcode: string): Promise<void> => {
      if (!barcode) return;

      const cleanedBarcode = String(barcode).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      if (!cleanedBarcode) {
        setScanError("Invalid barcode");
        return;
      }

      // Prevent duplicate concurrent requests
      if (pendingScans.has(cleanedBarcode)) {
        return;
      }

      try {
        setIsScanning(true);
        setScanError(null);
        setPendingScans(prev => new Set([...prev, cleanedBarcode]));

        const product = await productApi.getByBarcode(cleanedBarcode);

        if (product) {
          addOrIncrement(product);
          setScanError(null); // Clear any previous errors
        } else {
          try {
            if (typeof setContextBarcode === "function") {
              setContextBarcode(cleanedBarcode);
            }
            if (typeof openModal === "function") {
              openModal("addProduct");
            } else if (typeof setProductModalOpen === "function") {
              setProductModalOpen(true);
            }
          } catch { }
          setScanError(`Product not found: ${cleanedBarcode}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error scanning barcode";
        setScanError(errorMessage);
        console.warn('[scanAndAddToCart] Error:', error);
      } finally {
        setPendingScans(prev => {
          const next = new Set(prev);
          next.delete(cleanedBarcode);
          return next;
        });
        setIsScanning(false);
        refocusScanner();
      }
    },
    [pendingScans, openModal, setProductModalOpen, setContextBarcode, refocusScanner, addOrIncrement]
  );

  // Listen for product:added events so newly created products can be added immediately
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
          } catch {
            // ignore fetch errors here
          }
        })();
      }

      // Clear and refocus hidden scanner input
      try {
        const el = scannerInputRef?.current;
        if (el) {
          try { el.value = ""; } catch { }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          try { el.focus(); } catch { }
        }
      } catch { }
    };

    window.addEventListener("product:added", onProductAdded as EventListener);
    return () => window.removeEventListener("product:added", onProductAdded as EventListener);
  }, [scannerInputRef, addOrIncrement]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + Number(item.product.price || 0) * item.quantity, 0);
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