// ...existing code...
import axios from "@/lib/axios";

// Fix: Change to match the rewrite pattern
export const CATEGORIES_KEY = "/api/categories";

export interface Category {
  id: number;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export const categoryApi = {
  async getAll(): Promise<Category[]> {
    // Now this will call /api/categories which gets rewritten to backend
    const resp = await axios.get(CATEGORIES_KEY);
    const data: ApiResponse<Category[]> = resp.data;
    return data?.data ?? [];
  },
};
// ...existing code...