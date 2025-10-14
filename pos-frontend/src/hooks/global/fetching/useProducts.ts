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
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10_000,
      errorRetryCount: 2,
      refreshInterval: 0,
      compare: (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        return a.every((item, index) => item.id === b[index].id && item.name === b[index].name);
      },
    }
  );

  return {
    products: data ?? [],
    loading: !!isLoading,
    error: error ? (error as Error).message : null,
    refetch: mutate,
  };
};