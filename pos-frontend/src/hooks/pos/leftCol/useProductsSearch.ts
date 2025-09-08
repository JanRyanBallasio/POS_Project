import { useState, useMemo, useEffect } from "react";
import { Product } from "@/hooks/products/useProductApi";

export const useProductSearch = (products: Product[], onAutoSelect?: (product: Product) => void) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery)
    );
  }, [products, searchQuery]); 

  // Auto-select when only one result is found
  useEffect(() => {
    if (searchResults.length === 1 && searchQuery.trim().length >= 2 && onAutoSelect) {
      const autoSelectTimer = setTimeout(() => {
        onAutoSelect(searchResults[0]);
        clearSearch();
      }, 500); // 500ms delay to prevent immediate selection while typing

      return () => clearTimeout(autoSelectTimer);
    }
  }, [searchResults, searchQuery, onAutoSelect]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.trim().length >= 2);
  }; 

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  }; 
  
  return {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearchChange,
    clearSearch,
  };
};