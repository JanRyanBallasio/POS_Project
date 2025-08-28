import useSWR, { mutate as globalMutate } from "swr";
import { categoryApi, CATEGORIES_KEY } from "@/hooks/categories/useCategoryApi";

export const useCategories = () => {
  const { data, error, mutate } = useSWR(CATEGORIES_KEY, () => categoryApi.getAll(), {
    revalidateOnFocus: true,
  });

  return {
    categories: data ?? [],
    loading: !error && !data,
    error: error ? (error as Error).message : null,
    refetch: mutate,     // call this to revalidate
    mutate: globalMutate // optional global mutate if you need it elsewhere
  };
};