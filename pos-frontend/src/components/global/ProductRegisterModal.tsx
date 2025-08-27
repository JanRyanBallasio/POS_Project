"use client";
import { useProductModal } from "@/contexts/productRegister-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAddProduct } from "@/hooks/products/useAddProducts";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useCategories } from "@/hooks/global/fetching/useCategories";
import { useProductFormStore } from "@/stores/productFormStore";
import AddCategoryModal from "@/app/dashboard/_pages/Products/components/addCategoryModal";

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
import { Plus } from "lucide-react";
// ...existing code...

// lightweight utility pulled out so it's not recreated on every render
const getCategoryId = (c: any) => c?.id ?? c?._id ?? c?.category_id ?? c?.categoryId ?? c?.ID ?? null;

export default function ProductRegisterModal() {
    const { open, setOpen, barcode: contextBarcode, setBarcode: setContextBarcode, openModal } = useProductModal();
    const name = useProductFormStore((s) => s.name);
    const setName = useProductFormStore((s) => s.setName);
    const barcode = useProductFormStore((s) => s.barcode);
    const setBarcode = useProductFormStore((s) => s.setBarcode);
    const category_id = useProductFormStore((s) => s.category_id);
    const setCategoryId = useProductFormStore((s) => s.setCategoryId);
    const category_name_fallback = useProductFormStore((s) => s.category_name);
    const setCategoryName = useProductFormStore((s) => s.setCategoryName);
    const price = useProductFormStore((s) => s.price);
    const setPrice = useProductFormStore((s) => s.setPrice);
    const quantity = useProductFormStore((s) => s.quantity);
    const setQuantity = useProductFormStore((s) => s.setQuantity);
    const resetForm = useProductFormStore((s) => s.reset);
    const [categorySearch, setCategorySearch] = useState("");
    const { addProduct, loading, error, reset } = useAddProduct();
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const { refetch } = useProducts(); // This gives you mutate for products

    // memoize filtered list to avoid repeating filter calls in render
    const filteredCategories = useMemo(() => {
        if (!categories || categories.length === 0) return [];
        const q = categorySearch.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(cat => (cat?.name || "").toLowerCase().includes(q));
    }, [categories, categorySearch]);

    // memoize selected category object + display name
    const selectedCategory = useMemo(() => {
        if (!categories) return undefined;
        return categories.find((c: any) => String(getCategoryId(c)) === String(category_id));
    }, [categories, category_id]);

    const selectedCategoryName = useMemo(() => {
        return selectedCategory?.name ?? category_name_fallback ?? "";
    }, [selectedCategory, category_name_fallback]);

    const handleAddProduct = useCallback(async () => {
        const newProduct = {
            name,
            barcode,
            category_id: Number(category_id),
            price: Number(price),
            quantity: Number(quantity),
        };

        const result = await addProduct(newProduct);
        if (result) {
            if (typeof window !== "undefined") {
                try {
                    // only allow scanner autofocus when the user is currently on the POS page
                    const path = (window.location?.pathname || "").toLowerCase();
                    const isOnPOS = path.includes("/pos");
                    window.dispatchEvent(
                        new CustomEvent("product:added", {
                            detail: {
                                barcode: newProduct.barcode,
                                product: result,
                                // preventScan true when NOT on POS, so Products tab/additions don't steal focus
                                preventScan: !isOnPOS,
                            },
                        })
                    );
                } catch { }
            }

            setOpen(false);
            setShowSuccessDialog(true);
            // refetch(); // removed, not needed because useAddProduct mutated PRODUCTS_KEY
        }
    }, [name, barcode, category_id, price, quantity, addProduct, setOpen]);

    const onSelectCategory = useCallback((cat: any) => {
        const idVal = getCategoryId(cat);
        setCategoryId(idVal ?? "");
        setCategoryName(""); // clear temporary fallback when user chooses an existing item
        setCategorySearch("");
    }, [setCategoryId, setCategoryName])

    useEffect(() => {
        // when product modal fully closes, clear the persisted form
        if (!open) {
            resetForm();
            if (typeof reset === "function") reset();
            return;
        }

        // modal opened: if there's a barcode from context, set it once into the store
        if (contextBarcode && contextBarcode !== barcode) {
            setBarcode(contextBarcode);
            if (typeof setContextBarcode === "function") {
                setContextBarcode("");
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, contextBarcode]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Product</DialogTitle>
                        <DialogDescription>Fill in the details below to add a new product.</DialogDescription>
                    </DialogHeader>
                    <div className='flex-col gap-4'>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='name-1'>Product Name</Label>
                            <Input id='name-1' name='name' value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className='flex flex-row gap-2 mt-4'>
                            <div className="flex-[50%] flex flex-col gap-2">
                                <Label htmlFor='barcode-1'>Barcode</Label>
                                <Input id='barcode-1' name='barcode' value={barcode || ""} onChange={e => setBarcode(e.target.value)} />
                            </div>
                            <div className="flex-[50%] flex flex-col gap-2">
                                <Label htmlFor='category-1'>Category</Label>
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
                                            {categoriesLoading && (
                                                <div className="p-2 text-gray-400">Loading...</div>
                                            )}
                                            {categoriesError && (
                                                <div className="p-2 text-red-500">{categoriesError}</div>
                                            )}

                                            {!categoriesLoading && !categoriesError && (
                                                <ScrollArea className="h-40">
                                                    <div className="p-2">
                                                        {filteredCategories.map(cat => {
                                                            const idString = String(getCategoryId(cat));
                                                            return (
                                                                <DropdownMenuItem
                                                                    key={idString}
                                                                    onClick={() => onSelectCategory(cat)}
                                                                >
                                                                    {cat.name}
                                                                </DropdownMenuItem>
                                                            );
                                                        })}
                                                        {filteredCategories.length === 0 && (
                                                            <div className="p-2 text-gray-400">No categories found.</div>
                                                        )}
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
                            </div>
                        </div>
                        <div className='flex flex-row gap-2 my-4'>
                            <div className="flex-[50%] flex flex-col gap-2">
                                <Label htmlFor='price-1'>Price</Label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                                        ₱
                                    </span>
                                    <Input
                                        id='price-1'
                                        name='price'
                                        type="number"
                                        value={price}
                                        onChange={e => setPrice(Number(e.target.value))}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="flex-[50%] flex flex-col gap-2">
                                <Label htmlFor='quantity-1'>Quantity</Label>
                                <Input
                                    id='quantity-1'
                                    name='quantity'
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant='outline'>Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleAddProduct} disabled={loading}>
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
                        <AlertDialogDescription>
                            Congratulations! Your product has been added successfully.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}