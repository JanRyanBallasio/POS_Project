"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showSuccessToast } from "@/utils/toast";
import { useAddProduct } from "@/hooks/products/useAddProducts";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useCategories } from "@/hooks/global/fetching/useCategories";
import { useProductFormStore } from "@/stores/productFormStore";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductFormSchema, type ProductFormValues, getCategoryId } from "./ProductFormSchema";
import ProductFormFields from "./ProductFormFields";
import ErrorDisplay from "./ErrorDisplay";

type Props = {
    contextBarcode?: string;
    setContextBarcode?: (barcode: string) => void;
    onClose: () => void;
};

export default function ProductForm({ contextBarcode, setContextBarcode, onClose }: Props) {
    const { addProduct, loading, error, reset: resetAddError } = useAddProduct();
    const { refetch } = useProducts();
    const { categories } = useCategories();
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Persisted local form store
    const nameStore = useProductFormStore(s => s.name);
    const barcodeStore = useProductFormStore(s => s.barcode);
    const categoryIdStore = useProductFormStore(s => s.category_id);
    const categoryNameFallback = useProductFormStore(s => s.category_name);
    const priceStore = useProductFormStore(s => s.price);
    const quantityStore = useProductFormStore(s => s.quantity);
    const setNameStore = useProductFormStore(s => s.setName);
    const setBarcodeStore = useProductFormStore(s => s.setBarcode);
    const setCategoryIdStore = useProductFormStore(s => s.setCategoryId);
    const setCategoryNameStore = useProductFormStore(s => s.setCategoryName);
    const setPriceStore = useProductFormStore(s => s.setPrice);
    const setQuantityStore = useProductFormStore(s => s.setQuantity);
    const resetFormStore = useProductFormStore(s => s.reset);

    // 🔧 FIXED: Use zodResolver instead of custom Valibot resolver
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(ProductFormSchema),
        defaultValues: {
            name: "",
            barcode: "",
            category_id: 0,
            price: 0,
            quantity: 0,
        },
        mode: "onChange"
    });

    const { handleSubmit, setValue, reset: resetForm, formState: { errors }, setError, clearErrors } = form;

    // Derived values
    const selectedCategory = useMemo(() => {
        if (!categories) return undefined;
        return categories.find((c: any) => String(getCategoryId(c)) === String(categoryIdStore));
    }, [categories, categoryIdStore]);

    const selectedCategoryName = selectedCategory?.name ?? categoryNameFallback ?? "";

    // Sync form <> store when component mounts
    useEffect(() => {
        const formData: ProductFormValues = {
            name: nameStore || "",
            barcode: contextBarcode || barcodeStore || "",
            category_id: categoryIdStore && categoryIdStore !== "" ? Number(categoryIdStore) : 0,
            price: priceStore && priceStore !== "" ? Number(priceStore) : 0,
            quantity: quantityStore && quantityStore !== "" ? Number(quantityStore) : 0,
        };

        resetForm(formData);

        // If a barcode came from context (scanner), apply once
        if (contextBarcode && contextBarcode !== barcodeStore) {
            setBarcodeStore(contextBarcode);
            if (typeof setContextBarcode === "function") setContextBarcode("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 🎯 ENHANCED: Better server error mapping with visual feedback
    useEffect(() => {
        setGlobalError(null);
        if (!error) return;
        
        if (error.field) {
            const fieldMapping: Record<string, keyof ProductFormValues> = {
                'name': 'name',
                'product_name': 'name',
                'barcode': 'barcode',
                'category_id': 'category_id',
                'category': 'category_id',
                'price': 'price',
                'quantity': 'quantity'
            };

            const formField = fieldMapping[error.field] || error.field as keyof ProductFormValues;
            
            if (formField in errors || ['name', 'barcode', 'category_id', 'price', 'quantity'].includes(formField)) {
                setError(formField, { 
                    message: error.message, 
                    type: "server" 
                });
                
                // 🎯 Auto-focus the field with error
                setTimeout(() => {
                    const input = document.querySelector(`[name="${formField}"], #${formField}-1`) as HTMLElement;
                    if (input) {
                        input.focus();
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Visual emphasis
                        input.classList.add('animate-pulse', 'border-red-500');
                        setTimeout(() => {
                            input.classList.remove('animate-pulse');
                        }, 1000);
                    }
                }, 100);
            } else {
                setGlobalError(error.message);
            }
        } else {
            setGlobalError(error.message);
        }
    }, [error, setError, errors]);

    // 🚀 ENHANCED: Better error clearing logic
    const onFieldChangeStore = useCallback((field: string, value: string) => {
        // Clear form validation errors immediately for better UX
        if (errors[field as keyof typeof errors]) {
            clearErrors(field as keyof ProductFormValues);
        }

        // 🎯 SMART: Only clear server errors when user makes substantial changes
        if (error?.field === field || error?.field === `product_${field}`) {
            if (field === "name") {
                const trimmedNew = value.trim().toLowerCase();
                const trimmedOriginal = (nameStore || "").trim().toLowerCase();
                
                // Only clear if name is substantially different (3+ character difference)
                if (trimmedNew && 
                    trimmedNew !== trimmedOriginal && 
                    Math.abs(trimmedNew.length - trimmedOriginal.length) >= 3) {
                    resetAddError();
                }
            }
            else if (field === "barcode") {
                const trimmedNew = value.trim();
                const trimmedOriginal = (barcodeStore || "").trim();
                
                // Only clear if barcode is completely different
                if (trimmedNew && 
                    trimmedNew !== trimmedOriginal && 
                    trimmedNew.length >= 3 &&
                    Math.abs(trimmedNew.length - trimmedOriginal.length) >= 2) {
                    resetAddError();
                }
            }
            else if (field === "price" || field === "quantity") {
                const numValue = Number(value);
                const originalValue = Number(field === "price" ? priceStore : quantityStore);
                
                if (!isNaN(numValue) && numValue !== originalValue && numValue >= 0) {
                    resetAddError();
                }
            }
        }

        // Update the store
        switch (field) {
            case "name": return setNameStore(value);
            case "barcode": return setBarcodeStore(value);
            case "price": return setPriceStore(value);
            case "quantity": return setQuantityStore(value);
            default: return;
        }
    }, [
        setNameStore, setBarcodeStore, setPriceStore, setQuantityStore, 
        error, errors, resetAddError, clearErrors,
        nameStore, barcodeStore, priceStore, quantityStore
    ]);

    const onSelectCategory = useCallback((cat: any) => {
        const idVal = getCategoryId(cat);
        
        // Clear category errors
        if (error?.field === "category_id" || error?.field === "category") {
            resetAddError();
        }
        if (errors.category_id) {
            clearErrors("category_id");
        }

        setCategoryIdStore(String(idVal ?? ""));
        setCategoryNameStore(cat?.name ?? "");
        setValue("category_id", Number(idVal) || 0, { shouldValidate: true });
    }, [setCategoryIdStore, setCategoryNameStore, setValue, error, errors, resetAddError, clearErrors]);

    // 🎯 SIMPLIFIED: Standard form submission with better error handling
    const onSubmit = async (values: ProductFormValues) => {
        setGlobalError(null);
        resetAddError();

        try {
            console.log("🚀 Submitting product:", values);
            
            // Persist values to store
            setNameStore(values.name);
            setBarcodeStore(values.barcode);
            setCategoryIdStore(String(values.category_id));
            setPriceStore(String(values.price));
            setQuantityStore(String(values.quantity));

            const result = await addProduct(values);
            if (result) {
                onClose();

                // Notify other parts immediately
                window.dispatchEvent(new CustomEvent("product:added", {
                    detail: { product: result, barcode: values.barcode }
                }));

                // Reset forms/stores
                resetForm();
                resetFormStore();

                // Background refetch
                refetch?.().catch(() => {});

                // Success feedback
                showSuccessToast("Product added successfully", `${values.name} has been added to inventory.`);

                // Focus scanner
                window.dispatchEvent(new Event("focusBarcodeScanner"));
            }
        } catch (submitError) {
            console.error("❌ Form submission failed:", submitError);
            setGlobalError("Failed to add product. Please try again.");
        }
    };

    return (
        <>
            <div className="flex-col gap-4">
                <ErrorDisplay error={globalError} />
                
                <ProductFormFields 
                    form={form}
                    errors={errors}
                    selectedCategoryName={selectedCategoryName}
                    onSelectCategory={onSelectCategory}
                    onFieldChangeStore={onFieldChangeStore}
                />
            </div>

            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>

                <Button onClick={handleSubmit(onSubmit)} disabled={loading}>
                    {loading ? "Adding..." : "Add Product"}
                </Button>
            </DialogFooter>
        </>
    );
}