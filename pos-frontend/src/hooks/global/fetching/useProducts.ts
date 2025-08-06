import useSWR from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";

const fetcher = async () => {
  return await productApi.getAll();
};

export const useProducts = () => {
  const { data, error, isLoading, mutate } = useSWR(process.env.NEXT_PUBLIC_backend_api_url + "/products", fetcher);
  return {
    products: data || [],
    loading: isLoading,
    error,
    refetch: mutate, // you can call this to manually refetch if needed
  };
};