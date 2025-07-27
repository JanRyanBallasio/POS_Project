import { useState } from "react";
import { DataTable } from "../../table/dataTable";
import { columns, Products } from "../../table/columns";
import { productApi } from "@/hooks/products/useProductApi";
import Pagination from "./Pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductTableProps {
    products: any[];
    selectedCategory: string;
    selectedStatus: string;
    onProductDeleted?: (id: number) => void; // <-- Add this
}

const PAGE_SIZE = 6;

function mapProductToPayment(product: any): Products {
    let status: "in stock" | "low stock" | "out of stock";
    if (product.quantity === 0) status = "out of stock";
    else if (product.quantity < 5) status = "low stock";
    else status = "in stock";
    return {
        id: product.id,
        productName: product.name,
        barcode: product.barcode,
        category: `Category ${product.category_id}`,
        currentStock: product.quantity,
        productPrice: product.price,
        status,
    };
}

export default function ProductTable({ products, selectedCategory, selectedStatus, onProductDeleted}: ProductTableProps) {
    const [page, setPage] = useState(0);
    const [filteredCount, setFilteredCount] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);

    // Step 1: Add state for dialogs
    const [editProduct, setEditProduct] = useState<any | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const [deleteProduct, setDeleteProduct] = useState<any | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    let filteredProducts = selectedCategory === "all"
        ? products
        : products.filter(p => String(p.category_id) === selectedCategory);

    if (selectedStatus && selectedStatus !== "all") {
        filteredProducts = filteredProducts.filter(p => {
            let status: "in stock" | "low stock" | "out of stock";
            if (p.quantity === 0) status = "out of stock";
            else if (p.quantity < 5) status = "low stock";
            else status = "in stock";
            return status === selectedStatus;
        });
    }

    const mappedProducts: Products[] = (filteredProducts ?? []).map(mapProductToPayment);

    const pageCount = Math.max(1, Math.ceil(mappedProducts.length / pageSize));

    // Step 1: Button handlers
    const handleEdit = (product: any) => {
        setEditProduct(product);
        setShowEditDialog(true);
    };

    const handleDelete = (product: any) => {
        setDeleteProduct(product);
        setShowDeleteDialog(true);
    };

    return (
        <div className="w-full mt-4 relative">
            <DataTable
                columns={columns.map(col =>
                    col.id === "actions"
                        ? {
                            ...col,
                            cell: ({ row }: any) => (
                                <div className="flex gap-5 justify-center">
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(row.original)}>
                                        Edit
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(row.original)}>
                                        Delete
                                    </Button>
                                </div>
                            ),
                        }
                        : col
                )}
                data={mappedProducts}
                page={page}
                pageSize={pageSize}
                onFilteredCountChange={setFilteredCount}
            />
            <div className="mt-7">
                <Pagination
                    page={page}
                    pageCount={pageCount}
                    setPage={setPage}
                    pageSize={pageSize}
                    onPageSizeChange={size => {
                        setPageSize(size);
                        setPage(0);
                    }}
                />
            </div>
            {/* Step 1: Placeholder dialogs */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Do you want to edit this product?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        <Button onClick={() => setShowEditDialog(false)}>Edit (not implemented)</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Do you want to delete this product?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (deleteProduct) {
                                    try {
                                        await productApi.delete(deleteProduct.id);
                                        toast("Product deleted", {
                                            description: `${deleteProduct.productName} has been deleted.`,
                                        });
                                        setShowDeleteDialog(false);
                                        if (onProductDeleted) onProductDeleted(deleteProduct.id); // <-- Notify parent
                                    } catch (err: any) {
                                        toast("Failed to delete product", {
                                            description: err?.message || "An error occurred.",
                                        });
                                    }
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}