import { mutate } from "swr";
import axios from '@/lib/axios';
import { isAxiosError } from 'axios';

export const PRODUCTS_KEY = "products:list";
export interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  price: number;
  quantity: number;
  category_id: number;
  created_at?: string | null;
  [k: string]: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// Cache configuration
type CacheEntry = { product: Product; ts: number };
const BARCODE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 1000;
const STORAGE_KEY = "pos:barcode-cache";
let saveTimer: number | null = null;
const SAVE_DEBOUNCE_MS = 500;

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function loadCacheFromStorage(): void {
  try {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return;
    Object.keys(parsed).forEach((k) => {
      const entry = parsed[k];
      if (isPlainObject(entry) && entry.product && typeof entry.ts === "number") {
        BARCODE_CACHE.set(k, { product: entry.product as Product, ts: entry.ts });
      }
    });
  } catch {
    // ignore any parse errors
  }
}

function scheduleSaveCacheToStorage(): void {
  try {
    if (typeof window === "undefined") return;
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = window.setTimeout(() => {
      try {
        const obj: Record<string, CacheEntry> = {};
        BARCODE_CACHE.forEach((v, k) => {
          obj[k] = v;
        });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch {
        /* ignore */
      } finally {
        saveTimer = null;
      }
    }, SAVE_DEBOUNCE_MS);
  } catch { /* ignore */ }
}

function cacheSet(product: Product): void {
  if (!product || !product.barcode) return;

  // Implement LRU eviction
  if (BARCODE_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = BARCODE_CACHE.keys().next().value;
    if (oldestKey) BARCODE_CACHE.delete(oldestKey);
  }

  const key = String(product.barcode);
  BARCODE_CACHE.set(key, { product, ts: Date.now() });
  scheduleSaveCacheToStorage();
}

function cacheGet(barcode: string): Product | null {
  if (!barcode) return null;
  const key = String(barcode);
  const entry = BARCODE_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    BARCODE_CACHE.delete(key);
    scheduleSaveCacheToStorage();
    return null;
  }
  return entry.product;
}

function cacheDeleteByBarcode(barcode: string | number): void {
  try {
    const key = String(barcode);
    if (BARCODE_CACHE.delete(key)) {
      scheduleSaveCacheToStorage();
    }
  } catch { /* ignore */ }
}

function cacheDeleteById(id: number): void {
  try {
    let removed = false;
    for (const [k, v] of Array.from(BARCODE_CACHE.entries())) {
      if (v?.product?.id === id) {
        BARCODE_CACHE.delete(k);
        removed = true;
      }
    }
    if (removed) scheduleSaveCacheToStorage();
  } catch { /* ignore */ }
}

// Initialize cache from storage (browser only)
if (typeof window !== "undefined") {
  try {
    loadCacheFromStorage();
  } catch { /* ignore */ }
}

type ProductsListShape = Product[] | { data: Product[]; count?: number;[k: string]: any };

function prependProductToList(old: ProductsListShape | undefined | null, created: Product): ProductsListShape {
  if (!old) return [created];
  if (Array.isArray(old)) {
    return [created, ...(old as Product[])];
  }
  if (isPlainObject(old) && Array.isArray(old.data)) {
    const data = old.data as Product[];
    return { ...old, data: [created, ...data], count: (old.count ?? data.length) + 1 };
  }
  return old;
}

function replaceProductInList(old: ProductsListShape | undefined | null, updated: Product): ProductsListShape | undefined | null {
  if (!old) return old;
  if (Array.isArray(old)) {
    return (old as Product[]).map((p) => (p.id === updated.id ? updated : p));
  }
  if (isPlainObject(old) && Array.isArray(old.data)) {
    return { ...old, data: (old.data as Product[]).map((p) => (p.id === updated.id ? updated : p)) };
  }
  return old;
}

function removeProductFromList(old: ProductsListShape | undefined | null, id: number): ProductsListShape | undefined | null {
  if (!old) return old;
  if (Array.isArray(old)) {
    return (old as Product[]).filter((p) => p.id !== id);
  }
  if (isPlainObject(old) && Array.isArray(old.data)) {
    const newData = (old.data as Product[]).filter((p) => p.id !== id);
    return { ...old, data: newData, count: Math.max(0, (old.count ?? (old.data as Product[]).length) - 1) };
  }
  return old;
}

export const productApi = {
  async getAll(): Promise<Product[]> {
    try {
      const response = await axios.get('/products');
      if (response.status >= 400) {
        return [];
      }
      const json = response.data as ApiResponse<Product[]>;
      return json.data ?? [];
    } catch {
      return [];
    }
  },

  async create(product: Omit<Product, "id">): Promise<Product> {
    const response = await axios.post('/products', product);
    const json = response.data as ApiResponse<Product>;
    if (response.status >= 400) {
      const errorMsg = json?.error || json?.message || `Failed to create product: ${response.status}`;
      throw new Error(errorMsg);
    }
    const created = json.data as Product;
    try { cacheSet(created); } catch { /* ignore */ }

    try {
      mutate("/products", (old: ProductsListShape | undefined | null) => prependProductToList(old, created), false).catch(() => { });
    } catch { /* ignore */ }

    return created;
  },

  async update(id: number, product: Omit<Product, "id">): Promise<Product> {
    const response = await axios.put(`/products/${id}`, product);
    const json = response.data as ApiResponse<Product>;
    if (response.status >= 400) {
      const errorMsg = json?.error || json?.message || `Failed to update product: ${response.status}`;
      throw new Error(errorMsg);
    }
    const updated = json.data as Product;

    try { cacheDeleteById(updated.id); } catch { /* ignore */ }
    try { cacheSet(updated); } catch { /* ignore */ }

    try {
      mutate(PRODUCTS_KEY, (old: ProductsListShape | undefined | null) => replaceProductInList(old, updated), false).catch(() => { });
      mutate(["product", id], updated, false).catch(() => { });
    } catch { /* ignore */ }

    return updated;
  },

  async getById(id: number): Promise<Product | null> {
    try {
      const response = await axios.get(`/products/${id}`);
      if (response.status >= 400) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch product with id ${id}`);
      }
      const json = response.data as ApiResponse<Product>;
      return json.data ?? null;
    } catch {
      return null;
    }
  },

  async delete(id: number): Promise<void> {
    const response = await axios.delete(`/products/${id}`);
    if (response.status >= 400) {
      const json = response.data;
      const errorMsg = (json && (json as any).error) || (json && (json as any).message) || `Failed to delete product: ${response.status}`;
      throw new Error(errorMsg);
    }

    try {
      mutate(PRODUCTS_KEY, (old: ProductsListShape | undefined | null) => removeProductFromList(old, id), false).catch(() => { });
      mutate(["product", id], null, false).catch(() => { });
    } catch { /* ignore */ }

    try { cacheDeleteById(id); } catch { /* ignore */ }
  },

  async getByBarcode(barcode: string): Promise<Product | null> {
    if (!barcode) return null;

    const cleaned = String(barcode).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    if (!cleaned) return null;

    // Check cache first for immediate response
    try {
      const cached = cacheGet(cleaned);
      if (cached) return cached;
    } catch { /* ignore cache errors */ }

    // Single API call with proper error handling
    try {
      const response = await axios.get(`/products/barcode/${encodeURIComponent(cleaned)}`);

      if (response.status === 200 && response.data?.data) {
        const product = response.data.data;
        try { cacheSet(product); } catch { /* ignore cache errors */ }
        return product;
      }

      return null;
    } catch (error) {
      // Only log non-404 errors using proper type checking
      if (isAxiosError(error) && error.response?.status !== 404) {
        console.warn('[productApi.getByBarcode] Network error:', error.message);
      }
      return null; // ✅ Fixed: Added missing return statement
    }
  },
};

// Save cache on page unload
if (typeof window !== "undefined") {
  try {
    window.addEventListener("beforeunload", () => {
      try {
        const obj: Record<string, CacheEntry> = {};
        BARCODE_CACHE.forEach((v, k) => {
          obj[k] = v;
        });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
}