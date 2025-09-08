"use client";
import { useEffect } from "react";
import { useProductModal } from "@/contexts/productRegister-context";
import { useProductFormStore } from "@/stores/productFormStore";
import AddCategoryModal from "@/app/dashboard/_pages/Products/components/addCategoryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProductForm from "./ProductForm";

export default function ProductRegisterModal() {
    const { open, setOpen, barcode: contextBarcode, setBarcode: setContextBarcode } = useProductModal();
    const resetFormStore = useProductFormStore(s => s.reset);

    // Clean up when modal closes
    useEffect(() => {
        if (!open) {
            resetFormStore();
        }
    }, [open, resetFormStore]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Product</DialogTitle>
                        <DialogDescription>Fill in the details below to add a new product.</DialogDescription>
                    </DialogHeader>
                    
                    <ProductForm 
                        contextBarcode={contextBarcode}
                        setContextBarcode={setContextBarcode}
                        onClose={() => setOpen(false)} 
                    />
                </DialogContent>
            </Dialog>

            <AddCategoryModal />
        </>
    );
}