import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { useAddProduct } from "@/hooks/products/useAddProducts";

interface HeadProps {
    onProductAdded: (product: Product) => void;
}

export default function Head({ onProductAdded }: HeadProps) {
    const [name, setName] = useState("");
    const [barcode, setBarcode] = useState("");
    const [category_id, setCategoryId] = useState("");
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const { addProduct, loading, error, success, reset } = useAddProduct();

    const handleAddProduct = async () => {
        const newProduct = {
            name,
            barcode,
            category_id: Number(category_id),
            price: Number(price),
            quantity: Number(quantity),
        };
        // result should be the product returned from addProduct (with id)
        const result = await addProduct(newProduct);
        if (result && onProductAdded) {
            onProductAdded(result); // <-- Pass the product with id
            setName("");
            setBarcode("");
            setCategoryId("");
            setPrice(0);
            setQuantity(0);
            setShowForm(false);
            setShowSuccess(true);
        } else {
            setShowForm(false);
            setShowSuccess(true);
        }
    };

    return (
        <div className="flex justify-between items-center h-full">
            <div className="text-4xl font-bold">
                <h1>Products</h1>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                    <Button
                        className="flex items-center justify-center gap-2 p-6"
                        onClick={() => {
                            setShowForm(true);
                            setName("");
                            setBarcode("");
                            setCategoryId("");
                            setPrice(0);
                            setQuantity(0);
                        }}
                    >
                        <Plus className="text-white w-5 h-5 !w-5 !h-5" />
                        Add Product
                    </Button>
                </DialogTrigger>
                <DialogContent className='data-[state=open]:!zoom-in-100 data-[state=open]:slide-in-from-left-20 data-[state=open]:duration-600 sm:max-w-xl'>
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
                                <Input id='barcode-1' name='barcode' value={barcode} onChange={e => setBarcode(e.target.value)} />
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
                        <Button onClick={handleAddProduct}>Add Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={showSuccess}
                onOpenChange={(open) => {
                    setShowSuccess(open);
                    if (!open) reset(); // Reset only after dialog closes
                }}
            >                <DialogContent>
                    <div className="flex flex-col items-center justify-center py-2">
                        <div className="mb-4">
                            {error ? (
                                <span className="text-red-500 text-4xl">&#10007;</span>
                            ) : (
                                <span className="text-green-500 text-4xl">&#10003;</span>
                            )}
                        </div>
                        <DialogTitle className="mb-2 text-center">
                            {error ? "Error Adding Product" : "Product Added!"}
                        </DialogTitle>
                        <DialogDescription className="mb-4 text-center">
                            {error
                                ? error
                                : "Congratulations! Your product has been added successfully."}
                        </DialogDescription>
                        {error ? (
                            <div className="flex gap-2 mt-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowSuccess(false); // Close error dialog
                                        setShowForm(true);    // Reopen form dialog
                                        reset();              // Clear error state, keep inputs
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSuccess(false);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => {
                                    setShowSuccess(false);
                                }}
                            >
                                Close
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}