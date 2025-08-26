const rawBase = process.env.NEXT_PUBLIC_backend_api_url ?? "";
const cleanedBase = String(rawBase).replace(/^["']|["']$/g, "").replace(/\/+$/g, "");
export const CATEGORIES_KEY = cleanedBase ? `${cleanedBase}/categories` : `/categories`;

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
    const response = await fetch(CATEGORIES_KEY);
    if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
    const data: ApiResponse<Category[]> = await response.json();
    return data?.data ?? [];
  },
};