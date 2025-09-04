// ...existing code...
import { mutate } from "swr";
export const PRODUCTS_KEY = "/products";
import axios from '@/lib/axios';

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

const API_BASE_URL = "/api";

// small in-memory barcode -> product cache (persisted to localStorage)
// TTL and debounce save to avoid frequent disk writes
type CacheEntry = { product: Product; ts: number };
const BARCODE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore setTimeout returns number in browsers
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

function saveCacheToStorageImmediate(): void {
  try {
    if (typeof window === "undefined") return;
    const obj: Record<string, CacheEntry> = {};
    BARCODE_CACHE.forEach((v, k) => {
      obj[k] = v;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch { /* ignore */ }
}

function cacheSet(product: Product): void {
  if (!product || !product.barcode) return;
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

// New helpers: remove cache entries by barcode or by product id
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

// initialize cache from storage (browser only)
if (typeof window !== "undefined") {
  try {
    loadCacheFromStorage();
  } catch { /* ignore */ }
}

type ProductsListShape = Product[] | { data: Product[]; count?: number;[k: string]: any };

function prependProductToList(old: ProductsListShape | undefined | null, created: Product): ProductsListShape {
  if (!old) return [created];
  if (Array.isArray(old)) {
    // cast as Product[]
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
      console.debug('[productApi.getAll] status', response.status);
      if (response.status >= 400) {
        return [];
      }
      const json = response.data as ApiResponse<Product[]>;
      console.debug('[productApi.getAll] got', Array.isArray(json.data) ? json.data.length : 0, 'items');
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
    const json = (await response.json().catch(() => ({ data: null }))) as ApiResponse<Product>;
    if (!response.ok) {
      const errorMsg = json?.error || json?.message || `Failed to create product: ${response.status}`;
      throw new Error(errorMsg);
    }
    const created = json.data as Product;
    try { cacheSet(created); } catch { /* ignore */ }

    // optimistic update: add to products list SWR cache (don't revalidate)
    try {
      mutate("/products", (old: ProductsListShape | undefined | null) => prependProductToList(old, created), false).catch(() => { });
    } catch { /* ignore */ }

    return created;
  },

  async update(id: number, product: Omit<Product, "id">): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const json = (await response.json().catch(() => ({ data: null }))) as ApiResponse<Product>;
    if (!response.ok) {
      const errorMsg = json?.error || json?.message || `Failed to update product: ${response.status}`;
      throw new Error(errorMsg);
    }
    const updated = json.data as Product;

    // remove any stale cache entries for this id (in case barcode changed or was removed)
    try { cacheDeleteById(updated.id); } catch { /* ignore */ }
    try { cacheSet(updated); } catch { /* ignore */ }

    // update SWR cache entries for lists and individual product
    try {
      mutate(PRODUCTS_KEY, (old: ProductsListShape | undefined | null) => replaceProductInList(old, updated), false).catch(() => { });
      mutate(["product", id], updated, false).catch(() => { });
    } catch { /* ignore */ }

    return updated;
  },

  async getById(id: number): Promise<Product | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch product with id ${id}`);
      }
      const json = (await response.json().catch(() => ({ data: null }))) as ApiResponse<Product>;
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
      const errorMsg = (json && (json as any).error) || (json && (json as any).message) || `Failed to delete product: ${response.status}`;
      throw new Error(errorMsg);
    }

    // remove from SWR cache lists
    try {
      mutate(PRODUCTS_KEY, (old: ProductsListShape | undefined | null) => removeProductFromList(old, id), false).catch(() => { });
      mutate(["product", id], null, false).catch(() => { });
    } catch { /* ignore */ }

    // ALSO remove any barcode cache entries that reference this id
    try { cacheDeleteById(id); } catch { /* ignore */ }
  },

  async getByBarcode(barcode: string): Promise<Product | null> {
    if (!barcode) return null;

    const clean = (v: string) => String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    const cleaned = clean(barcode);
    if (!cleaned) return null;

    const encoded = encodeURIComponent(cleaned);

    const exactUrl = `${API_BASE_URL}/products/barcode/${encoded}`;
    const queryUrl = `${API_BASE_URL}/products?barcode=${encoded}`;

    // Try server first so deletes/updates are honored immediately.
    try {
      const res = await fetch(exactUrl);
      if (res.status === 404) {
        // server explicitly says not found
        return null;
      }
      if (res.ok) {
        const json = (await res.json().catch(() => ({ data: null }))) as ApiResponse<Product>;
        const product = json?.data ?? null;
        if (product) {
          try { cacheSet(product); } catch { /* ignore */ }
          return product;
        }
      }
      // if non-404 non-ok, fall through to cache/fallback
    } catch {
      // network error -> fallback to cache below
    }

    // fallback to cache if available (useful when offline)
    try {
      const cached = cacheGet(cleaned);
      if (cached) return cached;
    } catch { /* ignore cache errors */ }

    // last-resort: query endpoint (returns list)
    try {
      const res2 = await fetch(queryUrl);
      if (!res2.ok) return null;
      const qjson = (await res2.json().catch(() => ({ data: [] }))) as ApiResponse<Product[]>;
      const list = qjson?.data ?? [];
      if (list.length === 0) return null;
      const exact = list.find((p) => clean(p?.barcode ?? "") === cleaned);
      const chosen = exact ?? list[0];
      try { cacheSet(chosen); } catch { /* ignore */ }
      return chosen;
    } catch {
      return null;
    }
  },
};

// ensure cache is saved immediately when unloading page
if (typeof window !== "undefined") {
  try {
    window.addEventListener("beforeunload", () => {
      try { saveCacheToStorageImmediate(); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
}
// ...existing code...