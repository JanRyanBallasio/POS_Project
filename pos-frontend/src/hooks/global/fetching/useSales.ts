import { useState, useEffect } from "react";
import axios from "@/lib/axios";

export interface Sale {
  id: number;
  customer_id: number | null;
  total_purchase: number;
  created_at: string;
}

interface UseSalesParams {
  from?: string;
  to?: string;
}

export const useSales = (params?: UseSalesParams) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get("/sales", {
        params: {
          from: params?.from,
          to: params?.to,
        },
      });

      setSales(res.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [params?.from, params?.to]);

  return { sales, loading, error, refetch: fetchSales };
};
