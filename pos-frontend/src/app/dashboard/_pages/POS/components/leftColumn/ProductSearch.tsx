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
  refocusScanner: () => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export default function ProductSearch({
  searchQuery,
  searchResults,
  showSearchResults,
  handleSearchChange,
  handleSearchSelect,
  refocusScanner,
  disabled = false,
  inputRef,
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
      if (!showSearchResults || searchResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
        scrollToHighlighted();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        scrollToHighlighted();
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleSearchSelect(searchResults[highlightedIndex]);
        setHighlightedIndex(-1);
      }
    };

    inputEl.addEventListener("keydown", handleKeyDown);
    return () => inputEl.removeEventListener("keydown", handleKeyDown);
  }, [searchResults, showSearchResults, highlightedIndex, handleSearchSelect, inputRef]);

  // Scroll highlighted item into view
  const scrollToHighlighted = () => {
    setTimeout(() => {
      if (resultsContainerRef.current) {
        const item = resultsContainerRef.current.querySelector(`[data-highlighted="true"]`);
        if (item) {
          (item as HTMLElement).scrollIntoView({ block: "nearest" });
        }
      }
    }, 0);
  };

  return (
    <div className="relative mb-6">
      <div className="relative flex items-center">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          ref={inputRef}
          className="pl-9 w-full"
          placeholder="Search by product name or barcode..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={refocusScanner}
          disabled={disabled}
        />
        {isAutoSelecting && (
          <CheckCircle
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 animate-pulse"
            size={20}
          />
        )}
      </div>
      {showSearchResults && searchResults.length > 0 && (
        <div
          ref={resultsContainerRef}
          className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-[32rem] overflow-y-auto"
        >
          {searchResults.map((product, idx) => (
            <div
              key={product.id}
              data-highlighted={highlightedIndex === idx}
              className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                isAutoSelecting ? "bg-green-50 border-green-200" : ""
              } ${highlightedIndex === idx ? "bg-blue-100" : ""}`}
              onClick={() => handleSearchSelect(product)}
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-medium break-words whitespace-normal flex items-center gap-2">
                    {product.name}
                    {isAutoSelecting && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Auto-selecting...
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Barcode: {product.barcode}</div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="font-medium">₱ {product.price.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 p-3 text-center text-gray-500">
          No products found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
