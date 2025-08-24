
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  RefObject,
  useEffect,
} from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";

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
  updateCartItemPrice: (id: string, price: number) => void; // <--- added
  deleteCartItem: (id: string) => void; // <--- added
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerInputRef, setScannerInputRef] =
    useState<RefObject<HTMLInputElement> | null>(null);

  const clearCart = () => setCart([]);
  const setScannerRef = (ref: RefObject<HTMLInputElement>) => {
    setScannerInputRef(ref);
  };

  const refocusScanner = () => {
    setTimeout(() => {
      if (scannerInputRef?.current) {
        scannerInputRef.current.focus();
      }
    }, 100);
  };

  const updateCartItemQuantity = (id: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // new: update price for a cart item (updates only the cart's product.price)
  const updateCartItemPrice = (id: string, price: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, product: { ...item.product, price } } : item
      )
    );
  };

  // new: remove item from cart by id
  const deleteCartItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const scanAndAddToCart = async (barcode: string): Promise<void> => {
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
        setScanError(`Product not found: ${barcode}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error scanning barcode";
      setScanError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }, [cart]);

  const value = {
    cart,
    cartTotal,
    scanError,
    isScanning,
    scanAndAddToCart,
    refocusScanner,
    setScannerRef,
    updateCartItemQuantity,
    updateCartItemPrice, // <--- added to value
    deleteCartItem, // <--- added to value
    clearCart,
  };

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
