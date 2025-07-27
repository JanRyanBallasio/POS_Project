const API_BASE_URL = "http://localhost:5000/api";

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
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    const data: ApiResponse<Category[]> = await response.json();
    return data.data || [];
  },
};