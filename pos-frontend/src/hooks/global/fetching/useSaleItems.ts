import { useState, useEffect } from "react";
import axios from "@/lib/axios";

export interface AggregatedSaleItem {
  category: string;
  quantity: number;
}

/**
 * Hook for fetching aggregated sale items by category.
 * Accepts optional { from, to } ISO date strings.
 */
export const useSaleItems = (opts?: { from?: string; to?: string }) => {
  const [saleItems, setSaleItems] = useState<AggregatedSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaleItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "all");
      if (opts?.from) params.set("from", opts.from);
      if (opts?.to) params.set("to", opts.to);

      const url = `/sales-items?${params.toString()}`;
      const res = await axios.get(url);

      const payload = res.data;
      setSaleItems(Array.isArray(payload) ? payload : payload?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSaleItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleItems();
  }, [opts?.from, opts?.to]);

  return { saleItems, loading, error, refetch: fetchSaleItems };
};
