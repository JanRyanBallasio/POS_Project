import { useState } from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";

type CreateInput = Omit<Product, "id">;

export function useAddProduct() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const addProduct = async (product: Omit<Product, "id">) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Check for duplicate barcode
            const barcodeExists = await productApi.getByBarcode(product.barcode ?? "");
            if (barcodeExists) {
                setError("Barcode already exists. Please use a unique barcode.");
                setSuccess(false);
                setLoading(false);
                return null;
            }

            // --- NEW: Check for duplicate name via API ---
            const nameExists = await productApi.getByName(product.name); // <-- implement this in your API
            if (nameExists) {
                setError("Product name already exists. Please use a unique name.");
                setSuccess(false);
                setLoading(false);
                return null;
            }

            // --- OLD (slow): const allProducts = await productApi.getAll(); ---

            const createdProduct = await productApi.create(product);
            setSuccess(true);
            setLoading(false);
            return createdProduct;
        } catch (err: any) {
            setError(err.message || "Failed to add product");
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