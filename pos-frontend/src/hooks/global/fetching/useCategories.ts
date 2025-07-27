import { useState, useEffect } from "react";
import { categoryApi } from "@/hooks/categories/useCategoryApi";
export interface Category {
  id: number;
  name: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};