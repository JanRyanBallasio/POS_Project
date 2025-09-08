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
  lastAddedItemId: string | null;
  scanAndAddToCart: (barcode: string, preValidatedProduct?: Product | null) => Promise<void>;
  addProductToCart: (product: Product) => void;
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
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [scannerInputRef, setScannerInputRef] =
    useState<RefObject<HTMLInputElement> | null>(null);
  const [pendingScans, setPendingScans] = useState<Set<string>>(new Set());
  const [lastScanTime, setLastScanTime] = useState<Map<string, number>>(new Map());

  const { setBarcode: setContextBarcode, openModal, setOpen: setProductModalOpen } =
    useProductModal();

  const clearCart = useCallback(() => {
    setCart([]);
    setLastAddedItemId(null);
    setLastScanTime(new Map());
  }, []);

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
    setLastAddedItemId(prev => prev === id ? null : prev);
  }, []);

  const addOrIncrement = useCallback((product: Product) => {
    const now = Date.now();
    const productKey = product.barcode || product.id?.toString() || product.name;
    
    // Check for recent addition of the same product (within 1 second)
    const lastTime = lastScanTime.get(productKey);
    if (lastTime && (now - lastTime) < 1000) {
      console.log("🛒 Cart: Duplicate addition prevented for:", productKey);
      return;
    }
    
    setLastScanTime(prev => new Map(prev).set(productKey, now));
    
    setCart((prevCart) => {
      const existing = prevCart.find((item) => productEqual(item.product, product));
      if (existing) {
        setLastAddedItemId(existing.id);
        console.log("🛒 Cart: Incrementing existing item:", product.name);
        return prevCart.map((item) =>
          productEqual(item.product, product) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const cartItem: CartItem = {
        product,
        quantity: 1,
        id: genId(),
      };
      setLastAddedItemId(cartItem.id);
      console.log("🛒 Cart: Adding new item:", product.name);
      return [...prevCart, cartItem];
    });
  }, [lastScanTime]);

  const addProductToCart = useCallback((product: Product) => {
    addOrIncrement(product);
  }, [addOrIncrement]);

  const scanAndAddToCart = useCallback(
    async (barcode: string, preValidatedProduct?: Product | null): Promise<void> => {
      if (!barcode) return;

      const cleanedBarcode = String(barcode).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      if (!cleanedBarcode) {
        setScanError("Invalid barcode");
        return;
      }

      if (pendingScans.has(cleanedBarcode)) {
        console.log("🛒 Cart: Scan already pending for:", cleanedBarcode);
        return;
      }

      try {
        setIsScanning(true);
        setScanError(null);
        setPendingScans(prev => new Set([...prev, cleanedBarcode]));

        console.log("🛒 Cart: scanAndAddToCart called with barcode:", cleanedBarcode);
        console.log("🛒 Cart: preValidatedProduct:", preValidatedProduct);

        let product: Product | null = null;

        // Use pre-validated product if provided
        if (preValidatedProduct) {
          console.log("✅ Cart: Using pre-validated product:", preValidatedProduct);
          product = preValidatedProduct;
        } else {
          console.log("🌐 Cart: No pre-validated product, fetching from API...");
          try {
            product = await productApi.getByBarcode(cleanedBarcode);
            console.log("🛒 Cart: productApi.getByBarcode result:", product);
          } catch (apiError) {
            console.log("❌ Cart: API fetch failed:", apiError);
            product = null;
          }
        }

        if (product) {
          console.log("✅ Cart: Adding product to cart:", product);
          addOrIncrement(product);
          setScanError(null);
        } else {
          console.log("❌ Cart: Product not found, opening register modal");
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
        console.log("❌ Cart: scanAndAddToCart error:", error);
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

      try {
        const el = scannerInputRef?.current;
        if (el) {
          try { el.value = ""; } catch { }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          try { el.focus(); } catch { }
        }
      } catch { }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener("product:added", onProductAdded as EventListener);
      return () => window.removeEventListener("product:added", onProductAdded as EventListener);
    }
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
      lastAddedItemId,
      scanAndAddToCart,
      addProductToCart,
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
      lastAddedItemId,
      scanAndAddToCart,
      addProductToCart,
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
  const { cart, updateCartItemQuantity, refocusScanner } = useCart();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const isScanner = target.id === 'barcode-scanner' || target.classList?.contains('barcode-scanner-input');
      const isBody = target.tagName === 'BODY';
      
      // Handle numpad 0 for refocusing - only if not typing in an input
      if ((e.key === "0" && e.code === "Numpad0") || e.key === "F5") {
        // Don't interfere if user is typing in search or other inputs
        if (!isInput || isScanner) {
          e.preventDefault();
          e.stopPropagation();
          refocusScanner();
          window.dispatchEvent(new Event('focusBarcodeScanner'));
        }
        return;
      }
      
      if (!selectedRowId) return;
      // Only handle +/- keys if not typing in inputs (except scanner)
      if (!isBody && !isScanner && isInput) return;
      
      const isPlusKey = e.key === "+" || e.code === "NumpadAdd" || (e.code === "Equal" && e.shiftKey);
      const isMinusKey = e.key === "-" || e.code === "NumpadSubtract" || e.code === "Minus";

      if (isPlusKey || isMinusKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const item = cart.find((i) => i.id === selectedRowId);
        if (!item) return;

        if (isPlusKey) {
          updateCartItemQuantity(item.id, item.quantity + 1);
        } else if (item.quantity > 1) {
          updateCartItemQuantity(item.id, item.quantity - 1);
        }
        
        setTimeout(() => {
          refocusScanner();
          window.dispatchEvent(new Event('focusBarcodeScanner'));
        }, 50);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [selectedRowId, cart, updateCartItemQuantity, refocusScanner]);
};