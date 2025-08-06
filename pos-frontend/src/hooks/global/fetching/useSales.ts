import { useState, useEffect } from "react";
import axios from "axios";

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
      const res = await axios.get("http://13.211.162.106:5000/api/sales");
      // const res = await axios.get("http://localhost:5000/api/sales");
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