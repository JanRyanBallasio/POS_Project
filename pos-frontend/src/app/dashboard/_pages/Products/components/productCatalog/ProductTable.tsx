"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { DataTable } from "../../table/dataTable";
import { columns, Products } from "../../table/columns";
import { Product, productApi, PRODUCTS_KEY } from "@/hooks/products/useProductApi";
import Pagination from "./Pagination";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCategories } from "@/hooks/global/fetching/useCategories";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// SWR fetcher
const fetcher = () => productApi.getAll();
const PAGE_SIZE = 6;

function mapProductToRow(product: Product, categories: { id: number; name: string }[]): Products {
    const status =
        product.quantity === 0 ? "out of stock" : product.quantity < 5 ? "low stock" : "in stock";
    const category = categories.find((c) => String(c.id) === String(product.category_id));
    return {
        id: String(product.id),
        productName: product.name,
        barcode: product.barcode ?? "",
        category: category ? category.name : `Category ${product.category_id}`,
        currentStock: product.quantity,
        productPrice: product.price,
        status,
        // NOTE: no `original` property anymore
    };
}

type ProductTableProps = {
    selectedCategory: string;
    selectedStatus: string;
    onProductDeleted?: (id: number) => void;
    search?: string;
};

export default function ProductTable({
    selectedCategory,
    selectedStatus,
    onProductDeleted,
    search = "",
}: ProductTableProps) {
    const { data: products = [], isLoading, error, mutate: refetchProducts } = useSWR(PRODUCTS_KEY, fetcher, {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 30_000, // Reduced for more real-time feel
        errorRetryCount: 3,
        onSuccess: (data) => {
            // Optional: Log successful data fetch for debugging
            console.debug(`[ProductTable] Loaded ${data?.length || 0} products`);
        }
    });


    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);

    const [editProductId, setEditProductId] = useState<number | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

    // store mapped row (Products) for delete UI, not the original Product
    const [deleteProduct, setDeleteProduct] = useState<Products | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { categories = [], loading: categoriesLoading, error: categoriesError } = useCategories();
    const [categorySearch, setCategorySearch] = useState("");

    const [editForm, setEditForm] = useState({
        name: "",
        barcode: "",
        category_id: "",
        price: 0,
        quantity: 0,
    });

    useEffect(() => {
        const handleProductAdded = (event: CustomEvent) => {
            console.debug('[ProductTable] Product added event received');
            // Trigger immediate revalidation
            refetchProducts();
        };

        const handleProductUpdated = (event: CustomEvent) => {
            console.debug('[ProductTable] Product updated event received');
            refetchProducts();
        };

        const handleProductDeleted = (event: CustomEvent) => {
            console.debug('[ProductTable] Product deleted event received');
            refetchProducts();
        };

        window.addEventListener('product:added', handleProductAdded as EventListener);
        window.addEventListener('product:updated', handleProductUpdated as EventListener);
        window.addEventListener('product:deleted', handleProductDeleted as EventListener);

        return () => {
            window.removeEventListener('product:added', handleProductAdded as EventListener);
            window.removeEventListener('product:updated', handleProductUpdated as EventListener);
            window.removeEventListener('product:deleted', handleProductDeleted as EventListener);
        };
    }, [refetchProducts]);

    // memoized filtered products (category/status/search)
    const filteredProducts = useMemo(() => {
        let list: Product[] = products ?? [];

        if (selectedCategory && selectedCategory !== "all") {
            list = list.filter((p) => String(p.category_id) === selectedCategory);
        }

        if (selectedStatus && selectedStatus !== "all") {
            list = list.filter((p) => {
                const status =
                    p.quantity === 0 ? "out of stock" : p.quantity < 5 ? "low stock" : "in stock";
                return status === selectedStatus;
            });
        }

        const q = (search || "").trim().toLowerCase();
        if (q) {
            list = list.filter((p) => {
                const name = String(p.name ?? "").toLowerCase();
                const barcode = String(p.barcode ?? "").toLowerCase();
                return name.includes(q) || barcode.includes(q);
            });
        }

        return list;
    }, [products, selectedCategory, selectedStatus, search]);

    // reset page when filters/search change
    useEffect(() => setPage(0), [selectedCategory, selectedStatus, search]);

    const mappedProducts: Products[] = useMemo(
        () => (filteredProducts ?? []).map((p) => mapProductToRow(p, categories)),
        [filteredProducts, categories]
    );

    const pageCount = useMemo(
        () => Math.max(1, Math.ceil((mappedProducts?.length || 0) / pageSize)),
        [mappedProducts, pageSize]
    );

    const editProduct = useMemo(
        () => products.find((p: Product) => String(p.id) === String(editProductId)),
        [products, editProductId]
    );

    // sync edit form when dialog opens and product available
    useEffect(() => {
        if (showEditDialog && editProduct) {
            setEditForm({
                name: editProduct.name ?? "",
                barcode: editProduct.barcode ?? "",
                category_id: String(editProduct.category_id ?? ""),
                price: editProduct.price ?? 0,
                quantity: editProduct.quantity ?? 0,
            });
        }
    }, [showEditDialog, editProduct]);

    // accept the mapped row (Products) rather than original Product
    const handleEdit = useCallback((row: Products) => {
        const id = row?.id;
        setEditProductId(id != null ? Number(id) : null);
        setShowEditDialog(true);
        setShowUpdateConfirm(false);
    }, []);

    // accept the mapped row (Products)
    const handleDelete = useCallback((row: Products) => {
        setDeleteProduct(row);
        setShowDeleteDialog(true);
    }, []);

    const truncate = useCallback((s?: string, max = 60) => {
        if (!s) return "";
        return s.length > max ? s.slice(0, max) + "..." : s;
    }, []);

    const handleUpdateProduct = useCallback(async () => {
        setShowUpdateConfirm(false);
        if (!editProduct) {
            toast("Product data not loaded", { description: "Please try again." });
            return;
        }

        const updatedProductData = {
            name: editForm.name,
            barcode: editForm.barcode,
            category_id: Number(editForm.category_id),
            price: Number(editForm.price),
            quantity: Number(editForm.quantity),
        };

        try {
            // Optimistic update: immediately update the cache
            const optimisticProduct = { ...editProduct, ...updatedProductData };

            mutate(
                PRODUCTS_KEY,
                (current: Product[] | undefined) => {
                    if (!current) return current;
                    return current.map(p => p.id === editProduct.id ? optimisticProduct : p);
                },
                false // Don't revalidate immediately
            );

            // Perform the actual update
            const updatedProduct = await productApi.update(editProduct.id, updatedProductData);

            toast("Product updated", {
                description: `${truncate(editForm.name, 60)} has been updated.`
            });

            setShowEditDialog(false);

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent("product:updated", {
                detail: { product: updatedProduct }
            }));

            // Final revalidation to ensure consistency
            mutate(PRODUCTS_KEY);

        } catch (err: any) {
            // Revert optimistic update on error
            mutate(PRODUCTS_KEY);
            toast("Failed to update product", {
                description: err?.message || "An error occurred."
            });
        }
    }, [editProduct, editForm, truncate]);

    const handleDeleteProduct = useCallback(async () => {
        if (!deleteProduct) return;

        const productId = Number(deleteProduct.id);

        try {
            // Optimistic update: immediately remove from cache
            mutate(
                PRODUCTS_KEY,
                (current: Product[] | undefined) => {
                    if (!current) return current;
                    return current.filter(p => p.id !== productId);
                },
                false // Don't revalidate immediately
            );

            // Perform the actual delete
            await productApi.delete(productId);

            toast("Product deleted", {
                description: (
                    <span className="text-red-600">
                        {truncate(deleteProduct.productName, 60)} has been deleted.
                    </span>
                ),
                icon: <Trash2 className="w-4 h-4 text-red-600" />,
            });

            setShowDeleteDialog(false);
            setDeleteProduct(null);

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent("product:deleted", {
                detail: { productId }
            }));

            // Callback to parent component
            if (onProductDeleted) onProductDeleted(productId);

            // Final revalidation to ensure consistency
            mutate(PRODUCTS_KEY);

        } catch (err: any) {
            // Revert optimistic update on error
            mutate(PRODUCTS_KEY);
            toast("Failed to delete product", {
                description: err?.message || "An error occurred."
            });
        }
    }, [deleteProduct, onProductDeleted, truncate]);

    const isUpdating = isLoading;

    return (
        <div className="w-full mt-4 relative">
            {isUpdating && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-200">
                    <div className="h-full bg-blue-500 animate-pulse"></div>
                </div>
            )}
            <DataTable
                columns={columns.map((col) =>
                    col.id === "actions"
                        ? {
                            ...col,
                            cell: ({ row }: any) => (
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEdit(row.original)}
                                        disabled={isUpdating}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDelete(row.original)}
                                        disabled={isUpdating}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ),
                        }
                        : col
                )}
                data={mappedProducts}
                page={page}
                pageSize={pageSize}
            />

            <div className="mt-7">
                <Pagination
                    page={page}
                    pageCount={pageCount}
                    setPage={setPage}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(0);
                    }}
                />
            </div>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    {!editProduct ? (
                        <>
                            <DialogTitle>Loading</DialogTitle>
                            <DialogDescription>Loading product data...</DialogDescription>
                            <div className="p-4 text-center">Loading...</div>
                        </>
                    ) : showUpdateConfirm ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <h2 className="font-bold text-lg mb-2">Are you absolutely sure?</h2>
                            <p className="mb-6 text-gray-500">This will update the product details.</p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowUpdateConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleUpdateProduct}>Continue</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Product</DialogTitle>
                                <DialogDescription>Fill in the details below to update the product.</DialogDescription>
                            </DialogHeader>

                            <div className="flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-name">Product Name</Label>
                                    <Input
                                        id="edit-name"
                                        name="name"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                    />
                                </div>

                                <div className="flex flex-row gap-2 mt-4">
                                    <div className="flex-[50%] flex flex-col gap-2">
                                        <Label htmlFor="edit-barcode">Barcode</Label>
                                        <Input
                                            id="edit-barcode"
                                            name="barcode"
                                            value={editForm.barcode}
                                            onChange={(e) => setEditForm((f) => ({ ...f, barcode: e.target.value }))}
                                        />
                                    </div>

                                    <div className="flex-[50%] flex flex-col gap-2">
                                        <Label htmlFor="edit-category">Category</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Input
                                                    id="edit-category"
                                                    readOnly
                                                    value={
                                                        categories.find((c) => String(c.id) === String(editForm.category_id))?.name ||
                                                        ""
                                                    }
                                                    placeholder="Select category"
                                                    className="cursor-pointer"
                                                />
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent className="w-64">
                                                <div className="p-2">
                                                    <Input
                                                        placeholder="Search category..."
                                                        value={categorySearch}
                                                        onChange={(e) => setCategorySearch(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                </div>

                                                {categoriesLoading && <div className="p-2 text-gray-400">Loading...</div>}
                                                {categoriesError && <div className="p-2 text-red-500">{categoriesError}</div>}

                                                {!categoriesLoading &&
                                                    !categoriesError &&
                                                    categories
                                                        .filter((cat) =>
                                                            cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                                        )
                                                        .map((cat) => (
                                                            <DropdownMenuItem
                                                                key={cat.id}
                                                                onClick={() => {
                                                                    setEditForm((f) => ({ ...f, category_id: String(cat.id) }));
                                                                    setCategorySearch("");
                                                                }}
                                                            >
                                                                {cat.name}
                                                            </DropdownMenuItem>
                                                        ))}

                                                {!categoriesLoading &&
                                                    !categoriesError &&
                                                    categories.filter((cat) =>
                                                        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                                    ).length === 0 && <div className="p-2 text-gray-400">No categories found.</div>}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="flex flex-row gap-2 my-4">
                                    <div className="flex-[50%] flex flex-col gap-2">
                                        <Label htmlFor="edit-price">Price</Label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                                                ₱
                                            </span>
                                            <Input
                                                id="edit-price"
                                                name="price"
                                                type="number"
                                                value={editForm.price === 0 ? "" : String(editForm.price)}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({
                                                        ...f,
                                                        price: e.target.value === "" ? 0 : Number(e.target.value),
                                                    }))
                                                }
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-[50%] flex flex-col gap-2">
                                        <Label htmlFor="edit-quantity">Quantity</Label>
                                        <Input
                                            id="edit-quantity"
                                            name="quantity"
                                            type="number"
                                            value={editForm.quantity === 0 ? "" : String(editForm.quantity)}
                                            onChange={(e) =>
                                                setEditForm((f) => ({
                                                    ...f,
                                                    quantity: e.target.value === "" ? 0 : Number(e.target.value),
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button onClick={() => setShowUpdateConfirm(true)}>Update Product</Button>
                                </DialogFooter>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the product and remove it
                            from your database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProduct} disabled={!deleteProduct}>
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}