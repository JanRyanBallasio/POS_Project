import { useState, useEffect, useMemo } from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";

interface CartItem {
  product: Product;
  quantity: number;
  id: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
};
