// ...existing code...
import useSWR from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";

// canonical SWR key used across app
export const PRODUCTS_KEY = "/api/products";

const fetcher = async (): Promise<Product[]> => {
  try {
    return await productApi.getAll();
  } catch {
    // keep UI stable: return empty array on fetch error
    return [];
  }
};

export const useProducts = () => {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(PRODUCTS_KEY, fetcher, {
    revalidateOnFocus: true,
  });

  return {
    products: data ?? [],
    loading: !!isLoading,
    error: error ? (error as Error).message : null,
    refetch: mutate,
  };
};
// ...existing code...