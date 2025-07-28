import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import React from "react";
import { Product } from "@/hooks/products/useProductApi";

interface ProductSearchProps {
  searchQuery: string;
  searchResults: Product[];
  showSearchResults: boolean;
  handleSearchChange: (val: string) => void;
  handleSearchSelect: (product: Product) => void;
  clearSearch: () => void;
  refocusScanner: () => void;
  disabled?: boolean;
}

export default function ProductSearch({
  searchQuery,
  searchResults,
  showSearchResults,
  handleSearchChange,
  handleSearchSelect,
  refocusScanner,
  disabled = false,
}: ProductSearchProps) {
  return (
    <div className="relative mb-6">
      <div className="relative flex items-center">
        <Search
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <Input
          className="pl-9 w-full"
          placeholder="Search by product name or barcode..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={refocusScanner}
          disabled={disabled}
        />
      </div>
      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          {searchResults.map((product) => (
            <div
              key={product.id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSearchSelect(product)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    Barcode: {product.barcode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ₱ {product.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showSearchResults &&
        searchResults.length === 0 &&
        searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 p-3 text-center text-gray-500">
            No products found matching "{searchQuery}"
          </div>
        )}
    </div>
  );
}
