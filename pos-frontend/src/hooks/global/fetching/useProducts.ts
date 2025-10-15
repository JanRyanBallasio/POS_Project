// useProducts: add `enabled` param to control when fetching occurs
import useSWR from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";

const PRODUCTS_KEY = "products:list";

const fetcher = async (): Promise<Product[]> => {
  try {
    return await productApi.getAll();
  } catch (error) {
    console.warn('Failed to fetch products:', error);
    return [];
  }
};

export const useProducts = (enabled: boolean = true) => {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    enabled ? PRODUCTS_KEY : null,
    fetcher,
    {
      revalidateOnFocus: true, // Revalidate when window gains focus
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Reduced from 10 seconds to 2 seconds for faster updates
      errorRetryCount: 2,
      refreshInterval: 0,
      compare: (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        // More thorough comparison including price and quantity
        return a.every((item, index) => {
          const bItem = b[index];
          return item.id === bItem.id &&
                 item.name === bItem.name &&
                 item.price === bItem.price &&
                 item.quantity === bItem.quantity;
        });
      },
    }
  );

  return {
    products: data ?? [],
    loading: !!isLoading,
    error: error ? (error as Error).message : null,
    refetch: () => mutate(undefined, { revalidate: true }), // Force revalidation
  };
};