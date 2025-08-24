import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { DataTable } from "../../table/dataTable";
import { columns, Products } from "../../table/columns";
import { Product, productApi } from "@/hooks/products/useProductApi";
import Pagination from "./Pagination";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCategories } from "@/hooks/global/fetching/useCategories";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogClose } from "@/components/ui/dialog";

// SWR fetcher for products
const fetcher = () => productApi.getAll();

const PAGE_SIZE = 6;

function mapProductToPayment(product: Product, categories: { id: number; name: string }[]): Products {
    let status: "in stock" | "low stock" | "out of stock";
    if (product.quantity === 0) status = "out of stock";
    else if (product.quantity < 5) status = "low stock";
    else status = "in stock";
    // Find category name
    const category = categories.find(c => String(c.id) === String(product.category_id));
    return {
        id: String(product.id),
        productName: product.name,
        barcode: product.barcode ?? "",
        category: category ? category.name : `Category ${product.category_id}`,
        currentStock: product.quantity,
        productPrice: product.price,
        status,
    };
}

type ProductTableProps = {
    selectedCategory: string;
    selectedStatus: string;
    onProductDeleted?: (id: number) => void; // <-- Add this line
    search?: string;
};

export default function ProductTable({
    selectedCategory,
    selectedStatus,
    onProductDeleted,
    search = "",
}: ProductTableProps) {
    // Use SWR for products
    const { data: products = [], isLoading, error } = useSWR("/api/products", fetcher, { revalidateOnFocus: false });

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);

    // Edit state
    const [editProductId, setEditProductId] = useState<number | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

    // Delete state
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Categories
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const [categorySearch, setCategorySearch] = useState("");

    // Edit form state
    const [editForm, setEditForm] = useState({
        name: "",
        barcode: "",
        category_id: "",
        price: 0,
        quantity: 0,
    });

    // Find the product to edit from SWR data
    const editProduct = products.find((p: Product) => String(p.id) === String(editProductId));

    // Sync editForm with product data
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
    }, [showEditDialog, editProductId]);

    // Filtered products
    let filteredProducts = selectedCategory === "all"
        ? products
        : products.filter((p: Product) => String(p.category_id) === selectedCategory);

    if (selectedStatus && selectedStatus !== "all") {
        filteredProducts = filteredProducts.filter((p: Product) => {
            let status: "in stock" | "low stock" | "out of stock";
            if (p.quantity === 0) status = "out of stock";
            else if (p.quantity < 5) status = "low stock";
            else status = "in stock";
            return status === selectedStatus;
        });
    }

    // Search filter (by name or barcode, case-insensitive)
    const q = (search || "").trim().toLowerCase();
    if (q.length > 0) {
        filteredProducts = filteredProducts.filter((p: Product) => {
            const name = String(p.name ?? "").toLowerCase();
            const barcode = String(p.barcode ?? "").toLowerCase();
            return name.includes(q) || barcode.includes(q);
        });
    }

    // Reset page when filters/search change
    useEffect(() => {
        setPage(0);
    }, [selectedCategory, selectedStatus, search]);

    const mappedProducts: Products[] = (filteredProducts ?? []).map(p => mapProductToPayment(p, categories)); const pageCount = Math.max(1, Math.ceil(mappedProducts.length / pageSize));

    // Open edit dialog
    const handleEdit = (product: Product) => {
        setEditProductId(product.id);
        setShowEditDialog(true);
        setShowUpdateConfirm(false);
    };

    // Open delete dialog
    const handleDelete = (product: Product) => {
        setDeleteProduct(product);
        setShowDeleteDialog(true);
    };

    // Update product and revalidate SWR
    const handleUpdateProduct = async () => {
        setShowUpdateConfirm(false);
        if (!editProduct) {
            toast("Product data not loaded", { description: "Please try again." });
            return;
        }
        try {
            await productApi.update(editProduct.id, {
                name: editForm.name,
                barcode: editForm.barcode,
                category_id: Number(editForm.category_id),
                price: Number(editForm.price),
                quantity: Number(editForm.quantity),
            });
            toast("Product updated", { description: `${editForm.name} has been updated.` });
            setShowEditDialog(false);
            mutate("/api/products");
        } catch (err: any) {
            toast("Failed to update product", { description: err?.message || "An error occurred." });
        }
    };

    // Delete product and revalidate SWR
    const handleDeleteProduct = async () => {
        if (!deleteProduct) return;
        try {
            await productApi.delete(deleteProduct.id);
            toast("Product deleted", { description: `${deleteProduct.name} has been deleted.` });
            setShowDeleteDialog(false);
            setDeleteProduct(null); // Clear the state after deletion
            mutate("/api/products");
            if (onProductDeleted) onProductDeleted(deleteProduct.id); // <-- Call the callback
        } catch (err: any) {
            toast("Failed to delete product", { description: err?.message || "An error occurred." });
        }
    };


    return (
        <div className="w-full mt-4 relative">
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
                                        disabled={isLoading}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(row.original)}>
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

            {/* Edit Product Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    {!editProduct ? (
                        <>
                            <DialogTitle>Loading</DialogTitle>
                            <DialogDescription>Loading product data...</DialogDescription>
                            <div className="p-4 text-center">Loading...</div>
                        </>

                    ) : showUpdateConfirm ? (
                        <>
                            <div className="flex flex-col items-center justify-center py-8">
                                <h2 className="font-bold text-lg mb-2">Are you absolutely sure?</h2>
                                <p className="mb-6 text-gray-500">This will update the product details.</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setShowUpdateConfirm(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdateProduct}>
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Product</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to update the product.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-name">Product Name</Label>
                                    <Input
                                        id="edit-name"
                                        name="name"
                                        value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    />
                                </div>
                                <div className="flex flex-row gap-2 mt-4">
                                    <div className="flex-[50%] flex flex-col gap-2">
                                        <Label htmlFor="edit-barcode">Barcode</Label>
                                        <Input
                                            id="edit-barcode"
                                            name="barcode"
                                            value={editForm.barcode}
                                            onChange={e => setEditForm(f => ({ ...f, barcode: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex-[50%] flex flex-col gap-2">
                                        <Label htmlFor="edit-category">Category</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Input
                                                    id="edit-category"
                                                    readOnly
                                                    value={categories.find(c => String(c.id) === String(editForm.category_id))?.name || ""}
                                                    placeholder="Select category"
                                                    className="cursor-pointer"
                                                />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64">
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
                                                    <>
                                                        {categories
                                                            .filter(cat =>
                                                                cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                                            )
                                                            .map(cat => (
                                                                <DropdownMenuItem
                                                                    key={cat.id}
                                                                    onClick={() => {
                                                                        setEditForm(f => ({ ...f, category_id: String(cat.id) }));
                                                                        setCategorySearch("");
                                                                    }}
                                                                >
                                                                    {cat.name}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        {categories.filter(cat =>
                                                            cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                                        ).length === 0 && (
                                                                <div className="p-2 text-gray-400">No categories found.</div>
                                                            )}
                                                    </>
                                                )}
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
                                                onChange={e =>
                                                    setEditForm(f => ({
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
                                            onChange={e =>
                                                setEditForm(f => ({
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
                                    <Button onClick={() => setShowUpdateConfirm(true)}>
                                        Update Product
                                    </Button>
                                </DialogFooter>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the product and remove it from your database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProduct}
                            disabled={!deleteProduct}
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}