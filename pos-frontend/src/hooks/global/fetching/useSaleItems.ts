import { useState, useEffect } from "react";
import axios from "axios";

export interface SaleItem {
  id: number;
  created_at: string;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export const useSaleItems = () => {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaleItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://13.211.162.106:5000/api/sales-items");
      setSaleItems(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleItems();
  }, []);

  return { saleItems, loading, error, refetch: fetchSaleItems };
};