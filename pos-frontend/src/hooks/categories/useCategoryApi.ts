import axios from "@/lib/axios";

// Use an internal API path constant (not a SWR key)
export const CATEGORY_API = "/categories";

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
    // /api baseURL + /categories = /api/categories
    const resp = await axios.get(CATEGORY_API);
    const data: ApiResponse<Category[]> = resp.data;
    return data?.data ?? [];
  },
};