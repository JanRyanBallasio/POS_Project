"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { DataTable } from "../../table/dataTable";
import { columns, Products } from "../../table/columns";
import Pagination from "./Pagination";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { useCategories } from "@/hooks/global/fetching/useCategories";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use consistent key
const PRODUCTS_KEY = "products:list";
const fetcher = () => productApi.getAll();
const PAGE_SIZE = 6;

// Memoize row mapping function
const mapProductToRow = (product: Product, categoryMap: Map<string, string>): Products => {
    const status = product.quantity === 0 ? "out of stock" : product.quantity < 5 ? "low stock" : "in stock";
    const categoryName = categoryMap.get(String(product.category_id)) || `Category ${product.category_id}`;

    return {
        id: String(product.id),
        productName: product.name,
        barcode: product.barcode ?? "",
        category: categoryName,
        currentStock: product.quantity,
        productPrice: product.price,
        status,
    };
};

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
    const { data: products = [], isLoading, mutate: refetchProducts } = useSWR(PRODUCTS_KEY, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10_000,
        errorRetryCount: 2,
    });

    const { categories = [] } = useCategories();

    // Create category map for faster lookups
    const categoryMap = useMemo(() => {
        const map = new Map<string, string>();
        categories.forEach(cat => map.set(String(cat.id), cat.name));
        return map;
    }, [categories]);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [editProductId, setEditProductId] = useState<number | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
    const [deleteProduct, setDeleteProduct] = useState<Products | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    const [editForm, setEditForm] = useState({
        name: "",
        barcode: "",
        category_id: "",
        price: 0,
        quantity: 0,
        unit: "pcs",
    });

    // Optimized filtering with useMemo
    const filteredProducts = useMemo(() => {
        let list: Product[] = products;

        // Early return if no filters
        if (selectedCategory === "all" && selectedStatus === "all" && !search.trim()) {
            return list;
        }

        if (selectedCategory !== "all") {
            list = list.filter((p) => String(p.category_id) === selectedCategory);
        }

        if (selectedStatus !== "all") {
            list = list.filter((p) => {
                const status = p.quantity === 0 ? "out of stock" : p.quantity < 5 ? "low stock" : "in stock";
                return status === selectedStatus;
            });
        }

        const searchTerm = search.trim().toLowerCase();
        if (searchTerm) {
            list = list.filter((p) => {
                const name = p.name?.toLowerCase() || "";
                const barcode = p.barcode?.toLowerCase() || "";
                return name.includes(searchTerm) || barcode.includes(searchTerm);
            });
        }

        return list;
    }, [products, selectedCategory, selectedStatus, search]);

    // Memoize mapped products
    const mappedProducts = useMemo(
        () => filteredProducts.map((p) => mapProductToRow(p, categoryMap)),
        [filteredProducts, categoryMap]
    );

    // Reset page when filters change
    useEffect(() => setPage(0), [selectedCategory, selectedStatus, search]);

    const pageCount = Math.max(1, Math.ceil(mappedProducts.length / pageSize));

    const editProduct = useMemo(
        () => products.find((p) => p.id === editProductId),
        [products, editProductId]
    );

    // Sync edit form
    useEffect(() => {
        if (showEditDialog && editProduct) {
            setEditForm({
                name: editProduct.name || "",
                barcode: editProduct.barcode || "",
                category_id: String(editProduct.category_id || ""),
                price: editProduct.price || 0,
                quantity: editProduct.quantity || 0,
                unit: editProduct.unit || "pcs",
            });
        }
    }, [showEditDialog, editProduct]);

    const handleEdit = useCallback((row: Products) => {
        setEditProductId(Number(row.id));
        setShowEditDialog(true);
        setShowUpdateConfirm(false);
    }, []);

    const handleDelete = useCallback((row: Products) => {
        setDeleteProduct(row);
        setShowDeleteDialog(true);
    }, []);

    const handleUpdateProduct = useCallback(async () => {
        if (!editProduct) return;

        const updatedData = {
            name: editForm.name,
            barcode: editForm.barcode,
            category_id: Number(editForm.category_id),
            price: Number(editForm.price),
            quantity: Number(editForm.quantity),
            unit: editForm.unit,
        };

        try {
            // Optimistic update
            const optimisticProduct = { ...editProduct, ...updatedData };

            mutate(
                PRODUCTS_KEY,
                (current: Product[] = []) =>
                    current.map(p => p.id === editProduct.id ? optimisticProduct : p),
                false
            );

            await productApi.update(Number(editProduct.id), updatedData);

            showSuccessToast("Product updated", `${editForm.name} has been updated.`);

            setShowEditDialog(false);
            setShowUpdateConfirm(false);

            // Final revalidation
            mutate(PRODUCTS_KEY);

        } catch (err: any) {
            // Revert on error
            mutate(PRODUCTS_KEY);
            showErrorToast("Failed to update product", err?.message || "An error occurred.");
        }
    }, [editProduct, editForm]);

    const handleDeleteProduct = useCallback(async () => {
        if (!deleteProduct) return;

        const productId = Number(deleteProduct.id);

        try {
            // Optimistic update
            mutate(
                PRODUCTS_KEY,
                (current: Product[] = []) => current.filter(p => p.id !== productId),
                false
            );

            await productApi.delete(productId);

            showSuccessToast("Product deleted", `${deleteProduct.productName} has been deleted.`);

            setShowDeleteDialog(false);
            setDeleteProduct(null);
            onProductDeleted?.(productId);

            // Final revalidation
            mutate(PRODUCTS_KEY);

        } catch (err: any) {
            // Revert on error
            mutate(PRODUCTS_KEY);
            showErrorToast("Failed to delete product", err?.message || "An error occurred.");
        }
    }, [deleteProduct, onProductDeleted]);

    // Enhanced columns with actions and mobile card
    const enhancedColumns = useMemo(
        () =>
            columns.map((col) =>
                col.id === "actions"
                    ? {
                        ...col,
                        cell: ({ row }: any) => (
                            <div className="flex gap-2 justify-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEdit(row.original)}
                                    disabled={isLoading}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDelete(row.original)}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ),
                    }
                    : col.id === "mobileCard"
                    ? {
                        ...col,
                        cell: ({ row }: any) => {
                            const statusText = String(row.original.status || "");
                            const statusClass =
                              statusText === "in stock"
                                ? "bg-green-100 text-green-800"
                                : statusText === "low stock"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800";

                            return (
                              <div className="w-full py-2">
                                <div className="bg-white rounded-lg p-3 shadow-sm max-w-full overflow-hidden">
                                  {/* Top row: Product Name + Actions - FIXED layout */}
                                  <div className="flex items-start gap-2 mb-3 w-full">
                                    {/* Product Name - grows but limited by container */}
                                    <div className="flex-1 min-w-0 max-w-[calc(100%-72px)]">
                                      <h3 className="font-semibold text-sm leading-tight break-words whitespace-normal overflow-wrap-anywhere">
                                        {row.original.productName}
                                      </h3>
                                    </div>
                                    
                                    {/* Action buttons - FIXED width 72px (2 buttons * 32px + gap) */}
                                    <div className="flex gap-1 flex-shrink-0 w-[68px]">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-gray-100 flex-shrink-0"
                                        onClick={() => handleEdit(row.original)}
                                        disabled={isLoading}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-gray-100 flex-shrink-0"
                                        onClick={() => handleDelete(row.original)}
                                        disabled={isLoading}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Grid: Lane, Status, Quantity, Price */}
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div className="bg-gray-50 rounded-md px-2.5 py-2">
                                      <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Lane</div>
                                      <div className="text-sm font-medium text-gray-900 truncate">{row.original.category}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-md px-2.5 py-2">
                                      <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Status</div>
                                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                                        {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                                      </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-md px-2.5 py-2">
                                      <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Quantity</div>
                                      <div className="text-sm font-medium text-gray-900">{row.original.currentStock}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-md px-2.5 py-2">
                                      <div className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide">Price</div>
                                      <div className="text-sm font-medium text-gray-900">₱{row.original.productPrice}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                        },
                    }
                    : col
            ),
        [handleEdit, handleDelete, isLoading]
    );

    return (
        <div className="w-full mt-4 relative">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-200 z-10">
                    <div className="h-full bg-blue-500 animate-pulse"></div>
                </div>
            )}

            <DataTable
                columns={enhancedColumns}
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

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    {showUpdateConfirm ? (
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
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>Update product details below.</DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-name">Product Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <Label htmlFor="edit-barcode">Barcode</Label>
                                        <Input
                                            id="edit-barcode"
                                            value={editForm.barcode}
                                            onChange={(e) => setEditForm(f => ({ ...f, barcode: e.target.value }))}
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col gap-2">
                                        <Label htmlFor="edit-category">Category</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Input
                                                    readOnly
                                                    value={categoryMap.get(editForm.category_id) || ""}
                                                    placeholder="Select category"
                                                    className="cursor-pointer"
                                                />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {categories.map((cat) => (
                                                    <DropdownMenuItem
                                                        key={cat.id}
                                                        onClick={() => setEditForm(f => ({ ...f, category_id: String(cat.id) }))}
                                                    >
                                                        {cat.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <Label htmlFor="edit-price">Price</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                            <Input
                                                id="edit-price"
                                                type="number"
                                                value={editForm.price || ""}
                                                onChange={(e) => setEditForm(f => ({ ...f, price: Number(e.target.value) || 0 }))}
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-2">
                                        <Label htmlFor="edit-quantity">Quantity</Label>
                                        <Input
                                            id="edit-quantity"
                                            type="number"
                                            value={editForm.quantity || ""}
                                            onChange={(e) => setEditForm(f => ({ ...f, quantity: Number(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-unit">Unit</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="w-full justify-between"
                                            >
                                                {editForm.unit === "pcs" ? "pcs (pieces)" : 
                                                 editForm.unit === "kg" ? "kg (kilogram)" : 
                                                 editForm.unit === "pck" ? "pck (pack)" : "pcs (pieces)"}
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-full">
                                            <DropdownMenuItem
                                                onClick={() => setEditForm(f => ({ ...f, unit: "pcs" }))}
                                            >
                                                pcs (pieces)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setEditForm(f => ({ ...f, unit: "kg" }))}
                                            >
                                                kg (kilogram)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setEditForm(f => ({ ...f, unit: "pck" }))}
                                            >
                                                pck (pack)
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => setShowUpdateConfirm(true)}>
                                        Update Product
                                    </Button>
                                </DialogFooter>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the product.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProduct}>
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}