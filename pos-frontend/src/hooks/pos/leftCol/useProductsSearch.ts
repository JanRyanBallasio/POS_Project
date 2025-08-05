import { useState, useMemo } from "react";
import { Product } from "@/hooks/products/useProductApi";

export const useProductSearch = (products: Product[]) => {
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