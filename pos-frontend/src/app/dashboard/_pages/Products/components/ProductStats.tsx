import { Card, CardContent } from "@/components/ui/card";
import useSWR from "swr";
import { productApi } from "@/hooks/products/useProductApi";
import type { Product } from "@/hooks/products/useProductApi";
import { useMemo } from "react";

const fetcher = () => productApi.getAll();

export default function ProductStats() {
  const { data: products = [], isLoading } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const { totalProducts, lowStockItems, outOfStockItems, totalValueFormatted } = useMemo(() => {
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

    const totalValueFormatted = `₱ ${totalValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return { totalProducts, lowStockItems, outOfStockItems, totalValueFormatted };
  }, [products]);

  const statsData = [
    { title: "Total Products", content: isLoading ? "..." : totalProducts },
    { title: "Low Stock Items", content: isLoading ? "..." : lowStockItems },
    { title: "Out of Stock", content: isLoading ? "..." : outOfStockItems },
    { title: "Total Value", content: isLoading ? "..." : totalValueFormatted },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 w-full h-full">
      {statsData.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="flex flex-col justify-center items-start h-full">
            <h1 className="text-xl font-semibold pb-4">{stat.title}</h1>
            <p className="text-2xl font-bold ">{stat.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
