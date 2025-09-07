import { Card, CardContent } from "@/components/ui/card";
import useSWR from "swr";
import { productApi } from "@/hooks/products/useProductApi";
import type { Product } from "@/hooks/products/useProductApi";
import { useMemo } from "react";

// Use consistent key
const PRODUCTS_KEY = "products:list";
const fetcher = () => productApi.getAll();

export default function ProductStats() {
  const { data: products = [], isLoading } = useSWR(PRODUCTS_KEY, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const stats = useMemo(() => {
    let totalProducts = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalValue = 0;

    for (const p of products as Product[]) {
      if (!p || typeof p.quantity !== "number" || typeof p.price !== "number") continue;
      totalProducts++;
      if (p.quantity === 0) outOfStockItems++;
      else if (p.quantity < 5) lowStockItems++;
      totalValue += p.price * p.quantity;
    }

    return {
      totalProducts,
      lowStockItems,
      outOfStockItems,
      totalValueFormatted: `₱ ${totalValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    };
  }, [products]);

  const statsData = [
    { title: "Total Products", content: isLoading ? "..." : stats.totalProducts },
    { title: "Low Stock Items", content: isLoading ? "..." : stats.lowStockItems },
    { title: "Out of Stock", content: isLoading ? "..." : stats.outOfStockItems },
    { title: "Total Value", content: isLoading ? "..." : stats.totalValueFormatted },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 w-full h-full">
      {statsData.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="flex flex-col justify-center items-start h-full">
            <h1 className="text-xl font-semibold pb-4">{stat.title}</h1>
            <p className="text-2xl font-bold">{stat.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}