import { useState } from "react";
import { mutate } from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { PRODUCTS_KEY, useProducts } from "@/hooks/global/fetching/useProducts";

type CreateInput = Omit<Product, "id">;
type FieldError = { field?: string; message: string } | null;

export function useAddProduct() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<FieldError>(null);
    const [success, setSuccess] = useState(false);

    // Use SWR-backed product list for fast local checks
    const { products } = useProducts();

    const addProduct = async (product: CreateInput) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const barcodeVal = product.barcode ?? "";
            const nameVal = (product.name ?? "").trim().toLowerCase();

            // Build fast-lookup sets (O(n) to build, O(1) checks)
            const barcodeSet = new Set((products ?? []).map(p => String(p.barcode)));
            const nameSet = new Set((products ?? []).map(p => (p.name || "").trim().toLowerCase()));

            if (barcodeVal && barcodeSet.has(String(barcodeVal))) {
                setError({ field: "barcode", message: "Barcode already exists. Please use a unique barcode." });
                setLoading(false);
                return null;
            }

            if (nameVal && nameSet.has(nameVal)) {
                setError({ field: "name", message: "Product name already exists. Please use a unique name." });
                setLoading(false);
                return null;
            }

            // Create on server - use productApi if available; fallback to fetch
            const API_BASE = (process.env.NEXT_PUBLIC_backend_api_url || "").replace(/\/$/, "");
            let createdProduct: Product | null = null;
            try {
                if (productApi && typeof productApi.create === "function") {
                    // productApi.create should throw on non-2xx; we still wrap for structured parsing below
                    createdProduct = await productApi.create(product);
                } else {
                    const res = await fetch(`${API_BASE}/products`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(product),
                    });
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        // try to map field errors
                        if (res.status === 409 || res.status === 400) {
                            // server might send { field: "...", message: "..." } or { errors: [{ field, message }] }
                            if (body?.field && body?.message) {
                                setError({ field: body.field, message: body.message });
                            } else if (Array.isArray(body?.errors) && body.errors.length > 0) {
                                const first = body.errors[0];
                                setError({ field: first.field, message: first.message });
                            } else {
                                setError({ message: body?.message || "Duplicate or invalid data" });
                            }
                        } else {
                            setError({ message: body?.message || `Failed to create product (${res.status})` });
                        }
                        setLoading(false);
                        return null;
                    }
                    createdProduct = body?.data ?? body;
                }
            } catch (err: any) {
                // Try to parse structured error from thrown object (productApi implementations vary)
                const e = err as any;
                if (e?.response && typeof e.response.json === "function") {
                    const parsed = await e.response.json().catch(() => null);
                    if (parsed?.field && parsed?.message) {
                        setError({ field: parsed.field, message: parsed.message });
                    } else if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
                        setError({ field: parsed.errors[0].field, message: parsed.errors[0].message });
                    } else {
                        setError({ message: parsed?.message || "Failed to add product" });
                    }
                } else {
                    const msg = e?.message || String(e);
                    // simple heuristic for duplicate messages
                    if (msg.toLowerCase().includes("barcode")) {
                        setError({ field: "barcode", message: msg });
                    } else if (msg.toLowerCase().includes("name")) {
                        setError({ field: "name", message: msg });
                    } else {
                        setError({ message: msg });
                    }
                }
                setLoading(false);
                return null;
            }

            if (!createdProduct) {
                setLoading(false);
                setError({ message: "Failed to add product" });
                return null;
            }

            // Optimistically update SWR cache
            try {
                await mutate(
                    PRODUCTS_KEY,
                    (current: Product[] | undefined) => {
                        const filtered = (current ?? []).filter((p) => p.id !== createdProduct!.id);
                        return [createdProduct!, ...filtered];
                    },
                    false
                );
            } catch {
                // ignore mutate errors
            }
            mutate(PRODUCTS_KEY);

            setSuccess(true);
            setLoading(false);
            return createdProduct;
        } catch (err: any) {
            setError({ message: err?.message || "Failed to add product" });
            setSuccess(false);
            setLoading(false);
            return null;
        }
    };

    const reset = () => {
        setError(null);
        setSuccess(false);
    };

    return {
        addProduct,
        loading,
        error,
        success,
        reset,
    };
}
