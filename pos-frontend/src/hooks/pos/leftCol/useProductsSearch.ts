import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Product } from "@/hooks/products/useProductApi";
import Fuse from 'fuse.js';
import debounce from "lodash.debounce";
import axios from "@/lib/axios";

export function useProductSearch(
  onSelect: (p: Product) => void, 
  allProducts: Product[] = [],
  onUnregisteredBarcode?: (barcode: string) => void
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create Fuse instance for client-side search - only recreate when products change
  const fuse = useMemo(() => {
    if (!allProducts.length) return null;
    
    return new Fuse(allProducts, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'barcode', weight: 0.3 }
      ],
      threshold: 0.1,
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
      findAllMatches: false,
      // Add these for better performance
      shouldSort: true,
      includeMatches: false, // Don't include match details for better performance
    });
  }, [allProducts]);

  // Track typing speed to detect barcode scanner
  const lastKeyTimeRef = useRef<number | null>(null);
  const isScannerInputRef = useRef(false);
  const lastProcessedBarcodeRef = useRef<string>("");
  
  // Store the onSelect callback in a ref to prevent debounce recreation
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Function to detect and clean up repeated barcode input
  const cleanBarcodeInput = (input: string): string => {
    // If input is all numbers and very long, it might be repeated barcode
    if (/^\d+$/.test(input) && input.length > 10) {
      // Try to find the original barcode by looking for repeated patterns
      const possibleLengths = [8, 10, 12, 13, 14, 15]; // Common barcode lengths
      
      for (const length of possibleLengths) {
        if (input.length % length === 0) {
          const possibleBarcode = input.substring(0, length);
          const repeated = possibleBarcode.repeat(input.length / length);
          if (repeated === input) {
            return possibleBarcode;
          }
        }
      }
      
      // If no pattern found, try to extract the most likely barcode
      // Look for the longest unique sequence
      for (let i = 1; i <= input.length / 2; i++) {
        const candidate = input.substring(0, i);
        if (input === candidate.repeat(Math.floor(input.length / i))) {
          return candidate;
        }
      }
    }
    
    return input;
  };

  const detectScannerInput = (val: string) => {
    const now = Date.now();
    if (lastKeyTimeRef.current) {
      const diff = now - lastKeyTimeRef.current;
      if (diff < 50 && val.length > 3) {
        isScannerInputRef.current = true;
      } else if (diff > 150) {
        isScannerInputRef.current = false;
      }
    }
    lastKeyTimeRef.current = now;
  };

  // Add search result caching
  const searchCache = useRef<Map<string, Product[]>>(new Map());

  const searchProducts = useCallback(
    debounce(async (q: string) => {
      if (!q || q.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = q.toLowerCase().trim();
      if (searchCache.current.has(cacheKey)) {
        setSearchResults(searchCache.current.get(cacheKey)!);
        setShowSearchResults(true);
        setIsLoading(false);
        return;
      }

      if (q.trim().length === 1) {
        const quickResults = allProducts
          .filter(product => 
            product.name.toLowerCase().startsWith(q.toLowerCase())
          )
          .slice(0, 5);
        
        setSearchResults(quickResults);
        setShowSearchResults(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        let results: Product[] = [];
        let cleanedQuery = q;

        // Clean up barcode input if it looks like repeated input
        if (isScannerInputRef.current || /^\d+$/.test(q)) {
          cleanedQuery = cleanBarcodeInput(q);
          
          // Prevent processing the same barcode multiple times
          if (cleanedQuery === lastProcessedBarcodeRef.current && isScannerInputRef.current) {
            setIsLoading(false);
            return;
          }
          lastProcessedBarcodeRef.current = cleanedQuery;
        }

        // Use client-side search if we have products loaded
        if (fuse && allProducts.length > 0) {
          // First, try exact barcode match
          const exactBarcodeMatch = allProducts.find(product => 
            product.barcode && product.barcode.trim() === cleanedQuery.trim()
          );
          
          if (exactBarcodeMatch) {
            results = [exactBarcodeMatch];
          } else {
            // Try exact name match (case insensitive)
            const exactNameMatch = allProducts.find(product => 
              product.name.toLowerCase().trim() === cleanedQuery.toLowerCase().trim()
            );
            
            if (exactNameMatch) {
              results = [exactNameMatch];
            } else {
              // Try partial name match (contains the search term)
              const partialMatches = allProducts.filter(product => 
                product.name.toLowerCase().includes(cleanedQuery.toLowerCase())
              );
              
              if (partialMatches.length > 0) {
                results = partialMatches.slice(0, 50);
              } else {
                // Use Fuse.js for fuzzy search as last resort
                const fuseResults = fuse.search(cleanedQuery);
                results = fuseResults.slice(0, 50).map(result => result.item);
              }
            }
          }
        } else {
          // Fallback to server search if no products loaded
          const { data } = await axios.get(`/products/search?q=${encodeURIComponent(cleanedQuery)}`);
          results = data?.data ?? [];
        }

        // Limit results to 50 for performance
        results = results.slice(0, 50);
        
        // Cache results
        searchCache.current.set(cacheKey, results);
        
        setSearchResults(results);
        setShowSearchResults(true);
        setIsLoading(false);

        // Auto-add logic when there's only one result
        if (results.length === 1) {
          const result = results[0];
          const isExactBarcodeMatch = result.barcode && cleanedQuery.trim() === result.barcode.trim();
          const isExactNameMatch = result.name.toLowerCase().trim() === cleanedQuery.toLowerCase().trim();
          
          // Auto-select for exact matches or scanner input
          if (isScannerInputRef.current || isExactBarcodeMatch || isExactNameMatch) {
            setTimeout(() => {
              onSelectRef.current(result);

              if (isScannerInputRef.current) {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchResults(false);
                lastProcessedBarcodeRef.current = ""; // Reset processed barcode
              }
            }, 100);
          }
        } else if (results.length === 0 && isScannerInputRef.current && /^\d+$/.test(cleanedQuery)) {
          setTimeout(() => {
            if (onUnregisteredBarcode) {
              onUnregisteredBarcode(cleanedQuery);
            }
            setSearchQuery("");
            setSearchResults([]);
            setShowSearchResults(false);
            lastProcessedBarcodeRef.current = ""; // Reset processed barcode
          }, 100);
        }
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: unknown }).name !== "AbortError" &&
          (error as { name?: unknown }).name !== "CanceledError"
        ) {
          console.error("Search error:", error);
        }
        setIsLoading(false);
      }
    }, 100),
    [fuse, allProducts]
  );

  useEffect(() => {
    searchProducts(searchQuery);
  }, [searchQuery, searchProducts]);

  const handleSearchChange = (val: string) => {
    detectScannerInput(val);
    setSearchQuery(val);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setIsLoading(false);
    lastProcessedBarcodeRef.current = ""; // Reset processed barcode
  };

  return {
    searchQuery,
    searchResults,
    showSearchResults,
    setShowSearchResults,
    handleSearchChange,
    clearSearch,
    isScannerInputRef,
    isLoading,
  };
}