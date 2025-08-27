// ...existing code...
import { useState } from "react";
import { mutate } from "swr";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { PRODUCTS_KEY, useProducts } from "@/hooks/global/fetching/useProducts";

type CreateInput = Omit<Product, "id">;

export function useAddProduct() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Use SWR-backed product list for immediate, local duplicate checks
    const { products } = useProducts();

    const addProduct = async (product: CreateInput) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const barcodeVal = product.barcode ?? "";

            // 1) Fast local check using SWR cache
            const localByBarcode = barcodeVal
                ? products.find((p) => String(p.barcode) === String(barcodeVal))
                : null;
            if (localByBarcode) {
                setError("Barcode already exists. Please use a unique barcode.");
                setLoading(false);
                return null;
            }

            // 2) Fast local name check using SWR cache
            const localByName = products.find((p) => (p.name || "").toLowerCase() === product.name.trim().toLowerCase());
            if (localByName) {
                setError("Product name already exists. Please use a unique name.");
                setLoading(false);
                return null;
            }

            // 3) Optional remote safety checks (safe query endpoints)
            try {
                if (barcodeVal) {
                    const barcodeUrl = `${(process.env.NEXT_PUBLIC_backend_api_url || "").replace(/\/$/, "")}/products?barcode=${encodeURIComponent(String(barcodeVal))}`;
                    const r = await fetch(barcodeUrl);
                    if (r.ok) {
                        const json = await r.json().catch(() => ({ data: [] }));
                        if (Array.isArray(json.data) && json.data.length > 0) {
                            setError("Barcode already exists. Please use a unique barcode.");
                            setLoading(false);
                            return null;
                        }
                    }
                }

                const nameUrl = `${(process.env.NEXT_PUBLIC_backend_api_url || "").replace(/\/$/, "")}/products?name=${encodeURIComponent(String(product.name))}`;
                const rn = await fetch(nameUrl);
                if (rn.ok) {
                    const jn = await rn.json().catch(() => ({ data: [] }));
                    if (Array.isArray(jn.data) && jn.data.length > 0) {
                        setError("Product name already exists. Please use a unique name.");
                        setLoading(false);
                        return null;
                    }
                }
            } catch {
                // ignore network check errors — server validation will catch duplicates if needed
            }

            // Create on server
            const createdProduct = await productApi.create(product);

            // Optimistically update SWR cache so UI shows the new product immediately,
            // then trigger background revalidation to reconcile
            try {
                await mutate(
                    PRODUCTS_KEY,
                    (current: Product[] | undefined) => {
                        if (!createdProduct) return current;
                        const filtered = (current ?? []).filter((p) => p.id !== createdProduct.id);
                        return [createdProduct, ...filtered];
                    },
                    false
                );
            } catch {
                // ignore mutate errors
            }

            // ensure revalidation in background
            mutate(PRODUCTS_KEY);

            setSuccess(true);
            setLoading(false);
            return createdProduct;
        } catch (err: any) {
            setError(err?.message || "Failed to add product");
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
// ...existing code...