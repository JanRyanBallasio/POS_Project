// ...existing code...
const API_BASE_URL = (process.env.NEXT_PUBLIC_backend_api_url || "").replace(/\/$/, "");

export interface Product {
  id: number;
  name: string;
  barcode?: string;
  price: number;
  quantity: number;
  category_id: number;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const productApi = {
  async getAll(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        // return empty list instead of throwing to keep UI stable
        return [];
      }
      const json: ApiResponse<Product[]> = await response.json().catch(() => ({ data: [] }));
      return json.data ?? [];
    } catch {
      return [];
    }
  },

  async create(product: Omit<Product, "id">): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const json: ApiResponse<Product> = await response.json().catch(() => ({ data: null } as any));
    if (!response.ok) {
      const errorMsg = json?.error || json?.message || `Failed to create product: ${response.status}`;
      throw new Error(errorMsg);
    }
    return json.data as Product;
  },

  async update(id: number, product: Omit<Product, "id">): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const json: ApiResponse<Product> = await response.json().catch(() => ({ data: null } as any));
    if (!response.ok) {
      const errorMsg = json?.error || json?.message || `Failed to update product: ${response.status}`;
      throw new Error(errorMsg);
    }
    return json.data as Product;
  },

  async getById(id: number): Promise<Product | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch product with id ${id}`);
      }
      const json: ApiResponse<Product> = await response.json().catch(() => ({ data: null } as any));
      return json.data ?? null;
    } catch {
      return null;
    }
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const errorMsg = json?.error || json?.message || `Failed to delete product: ${response.status}`;
      throw new Error(errorMsg);
    }
  },

  // Prefer query param endpoint (safe) -> dedicated route -> fallback to local search
  async getByBarcode(barcode: string): Promise<Product | null> {
    if (!barcode) return null;

    // 1) query param (returns array, safe 200)
    try {
      const qRes = await fetch(`${API_BASE_URL}/products?barcode=${encodeURIComponent(String(barcode))}`);
      if (qRes.ok) {
        const qJson: ApiResponse<Product[]> = await qRes.json().catch(() => ({ data: [] }));
        const arr = qJson.data ?? [];
        return arr.length > 0 ? arr[0] : null;
      }
    } catch {
      /* ignore and try next */
    }

    // 2) dedicated route (may return data:null or 200/404)
    try {
      const r = await fetch(`${API_BASE_URL}/products/barcode/${encodeURIComponent(String(barcode))}`);
      if (r.ok) {
        const json: ApiResponse<Product | null> = await r.json().catch(() => ({ data: null } as any));
        return json.data ?? null;
      }
    } catch {
      /* ignore and try fallback */
    }

    // 3) final fallback: fetch all and search locally
    try {
      const all = await productApi.getAll();
      return all.find(p => String(p.barcode) === String(barcode)) ?? null;
    } catch {
      return null;
    }
  },

  async getByName(name: string): Promise<Product | null> {
    if (!name) return null;

    // 1) query param (safe)
    try {
      const qRes = await fetch(`${API_BASE_URL}/products?name=${encodeURIComponent(String(name))}`);
      if (qRes.ok) {
        const qJson: ApiResponse<Product[]> = await qRes.json().catch(() => ({ data: [] }));
        const arr = qJson.data ?? [];
        if (arr.length > 0) {
          const exact = arr.find(p => (p.name || "").toLowerCase() === name.trim().toLowerCase());
          return exact ?? arr[0];
        }
        return null;
      }
    } catch {}

    // 2) dedicated route
    try {
      const r = await fetch(`${API_BASE_URL}/products/name/${encodeURIComponent(String(name))}`);
      if (r.ok) {
        const json: ApiResponse<Product | null> = await r.json().catch(() => ({ data: null } as any));
        return json.data ?? null;
      }
    } catch {}

    // 3) fallback to local search
    try {
      const all = await productApi.getAll();
      const lower = name.trim().toLowerCase();
      return all.find(p => (p.name || "").toLowerCase() === lower) ?? null;
    } catch {
      return null;
    }
  },
};
// ...existing code...