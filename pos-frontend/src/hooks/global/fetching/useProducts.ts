import useSWR from "swr";
import { productApi, Product, PRODUCTS_KEY } from "@/hooks/products/useProductApi";

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
    revalidateOnReconnect: true,
    dedupingInterval: 30_000, // Reduced for more real-time feel
    errorRetryCount: 3,
    refreshInterval: 0, // Disable polling by default, use event-driven updates
  });

  return {
    products: data ?? [],
    loading: !!isLoading,
    error: error ? (error as Error).message : null,
    refetch: mutate,
  };
};