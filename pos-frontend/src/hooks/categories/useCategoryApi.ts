// ...existing code...
import axios from "@/lib/axios";

// change to match products pattern (use relative path; axios.baseURL already = "/api")
export const CATEGORIES_KEY = "/categories";

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
    // use the same relative path pattern as productApi so axios.baseURL applies
    const resp = await axios.get(CATEGORIES_KEY);
    const data: ApiResponse<Category[]> = resp.data;
    return data?.data ?? [];
  },
};
// ...existing code...