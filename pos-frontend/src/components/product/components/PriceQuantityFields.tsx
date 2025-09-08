"use client";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductFormValues } from "./ProductFormSchema";

type Props = {
    form: UseFormReturn<ProductFormValues>;
    errors: any;
    onFieldChangeStore: (field: string, value: string) => void;
};

export default function PriceQuantityFields({ form, errors, onFieldChangeStore }: Props) {
    const { register, setValue, watch } = form;
    
    const priceValue = watch("price");
    const quantityValue = watch("quantity");

    return (
        <div className="flex flex-row gap-2 my-4">
            <div className="flex-1 flex flex-col gap-2">
                <Label htmlFor="price-1">Price</Label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">₱</span>
                    <Input
                        id="price-1"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={priceValue || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const v = e.target.value;
                            const numValue = v === "" ? 0 : Number(v);
                            if (!isNaN(numValue)) {
                                setValue("price", numValue, { shouldValidate: true });
                            }
                            onFieldChangeStore("price", v);
                        }}
                        className={`pl-8 ${errors.price ? "border-red-500" : ""}`}
                    />
                </div>
                {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
            </div>

            <div className="flex-1 flex flex-col gap-2">
                <Label htmlFor="quantity-1">Quantity</Label>
                <Input
                    id="quantity-1"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={quantityValue || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value;
                        const numValue = v === "" ? 0 : Number(v);
                        if (!isNaN(numValue)) {
                            setValue("quantity", numValue, { shouldValidate: true });
                        }
                        onFieldChangeStore("quantity", v);
                    }}
                    className={errors.quantity ? "border-red-500" : ""}
                />
                {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
        </div>
    );
}