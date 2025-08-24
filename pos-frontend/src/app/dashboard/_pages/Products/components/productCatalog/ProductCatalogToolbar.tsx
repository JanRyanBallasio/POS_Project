
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Funnel } from 'lucide-react';
import { useCategories } from "@/hooks/global/fetching/useCategories";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useRef, useState, useMemo, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";


interface ProductCatalogToolbarProps {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    selectedProducts: string;
    setSelectedProducts: (products: string) => void;
    search: string;
    setSearch: (s: string) => void;
}
export default function ProductCatalogToolbar({
    selectedCategory,
    setSelectedCategory,
    selectedProducts,
    setSelectedProducts,
    search,
    setSearch
}: ProductCatalogToolbarProps) {
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const [categorySearch, setCategorySearch] = useState("");

    const handleReset = useCallback(() => {
        setSelectedCategory("all");
        setSelectedProducts("all");
        setCategorySearch("");
        setSearch("");
    }, [setSelectedCategory, setSelectedProducts]);

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    }
    // memoize filtered categories to avoid recalculating on every render
    const filteredCategories = useMemo(() => {
        const list = categories || [];
        const q = categorySearch.trim().toLowerCase();
        if (!q) return list;
        return list.filter(cat => cat.name.toLowerCase().includes(q));
    }, [categories, categorySearch]);

    // only update selectedCategory when the value actually changes
    const onCategoryChange = useCallback((val: string) => {
        if (val !== selectedCategory) setSelectedCategory(val);
    }, [selectedCategory, setSelectedCategory]);

    const onProductsChange = useCallback((val: string) => {
        if (val !== selectedProducts) setSelectedProducts(val);
    }, [selectedProducts, setSelectedProducts]);

    const onCategorySearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (v !== categorySearch) setCategorySearch(v);
    }, [categorySearch]);

    return (
        <div className="flex justify-between items-center">
            <div className="relative flex items-center w-[700px]">
                <Search
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                />
                <Input
                    className="pl-9 w-full"
                    placeholder="Search by product name or barcode..."
                    value={search}
                    onChange={onSearchChange}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="class"></div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Funnel />
                        Filter
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] mr-18">
                    <DropdownMenuLabel>Filter</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                        <h1 className="text-sm font-medium">Category</h1>
                        <Select
                            value={selectedCategory}
                            onValueChange={onCategoryChange}
                        >
                            <SelectTrigger className="w-full mt-2">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* search input for categories */}
                                <div className="p-2">
                                    <Input
                                        placeholder="Search category..."
                                        value={categorySearch}
                                        onChange={onCategorySearchChange}
                                        className="mb-2"
                                    />
                                </div>

                                <SelectItem value="all">All Categories</SelectItem>

                                {categoriesLoading && <div className="p-2 text-gray-400">Loading categories...</div>}
                                {categoriesError && <div className="p-2 text-red-500">{categoriesError}</div>}

                                {/* show only 3 items visible, enable scroll when there are more than 3 */}
                                {!categoriesLoading && !categoriesError && (
                                    filteredCategories.length > 5 ? (
                                        <div className="p-2 max-h-40 overflow-auto">
                                            {filteredCategories.map(category => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ) : (
                                        filteredCategories.map(category => (
                                            <SelectItem key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </SelectItem>
                                        ))
                                    )
                                )}

                                {!categoriesLoading && !categoriesError && filteredCategories.length === 0 && (
                                    <div className="p-2 text-gray-400">No categories found.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                        <h1 className="text-sm font-medium">Status</h1>
                        <Select
                            value={selectedProducts}
                            onValueChange={onProductsChange}
                        >
                            <SelectTrigger className="w-full mt-2">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stock</SelectItem>
                                <SelectItem value="in stock">In Stock</SelectItem>
                                <SelectItem value="low stock">Low Stock</SelectItem>
                                <SelectItem value="out of stock">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="flex justify-between w-full p-2 font-thin ">
                        <Button className="font-normal bg-white text-black border" variant="ghost" onClick={handleReset}>Reset All</Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}