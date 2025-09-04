// ...existing code...
import axios from "@/lib/axios";

export const CATEGORIES_KEY = "/api/categories"
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
    const resp = await axios.get(CATEGORIES_KEY); // goes to /api/categories via axios.baseURL
    // axios response shape: resp.data should contain { success, data, ... }
    const data: ApiResponse<Category[]> = resp.data;
    return data?.data ?? [];
  },
};
// ...existing code...