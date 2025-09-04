import { useState, useEffect } from "react";
import axios from "@/lib/axios";

export interface Sale {
  id: number;
  customer_id: number | null;
  total_purchase: number;
  created_at: string;
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(process.env.NEXT_PUBLIC_backend_api_url + "/sales");
    setSales(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return { sales, loading, error, refetch: fetchSales };
};