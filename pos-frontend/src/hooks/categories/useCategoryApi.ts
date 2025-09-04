import axios from "@/lib/axios";

// Match the products pattern exactly
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
    // This will call /categories + axios baseURL /api = /api/categories
    const resp = await axios.get(CATEGORIES_KEY);
    const data: ApiResponse<Category[]> = resp.data;
    return data?.data ?? [];
  },
};