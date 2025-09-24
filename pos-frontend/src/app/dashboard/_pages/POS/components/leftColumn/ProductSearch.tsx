import { Input } from "@/components/ui/input";
import { Search, CheckCircle } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  onAddProduct?: () => void; // Add this prop
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
  onAddProduct, // Add this parameter
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
          handleSearchSelect(searchResults[highlightedIndex]);
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
  }, [searchResults, highlightedIndex, handleSearchSelect, clearSearch, inputRef]);

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

  // DEBUG TOOL: Add 100 items to cart
  const addDebugItems = useCallback(() => {
    // Only work in development or when explicitly enabled
    if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
      return;
    }

    // Generate 100 random products
    const debugProducts = Array.from({ length: 100 }, (_, index) => ({
      id: `debug-${index + 1}`,
      name: `Debug Product ${index + 1}`,
      barcode: `DEBUG${String(index + 1).padStart(3, '0')}`,
      price: Math.floor(Math.random() * 100) + 10, // Random price between 10-110
      quantity: Math.floor(Math.random() * 50) + 1, // Random quantity between 1-50
      category_id: Math.floor(Math.random() * 5) + 1, // Random category 1-5
    }));

    // Add each product to cart
    debugProducts.forEach((product, index) => {
      setTimeout(() => {
        handleSearchSelect(product);
      }, index * 10); // Small delay between additions to avoid overwhelming the UI
    });

    // Clear the search after adding
    setTimeout(() => {
      clearSearch();
    }, 1000);

    console.log('🔧 DEBUG: Added 100 items to cart');
  }, [handleSearchSelect, clearSearch]);

  // Listen for debug code
  useEffect(() => {
    const handleSearchChangeWithDebug = (value: string) => {
      // Check for debug code
      if (value.toLowerCase() === 'debug100') {
        addDebugItems();
        return;
      }
      
      // Normal search handling
      handleSearchChange(value);
    };

    // Override the search change handler
    if (inputRef?.current) {
      const input = inputRef.current;
      const originalHandler = input.oninput;
      
      input.oninput = (e) => {
        const target = e.target as HTMLInputElement;
        handleSearchChangeWithDebug(target.value);
      };
    }
  }, [addDebugItems, handleSearchChange, inputRef]);

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
              onClick={() => handleSearchSelect(product)}
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-medium break-words whitespace-normal flex items-center gap-2">
                    {product.name}
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
