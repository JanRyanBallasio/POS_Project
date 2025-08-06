"use client";

import { useProductModal } from "@/contexts/productRegister-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAddProduct } from "@/hooks/products/useAddProducts";
import { mutate } from "swr";

export default function ProductRegisterModal() {
    const { open, setOpen, barcode, setBarcode } = useProductModal();
    const [name, setName] = useState("");
    const [category_id, setCategoryId] = useState("");
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const { addProduct, loading, error, success, reset } = useAddProduct();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const handleAddProduct = async () => {
        const newProduct = {
            name,
            barcode: barcode ?? "",
            category_id: Number(category_id),
            price: Number(price),
            quantity: Number(quantity),
        };
        console.log("Adding product:", newProduct);
        const result = await addProduct(newProduct);
        console.log("Add product result:", result);
        setOpen(false);
        setName("");
        setBarcode("");
        setCategoryId("");
        setPrice(0);
        setQuantity(0);
        setShowSuccessDialog(true);
        console.log("Mutating SWR for products...");
        // mutate("http://localhost:5000/api/products", undefined, true).then(() => {
        mutate("http://13.211.162.106:5000/api/products", undefined, true).then(() => {
            console.log("SWR mutate finished");
        });
    };
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
                                <Input id='category-1' name='category_id' value={category_id} onChange={e => setCategoryId(e.target.value)} />
                            </div>
                        </div>
                        <div className='flex flex-row gap-2 my-4'>
                            <div className="flex-[50%] flex flex-col gap-2">
                                <Label htmlFor='price-1'>Price</Label>
                                <Input
                                    id='price-1'
                                    name='price'
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(Number(e.target.value))}
                                />
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