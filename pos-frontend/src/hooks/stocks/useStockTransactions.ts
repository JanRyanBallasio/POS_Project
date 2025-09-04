import useSWR from "swr";
import axios from "@/lib/axios";

export type StockTransaction = { id: number | string; company_name: string; date: string; total?: number };

const fetcher = async (url: string) => {
  const res = await axios.get(url);
  return (res.data?.data ?? []) as StockTransaction[];
};

export default function useStockTransactions() {
  const { data, error, isValidating } = useSWR<StockTransaction[], Error>("/stock-transactions", fetcher, {
    revalidateOnFocus: false,
  });
  return { data, loading: !error && !data && isValidating, error: error ? error.message : null };
}