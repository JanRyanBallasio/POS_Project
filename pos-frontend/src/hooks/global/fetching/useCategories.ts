import useSWR, { mutate as globalMutate } from "swr";
import { categoryApi, Category } from "@/hooks/categories/useCategoryApi";

// Use the same pattern as products
export const CATEGORIES_KEY = "/categories";

const fetcher = async (): Promise<Category[]> => {
  try {
    return await categoryApi.getAll();
  } catch {
    // keep UI stable: return empty array on fetch error
    return [];
  }
};

export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(CATEGORIES_KEY, fetcher, {
    revalidateOnFocus: true,
  });

  return {
    categories: data ?? [],
    loading: !!isLoading,
    error: error ? (error as Error).message : null,
    refetch: mutate,     // call this to revalidate
    mutate: globalMutate // optional global mutate if you need it elsewhere
  };
};