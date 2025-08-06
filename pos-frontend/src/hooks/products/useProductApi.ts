const API_BASE_URL = process.env.NEXT_PUBLIC_backend_api_url;


export interface Product {
  id: number;
  name: string;
  barcode?: string;
  price: number;
  quantity: number;
  category_id: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export const productApi = {
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    const data: ApiResponse<Product[]> = await response.json();
    return data.data || [];
  },

  async create(product: Omit<Product, "id">): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const data: ApiResponse<Product> = await response.json();
    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Failed to create product: ${response.status}`;
      const error: any = new Error(errorMsg);
      error.response = data;
      throw error;
    }
    return data.data;
  },

  async update(id: number, product: Omit<Product, "id">): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const data: ApiResponse<Product> = await response.json();
    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Failed to update product: ${response.status}`;
      const error: any = new Error(errorMsg);
      error.response = data;
      throw error;
    }
    return data.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data: ApiResponse<null> = await response.json();
      const errorMsg = data?.error || data?.message || `Failed to delete product: ${response.status}`;
      throw new Error(errorMsg);
    }
  },

  async getByBarcode(barcode: string): Promise<Product | null> {
    const response = await fetch(`${API_BASE_URL}/products/barcode/${barcode}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }
    const data: ApiResponse<Product> = await response.json();
    return data.data;
  },
};