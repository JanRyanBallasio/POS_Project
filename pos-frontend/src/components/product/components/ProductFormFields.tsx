"use client";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductFormValues } from "./ProductFormSchema";
import CategorySelector from "./CategorySelector";
import PriceQuantityFields from "./PriceQuantityFields";

type Props = {
    form: UseFormReturn<ProductFormValues>;
    errors: any;
    selectedCategoryName: string;
    onSelectCategory: (cat: any) => void;
    onFieldChangeStore: (field: string, value: string) => void;
};

export default function ProductFormFields({ 
    form, 
    errors, 
    selectedCategoryName, 
    onSelectCategory, 
    onFieldChangeStore 
}: Props) {
    const { register, setValue, watch } = form;
    
    const nameValue = watch("name");
    const barcodeValue = watch("barcode");

    return (
        <>
            <div className="flex flex-col gap-2">
                <Label htmlFor="name-1">Product Name</Label>
                <Input
                    id="name-1"
                    value={nameValue || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setValue("name", e.target.value, { shouldValidate: true });
                        onFieldChangeStore("name", e.target.value);
                    }}
                    className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="flex flex-row gap-2 mt-4">
                <div className="flex-1 flex flex-col gap-2">
                    <Label htmlFor="barcode-1">Barcode</Label>
                    <Input
                        id="barcode-1"
                        value={barcodeValue || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue("barcode", e.target.value, { shouldValidate: true });
                            onFieldChangeStore("barcode", e.target.value);
                        }}
                        className={errors.barcode ? "border-red-500" : ""}
                    />
                    {errors.barcode && <p className="text-sm text-red-500 mt-1">{errors.barcode.message}</p>}
                </div>

                <CategorySelector 
                    form={form}
                    errors={errors}
                    selectedCategoryName={selectedCategoryName}
                    onSelectCategory={onSelectCategory}
                />
            </div>

            <PriceQuantityFields 
                form={form}
                errors={errors}
                onFieldChangeStore={onFieldChangeStore}
            />
        </>
    );
}