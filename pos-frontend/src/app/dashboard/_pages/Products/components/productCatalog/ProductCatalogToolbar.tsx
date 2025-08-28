import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Funnel } from "lucide-react";
import { useCategories } from "@/hooks/global/fetching/useCategories";
import { useState, useMemo, useCallback } from "react";

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
  setSearch,
}: ProductCatalogToolbarProps) {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [categorySearch, setCategorySearch] = useState("");

  const handleReset = useCallback(() => {
    setSelectedCategory("all");
    setSelectedProducts("all");
    setCategorySearch("");
    setSearch("");
  }, [setSelectedCategory, setSelectedProducts, setSearch]);

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, [setSearch]);

  const onCategorySearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCategorySearch(e.target.value);
  }, []);

  const filteredCategories = useMemo(() => {
    const list = categories ?? [];
    const q = categorySearch.trim().toLowerCase();
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  }, [categories, categorySearch]);

  const onCategoryChange = useCallback(
    (val: string) => {
      setSelectedCategory(val);
    },
    [setSelectedCategory]
  );

  const onProductsChange = useCallback(
    (val: string) => {
      setSelectedProducts(val);
    },
    [setSelectedProducts]
  );

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex items-center flex-1 max-w-[700px]">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-9 w-full"
          placeholder="Search by product name or barcode..."
          value={search}
          onChange={onSearchChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Funnel />
            Filter
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[320px]">
          <div className="p-3">
            <h3 className="text-sm font-medium">Filter</h3>
          </div>
          <DropdownMenuSeparator />

          <div className="p-3">
            <h4 className="text-sm font-medium">Category</h4>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Category" />
              </SelectTrigger>

              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search category..."
                    value={categorySearch}
                    onChange={onCategorySearchChange}
                    className="mb-2"
                  />
                </div>

                <div className="max-h-40 overflow-auto">
                  <SelectItem value="all">All Categories</SelectItem>

                  {categoriesLoading && <SelectItem value="loading" disabled>Loading categories...</SelectItem>}
                  {categoriesError && <SelectItem value="error" disabled>{String(categoriesError)}</SelectItem>}

                  {!categoriesLoading && !categoriesError && filteredCategories.length === 0 && (
                    <SelectItem value="none" disabled>No categories found</SelectItem>
                  )}

                  {!categoriesLoading && !categoriesError &&
                    filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenuSeparator />

          <div className="p-3">
            <h4 className="text-sm font-medium">Status</h4>
            <Select value={selectedProducts} onValueChange={onProductsChange}>
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

          <div className="flex justify-end p-3">
            <Button variant="ghost" className="font-normal" onClick={handleReset}>
              Reset All
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
