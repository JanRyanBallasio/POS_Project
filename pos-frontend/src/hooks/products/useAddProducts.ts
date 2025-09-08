import { useState } from "react";
import { mutate } from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { AxiosError } from "axios";

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
      console.log("Adding product:", product);
      
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
      console.error('Add product error:', err);
      
      // 🔥 ENHANCED: Better error handling for all cases
      if (err.response?.data) {
        const serverError = err.response.data;
        console.log("Server error response:", serverError);
        
        // Server sent field-specific error (400 status)
        if (serverError.field && serverError.message) {
          setError({ 
            field: serverError.field, 
            message: serverError.message 
          });
        } 
        // Server sent general error message
        else if (serverError.message) {
          setError({ message: serverError.message });
        } 
        // Server error without message
        else if (serverError.error) {
          setError({ message: serverError.error });
        }
        // 500 errors - check if it's actually a validation issue
        else if (err.response.status === 500) {
          setError({ message: "Server error while processing request. Please try again." });
        }
        else {
          setError({ message: "Failed to add product. Please try again." });
        }
      } 
      // Network or client-side errors
      else if (err.message) {
        setError({ message: err.message });
      } 
      // Fallback for unknown errors
      else {
        setError({ message: "Failed to add product. Please check your connection and try again." });
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