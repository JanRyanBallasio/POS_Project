import { useState } from "react";
import { mutate } from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";

// Use consistent key
const PRODUCTS_KEY = "products:list";

type CreateInput = Omit<Product, "id">;
type FieldError = { field?: string; message: string } | null;

export function useAddProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FieldError>(null);
  const [success, setSuccess] = useState(false);

  const addProduct = async (product: CreateInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create product
      const createdProduct = await productApi.create(product);

      // Optimistic update - prepend new product
      mutate(
        PRODUCTS_KEY,
        (current: Product[] = []) => [createdProduct, ...current],
        false
      );

      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent("product:added", {
        detail: { product: createdProduct }
      }));

      setSuccess(true);
      setLoading(false);

      // Final revalidation
      mutate(PRODUCTS_KEY);

      return createdProduct;
    } catch (err: any) {
      const message = err?.message || "Failed to add product";
      
      // Handle field-specific errors
      if (message.toLowerCase().includes("barcode")) {
        setError({ field: "barcode", message });
      } else if (message.toLowerCase().includes("name")) {
        setError({ field: "name", message });
      } else {
        setError({ message });
      }
      
      setLoading(false);
      return null;
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    addProduct,
    loading,
    error,
    success,
    reset,
  };
}