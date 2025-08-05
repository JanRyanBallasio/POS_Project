import useSWR from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";

const fetcher = async () => {
  return await productApi.getAll();
};

export const useProducts = () => {
  const { data, error, isLoading, mutate } = useSWR("http://13.211.162.106:5000/api/products", fetcher);

  return {
    products: data || [],
    loading: isLoading,
    error,
    refetch: mutate, // you can call this to manually refetch if needed
  };
};