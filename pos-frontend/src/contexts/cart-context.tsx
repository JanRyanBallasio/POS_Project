import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  RefObject,
} from "react";
import { Product, productApi } from "@/lib/api";

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerInputRef, setScannerInputRef] =
    useState<RefObject<HTMLInputElement> | null>(null);

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

  const scanAndAddToCart = async (barcode: string): Promise<void> => {
    try {
      setIsScanning(true);
      setScanError(null);

      const product = await productApi.getByBarcode(barcode);

      if (product) {
        const cartItem: CartItem = {
          product,
          quantity: 1,
          id: Date.now().toString(), // Unique ID
        };

        setCart((prevCart) => [...prevCart, cartItem]);
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
