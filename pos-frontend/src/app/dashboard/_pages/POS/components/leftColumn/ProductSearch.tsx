import { Input } from "@/components/ui/input";
import { Search, CheckCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/hooks/products/useProductApi";

interface ProductSearchProps {
  searchQuery: string;
  searchResults: Product[];
  showSearchResults: boolean;
  handleSearchChange: (val: string) => void;
  handleSearchSelect: (product: Product) => void;
  clearSearch: () => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  isScannerInputRef?: React.MutableRefObject<boolean>;
  isLoading?: boolean;
  onAddProduct?: () => void;
  // Add these new props
  handleDebugProductSelect?: (debugCode: string) => void;
  isDebugCheatCode?: (query: string) => boolean;
}

export default function ProductSearch({
  searchQuery,
  searchResults,
  showSearchResults,
  handleSearchChange,
  handleSearchSelect,
  clearSearch,
  disabled = false,
  inputRef,
  isScannerInputRef,
  isLoading,
  onAddProduct,
  handleDebugProductSelect,
  isDebugCheatCode,
}: ProductSearchProps) {
  const isAutoSelecting = searchResults.length === 1 && searchQuery.trim().length >= 2;
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(searchResults.length > 0 ? 0 : -1);
  }, [searchResults, showSearchResults]);

  // Keyboard navigation
  useEffect(() => {
    const inputEl = inputRef?.current;
    if (!inputEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        scrollToHighlighted();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        scrollToHighlighted();
      } else if (e.key === "Enter") {
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          e.preventDefault();
          e.stopPropagation();
          
          const selectedProduct = searchResults[highlightedIndex];
          
          // Check if it's a debug product
          if (isDebugCheatCode && handleDebugProductSelect && isDebugCheatCode(searchQuery)) {
            handleDebugProductSelect(searchQuery);
          } else {
            handleSearchSelect(selectedProduct);
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        clearSearch();
        requestAnimationFrame(() => {
          inputEl.focus();
          inputEl.select?.();
        });
      }
    };

    inputEl.addEventListener("keydown", handleKeyDown);
    return () => inputEl.removeEventListener("keydown", handleKeyDown);
  }, [searchResults, highlightedIndex, handleSearchSelect, clearSearch, inputRef, handleDebugProductSelect, isDebugCheatCode, searchQuery]);

  // Scroll highlighted item into view
  const scrollToHighlighted = () => {
    setTimeout(() => {
      if (resultsContainerRef.current) {
        const item = resultsContainerRef.current.querySelector(
          `[data-highlighted="true"]`
        );
        if (item) {
          (item as HTMLElement).scrollIntoView({ block: "nearest" });
        }
      }
    }, 0);
  };

  // Skip rendering dropdown if scanner already auto-selected
  const shouldShowDropdown =
    showSearchResults &&
    !isScannerInputRef?.current &&
    searchResults.length > 0;

  return (
    <div className="relative mb-6">
      <div className="relative flex items-center">
        <Search
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <Input
          ref={inputRef}
          data-product-search="true"
          data-search-open={showSearchResults ? "true" : "false"}
          className="pl-9 w-full"
          placeholder="Search by product name or barcode..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        {isAutoSelecting && !isScannerInputRef?.current && (
          <CheckCircle
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 animate-pulse"
            size={20}
          />
        )}
      </div>

      {isLoading && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 p-3 text-center text-gray-500">
          Searching...
        </div>
      )}

      {shouldShowDropdown && (
        <div
          ref={resultsContainerRef}
          className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-[32rem] overflow-y-auto"
        >
          {searchResults.map((product, idx) => (
            <div
              key={product.id}
              data-highlighted={highlightedIndex === idx}
              className={`p-3 cursor-pointer border-b last:border-b-0 ${
                highlightedIndex === idx
                  ? "bg-blue-100"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => {
                // Check if it's a debug product
                if (isDebugCheatCode && handleDebugProductSelect && isDebugCheatCode(searchQuery)) {
                  handleDebugProductSelect(searchQuery);
                } else {
                  handleSearchSelect(product);
                }
              }}
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-medium break-words whitespace-normal flex items-center gap-2">
                    {product.name}
                    {isDebugCheatCode && isDebugCheatCode(searchQuery) && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        DEBUG
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Barcode: {product.barcode}
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
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
        !isScannerInputRef?.current &&
        searchResults.length === 0 &&
        searchQuery.length >= 2 &&
        !isLoading && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 p-3 text-center text-gray-500">
            <div className="mb-2">
              No product found matching "{searchQuery}"
            </div>
            {onAddProduct && (
              <button
                onClick={onAddProduct}
                className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
              >
                Add new product
              </button>
            )}
          </div>
        )}
    </div>
  );
}
