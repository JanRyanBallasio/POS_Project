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
  onOpenCamera?: () => void;
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
  onOpenCamera,
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

          // Close dropdown after selection
          clearSearch();
          // Keep UX snappy: refocus the input
          requestAnimationFrame(() => {
            inputEl.focus();
            inputEl.select?.();
          });
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
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 transition-colors ${
            isScannerInputRef?.current ? 'text-blue-500' : 'text-gray-400'
          }`}
          size={20}
        />
        <Input
          ref={inputRef}
          data-product-search="true"
          data-search-open={showSearchResults ? "true" : "false"}
          className={`pl-9 pr-10 w-full transition-all ${
            isScannerInputRef?.current
              ? 'ring-2 ring-blue-500 border-blue-500'
              : ''
          }`}
          placeholder="Search by product name or barcode..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        {onOpenCamera && !disabled && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCamera();
            }}
            aria-label="Open camera"
            title="Open camera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        )}
        {isAutoSelecting && !isScannerInputRef?.current && (
          <CheckCircle
            className="absolute right-9 top-1/2 transform -translate-y-1/2 text-green-500 animate-pulse"
            size={20}
          />
        )}
      </div>

      {isLoading && !showSearchResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-10 p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 text-sm">Searching...</span>
          </div>
        </div>
      )}

      {shouldShowDropdown && (
        <div
          ref={resultsContainerRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-10 max-h-[28rem] overflow-y-auto"
        >
          {searchResults.map((product, idx) => (
            <div
              key={product.id}
              data-highlighted={highlightedIndex === idx}
              className={`p-3 cursor-pointer border-b last:border-b-0 ${highlightedIndex === idx
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
                // Close dropdown after selection
                clearSearch();
                // Maintain flow: refocus input
                requestAnimationFrame(() => {
                  inputRef?.current?.focus();
                  inputRef?.current?.select?.();
                });
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
        searchQuery.length >= 1 &&
        !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-10 p-4 text-center">
            <div className="mb-3 text-gray-600">
              No product found matching "<span className="font-semibold">{searchQuery}</span>"
            </div>
            {onAddProduct && (
              <button
                onClick={onAddProduct}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add New Product
              </button>
            )}
          </div>
        )}
    </div>
  );
}
