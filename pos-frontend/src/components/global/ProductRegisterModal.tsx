"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

import { useProductModal } from "@/contexts/productRegister-context";
import { useProductFormStore } from "@/stores/productFormStore";
import AddCategoryModal from "@/app/dashboard/_pages/Products/components/addCategoryModal";

import { useAddProduct } from "@/hooks/products/useAddProducts";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useCategories } from "@/hooks/global/fetching/useCategories";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

/* -------------------------
   Helpers & Schema
   ------------------------- */

const getCategoryId = (c: any) => c?.id ?? c?._id ?? c?.category_id ?? c?.categoryId ?? c?.ID ?? null;

const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    barcode: z.preprocess((v) => (v == null ? "" : String(v)), z.string().min(1, "Barcode is required").regex(/^\d+$/, "Barcode must contain only digits")),
    category_id: z.preprocess((v) => {
        if (v == null || v === "") return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    }, z.number().positive("Please select a category")),
    price: z.preprocess((v) => {
        if (v == null || v === "") return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    }, z.number().nonnegative("Price must be >= 0")),
    quantity: z.preprocess((v) => {
        if (v == null || v === "") return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    }, z.number().nonnegative("Quantity must be >= 0")),
});

type ProductFormValues = z.infer<typeof productSchema>;

/* -------------------------
   Component
   ------------------------- */

export default function ProductRegisterModal() {
    // modal + context barcode
    const { open, setOpen, barcode: contextBarcode, setBarcode: setContextBarcode, openModal } = useProductModal();

    // persisted local form store (keeps values between opens)
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

    // hooks
    const { addProduct, loading, error, reset: resetAddError } = useAddProduct();
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const { refetch } = useProducts();

    // local UI state
    const [categorySearch, setCategorySearch] = useState("");
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // react-hook-form
    const { register, handleSubmit, setValue, reset: resetForm, formState: { errors }, setError } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: "",
            barcode: "",
            category_id: undefined,
            price: undefined,
            quantity: undefined,
        },
    });

    /* -------------------------
       Derived values
       ------------------------- */

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        const q = categorySearch.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((c: any) => (c?.name || "").toLowerCase().includes(q));
    }, [categories, categorySearch]);

    const selectedCategory = useMemo(() => {
        if (!categories) return undefined;
        return categories.find((c: any) => String(getCategoryId(c)) === String(categoryIdStore));
    }, [categories, categoryIdStore]);

    const selectedCategoryName = selectedCategory?.name ?? categoryNameFallback ?? "";

    /* -------------------------
       Sync form <> store when modal opens/closes
       ------------------------- */

    useEffect(() => {
        if (!open) {
            // clear persistent store and form state when modal closes
            resetFormStore();
            resetAddError?.();
            resetForm();
            setGlobalError(null);
            return;
        }

        // when opened, populate form from persisted store
        resetForm({
            name: nameStore || "",
            barcode: barcodeStore || "",
            category_id: categoryIdStore ? Number(categoryIdStore) : undefined,
            price: priceStore === "" ? undefined : Number(priceStore),
            quantity: quantityStore === "" ? undefined : Number(quantityStore),
        });

        // if a barcode came from context (scanner), apply once
        if (contextBarcode && contextBarcode !== barcodeStore) {
            setBarcodeStore(contextBarcode);
            setValue("barcode", contextBarcode as any);
            if (typeof setContextBarcode === "function") setContextBarcode("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    /* -------------------------
       Map server errors to form/global
       ------------------------- */

    useEffect(() => {
        setGlobalError(null);
        if (!error) return;
        if (error.field) {
            setError(error.field as any, { message: error.message, type: "server" });
        } else {
            setGlobalError(error.message);
        }
    }, [error, setError]);

    /* -------------------------
       Handlers - keep store in sync for other contexts
       ------------------------- */

    const onFieldChangeStore = useCallback((field: string, value: string) => {
        switch (field) {
            case "name": return setNameStore(value);
            case "barcode": return setBarcodeStore(value);
            case "price": return setPriceStore(value);
            case "quantity": return setQuantityStore(value);
            default: return;
        }
    }, [setNameStore, setBarcodeStore, setPriceStore, setQuantityStore]);

    const onSelectCategory = useCallback((cat: any) => {
        const idVal = getCategoryId(cat);
        setCategoryIdStore(idVal ?? "");
        setCategoryNameStore("");
        setCategorySearch("");
        setValue("category_id", idVal as any, { shouldValidate: true });
    }, [setCategoryIdStore, setCategoryNameStore, setValue]);

    /* -------------------------
       Submit
       ------------------------- */

    const onSubmit = async (values: ProductFormValues) => {
        setGlobalError(null);

        // persist parsed values to store
        setNameStore(values.name);
        setBarcodeStore(values.barcode ?? "");
        setCategoryIdStore(String(values.category_id ?? ""));
        setPriceStore(String(values.price ?? ""));
        setQuantityStore(String(values.quantity ?? ""));

        const result = await addProduct(values as any);
        if (result) {
            setShowSuccessDialog(true);
            resetForm();
            resetFormStore();
            try { await refetch(); } catch { /* ignore */ }
            setOpen(false);
        }
    };

    /* -------------------------
       Render
       ------------------------- */

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Product</DialogTitle>
                        <DialogDescription>Fill in the details below to add a new product.</DialogDescription>
                    </DialogHeader>

                    <div className="flex-col gap-4">
                        {globalError && <p className="text-sm text-red-500 mb-2">{globalError}</p>}

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name-1">Product Name</Label>
                            <Input
                                id="name-1"
                                {...register("name")}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    register("name").onChange?.(e as any);
                                    onFieldChangeStore("name", e.target.value);
                                }}
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                        </div>

                        <div className="flex flex-row gap-2 mt-4">
                            <div className="flex-1 flex flex-col gap-2">
                                <Label htmlFor="barcode-1">Barcode</Label>
                                <Input
                                    id="barcode-1"
                                    {...register("barcode")}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setValue("barcode", e.target.value as any);
                                        onFieldChangeStore("barcode", e.target.value);
                                    }}
                                />
                                {errors.barcode && <p className="text-sm text-red-500 mt-1">{errors.barcode.message}</p>}
                            </div>

                            <div className="flex-1 flex flex-col gap-2">
                                <Label htmlFor="category-1">Category</Label>
                                <div className="flex gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Input
                                                id="category-1"
                                                readOnly
                                                value={selectedCategoryName}
                                                placeholder="Select category"
                                                className="cursor-pointer"
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-64 p-0">
                                            <div className="p-2">
                                                <Input
                                                    placeholder="Search category..."
                                                    value={categorySearch}
                                                    onChange={e => setCategorySearch(e.target.value)}
                                                    className="mb-2"
                                                />
                                            </div>

                                            {categoriesLoading && <div className="p-2 text-gray-400">Loading...</div>}
                                            {categoriesError && <div className="p-2 text-red-500">{categoriesError}</div>}

                                            {!categoriesLoading && !categoriesError && (
                                                <ScrollArea className="h-40">
                                                    <div className="p-2">
                                                        {filteredCategories.map((cat) => {
                                                            const idString = String(getCategoryId(cat));
                                                            return (
                                                                <DropdownMenuItem key={idString} onClick={() => onSelectCategory(cat)}>
                                                                    {cat.name}
                                                                </DropdownMenuItem>
                                                            );
                                                        })}

                                                        {filteredCategories.length === 0 && <div className="p-2 text-gray-400">No categories found.</div>}
                                                    </div>
                                                </ScrollArea>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => (typeof openModal === "function" ? openModal("addCategory") : null)}
                                        aria-label="Add Category"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id.message}</p>}
                            </div>
                        </div>

                        <div className="flex flex-row gap-2 my-4">
                            <div className="flex-1 flex flex-col gap-2">
                                <Label htmlFor="price-1">Price</Label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">₱</span>
                                    <Input
                                        id="price-1"
                                        type="number"
                                        {...register("price")}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const v = e.target.value;
                                            setValue("price", v === "" ? undefined : Number(v) as any, { shouldValidate: true });
                                            onFieldChangeStore("price", v);
                                        }}
                                        className="pl-8"
                                    />
                                </div>
                                {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
                            </div>

                            <div className="flex-1 flex flex-col gap-2">
                                <Label htmlFor="quantity-1">Quantity</Label>
                                <Input
                                    id="quantity-1"
                                    type="number"
                                    {...register("quantity")}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const v = e.target.value;
                                        setValue("quantity", v === "" ? undefined : Number(v) as any, { shouldValidate: true });
                                        onFieldChangeStore("quantity", v);
                                    }}
                                />
                                {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>

                        <Button onClick={handleSubmit(onSubmit)} disabled={loading}>
                            {loading ? "Adding..." : "Add Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddCategoryModal />

            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Product Added</AlertDialogTitle>
                        <AlertDialogDescription>Congratulations! Your product has been added successfully.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
