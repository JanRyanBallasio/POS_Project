import { useState, useEffect } from "react";
import { Product, productApi } from "@/lib/api";

interface CartItem {
  product: Product;
  quantity: number;
  id: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
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
          id: Date.now().toString(), // Unique ID for this scan
        };

        setCart((prevCart) => [...prevCart, cartItem]);
        console.log("✅ Product added to cart:", product.name);
      } else {
        setScanError(`❌ Product not found: ${barcode}`);
        console.log("❌ Product not found:", barcode);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error scanning barcode";
      setScanError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    cart,
    scanError,
    isScanning,
    scanAndAddToCart,
    refetch: fetchProducts,
  };
};
