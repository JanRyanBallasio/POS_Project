"use client";
import { useProductModal } from "@/contexts/productRegister-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAddProduct } from "@/hooks/products/useAddProducts";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useCategories } from "@/hooks/global/fetching/useCategories";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
export default function ProductRegisterModal() {
    const { open, setOpen, barcode: contextBarcode, setBarcode: setContextBarcode } = useProductModal();
    const [name, setName] = useState("");
    const [barcode, setBarcode] = useState("");
    const [category_id, setCategoryId] = useState("");
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [categorySearch, setCategorySearch] = useState("");
    const { addProduct, loading, error, reset } = useAddProduct();
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const { refetch } = useProducts(); // This gives you mutate for products
    const handleAddProduct = async () => {

        const newProduct = {
            name,
            barcode,
            category_id: Number(category_id),
            price: Number(price),
            quantity: Number(quantity),
        };
        const result = await addProduct(newProduct);
        if (result) {
            setOpen(false);
            setShowSuccessDialog(true);
            refetch();
        }
    };
    useEffect(() => {
        if (open && contextBarcode) setBarcode(contextBarcode);
        if (!open) {
            setBarcode("");
            setContextBarcode("");
            setName("");
            // reset other fields as needed
            reset();
        }
    }, [open, contextBarcode, setContextBarcode, reset]);
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Input
                                            id="category-1"
                                            readOnly
                                            value={
                                                categories.find(c => String(c.id) === String(category_id))?.name || ""
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
                                                                setCategoryId(String(cat.id));
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