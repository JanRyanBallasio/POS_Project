"use client";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories } from "@/hooks/global/fetching/useCategories";
import { useProductModal } from "@/contexts/productRegister-context";
import { ProductFormValues, getCategoryId } from "./ProductFormSchema";

type Props = {
    form: UseFormReturn<ProductFormValues>;
    errors: any;
    selectedCategoryName: string;
    onSelectCategory: (cat: any) => void;
};

export default function CategorySelector({ 
    form, 
    errors, 
    selectedCategoryName, 
    onSelectCategory 
}: Props) {
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const { openModal } = useProductModal();
    const [categorySearch, setCategorySearch] = useState("");

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        const q = categorySearch.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((c: any) => (c?.name || "").toLowerCase().includes(q));
    }, [categories, categorySearch]);

    return (
        <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="category-1">Category</Label>
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Input
                            id="category-1"
                            readOnly
                            value={selectedCategoryName}
                            placeholder="Select category"
                            className={`cursor-pointer ${errors.category_id ? "border-red-500" : ""}`}
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-0">
                        <div className="p-2">
                            <Input
                                placeholder="Search category..."
                                value={categorySearch}
                                onChange={e => setCategorySearch(e.target.value)}
                                className="mb-2"
                            />
                        </div>

                        {categoriesLoading && <div className="p-2 text-gray-400">Loading...</div>}
                        {categoriesError && <div className="p-2 text-red-500">{categoriesError}</div>}

                        {!categoriesLoading && !categoriesError && (
                            <ScrollArea className="h-40">
                                <div className="p-2">
                                    {filteredCategories.map((cat) => {
                                        const idString = String(getCategoryId(cat));
                                        return (
                                            <DropdownMenuItem key={idString} onClick={() => onSelectCategory(cat)}>
                                                {cat.name}
                                            </DropdownMenuItem>
                                        );
                                    })}

                                    {filteredCategories.length === 0 && (
                                        <div className="p-2 text-gray-400">No categories found.</div>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => (typeof openModal === "function" ? openModal("addCategory") : null)}
                    aria-label="Add Category"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            {errors.category_id && <p className="text-sm text-red-500 mt-1">{errors.category_id.message}</p>}
        </div>
    );
}