import useSWR, { mutate as globalMutate } from "swr";
import { categoryApi, Category } from "@/hooks/categories/useCategoryApi";

// Use a non-path SWR key so it can't be mistaken for a URL
export const CATEGORIES_KEY = "categories:list";

const fetcher = async (): Promise<Category[]> => {
  try {
    return await categoryApi.getAll();
  } catch {
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
    refetch: mutate,
    mutate: globalMutate
  };
};