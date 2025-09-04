import axios from "@/lib/axios";

// Use a different key for SWR cache, keep API endpoint simple
export const CATEGORIES_KEY = "categories"; // SWR cache key
const API_ENDPOINT = "/categories"; // API endpoint

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
    const resp = await axios.get(API_ENDPOINT);
    const data: ApiResponse<Category[]> = resp.data;
    return data?.data ?? [];
  },
};