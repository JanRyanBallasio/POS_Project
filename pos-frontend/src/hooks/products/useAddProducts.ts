import { useState } from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";

export function useAddProduct() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const addProduct = async (product: Omit<Product, "id">) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        if (!product.barcode || typeof product.barcode !== "string") {
            setError("Barcode is required.");
            setLoading(false);
            return null;
        }
        if (!product.name || typeof product.name !== "string") {
            setError("Product name is required.");
            setLoading(false);
            return null;
        }
        try {
            // Check for duplicate barcode
            const barcodeExists = await productApi.getByBarcode(product.barcode);
            if (barcodeExists) {
                setError("Barcode already exists. Please use a unique barcode.");
                setSuccess(false);
                return null;
            }
            // Check for duplicate name
            const allProducts = await productApi.getAll();
            if (allProducts.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
                setError("Product name already exists. Please use a unique name.");
                setSuccess(false);
                return null;
            }
            const createdProduct = await productApi.create(product); // <-- get product with id
            setSuccess(true);
            return createdProduct; // <-- return product object
        } catch (err: any) {
            setError(err.message || "Failed to add product");
            setSuccess(false);
            return null;
        } finally {
            setLoading(false);
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