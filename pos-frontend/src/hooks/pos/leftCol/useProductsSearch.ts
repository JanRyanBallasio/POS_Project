import { useState, useEffect, useRef } from "react";
import type { Product } from "@/hooks/products/useProductApi";

export function useProductSearch(products: Product[], onSelect: (p: Product) => void) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const autoSelectTimer = useRef<number | null>(null);

  useEffect(() => {
    const q = String(searchQuery || "").trim().toLowerCase();

    // helper to compare result arrays (by id or barcode fallback)
    const sameResults = (a: Product[], b: Product[]) => {
      if (a === b) return true;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const aKey = String(a[i]?.id ?? a[i]?.barcode ?? "");
        const bKey = String(b[i]?.id ?? b[i]?.barcode ?? "");
        if (aKey !== bKey) return false;
      }
      return true;
    };

    // clear any pending auto-select timer whenever query/results change
    if (autoSelectTimer.current) {
      clearTimeout(autoSelectTimer.current);
      autoSelectTimer.current = null;
    }

    // If query empty -> only update state when it's actually different
    if (!q) {
      setSearchResults((prev) => (prev.length === 0 ? prev : []));
      setShowSearchResults((prev) => (prev === false ? prev : false));
      return;
    }

    // build results (case-insensitive partial match on name or barcode)
    const results = products.filter((p) => {
      const name = String(p?.name || "").toLowerCase();
      const barcode = String(p?.barcode || "").toLowerCase();
      return name.includes(q) || barcode.includes(q);
    });

    // update searchResults only when changed
    setSearchResults((prev) => (sameResults(prev, results) ? prev : results));
    setShowSearchResults((prev) => (prev === (results.length > 0) ? prev : results.length > 0));

    // Immediate auto-select if query exactly matches a product barcode (fast path)
    const exactBarcodeMatch = results.find((p) => String(p.barcode || "").toLowerCase() === q);
    if (exactBarcodeMatch) {
      // call onSelect synchronously for exact barcode
      onSelect(exactBarcodeMatch);
      return;
    }

    // If only one partial result, schedule a very short auto-select
    if (results.length === 1 && q.length >= 2) {
      autoSelectTimer.current = window.setTimeout(() => {
        // Defensive: ensure the same single result still applies
        const latestQ = String(searchQuery || "").trim().toLowerCase();
        const latestResults = products.filter((p) => {
          const name = String(p?.name || "").toLowerCase();
          const barcode = String(p?.barcode || "").toLowerCase();
          return name.includes(latestQ) || barcode.includes(latestQ);
        });
        if (latestResults.length === 1) {
          onSelect(latestResults[0]);
        }
      }, 100);
    }

    return () => {
      if (autoSelectTimer.current) {
        clearTimeout(autoSelectTimer.current);
        autoSelectTimer.current = null;
      }
    };
  }, [searchQuery, products, onSelect]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    if (autoSelectTimer.current) {
      clearTimeout(autoSelectTimer.current);
      autoSelectTimer.current = null;
    }
  };

  return {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearchChange,
    clearSearch,
  };
}