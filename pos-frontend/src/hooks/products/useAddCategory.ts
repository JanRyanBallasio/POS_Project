// ...existing code...
import { useState } from "react";
import axios from "@/lib/axios"; // use axios so baseURL '/api' is applied
import type { Category } from "@/hooks/categories/useCategoryApi";

type Payload = { name: string };
type Options = { onSuccess?: (created: Category | any) => void };

export const useAddCategory = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const addCategory = async (payload: Payload, options?: Options) => {
    setLoading(true);
    setError(null);

    try {
      // post to relative path so axios.baseURL (/api) prefixes -> /api/categories
      const res = await axios.post("/categories", payload);
      const json = res.data;
      const created = json?.data ?? json;
      options?.onSuccess?.(created);
      setLoading(false);
      return created;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to create category";
      setError(message);
      setLoading(false);
      throw err;
    }
  };

  return { addCategory, loading, error };
};

export default useAddCategory;
// ...existing code...