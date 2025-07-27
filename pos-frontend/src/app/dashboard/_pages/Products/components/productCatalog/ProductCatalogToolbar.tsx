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
import { useRef } from "react";



interface ProductCatalogToolbarProps {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    selectedProducts: string;
    setSelectedProducts: (products: string) => void;
}

export default function ProductCatalogToolbar({
    selectedCategory,
    setSelectedCategory,
    selectedProducts,
    setSelectedProducts
}: ProductCatalogToolbarProps) {
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

    const handleReset = () => {
        setSelectedCategory("all");
        setSelectedProducts("all");
    };

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
                            onValueChange={setSelectedCategory}
                        >
                            <SelectTrigger className="w-full mt-2">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categoriesLoading && <div className="p-2 text-gray-400">Loading categories...</div>}
                                {categoriesError && <div className="p-2 text-red-500">{categoriesError}</div>}
                                {!categoriesLoading && !categoriesError && categories.map(category => (
                                    <SelectItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                        <h1 className="text-sm font-medium">Status</h1>
                        <Select
                            value={selectedProducts}
                            onValueChange={setSelectedProducts}
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