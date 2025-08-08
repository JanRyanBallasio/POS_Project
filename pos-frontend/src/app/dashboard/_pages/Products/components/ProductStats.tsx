import { Card, CardContent } from "@/components/ui/card";

import useSWR from "swr";
import { productApi } from "@/hooks/products/useProductApi";

const fetcher = () => productApi.getAll();

export default function ProductsStats() {
  const { data: products = [], isLoading } = useSWR("/api/products", fetcher, { revalidateOnFocus: false });

  const validProducts = products.filter(p => p && typeof p.quantity === "number" && typeof p.price === "number");

  const totalProducts = validProducts.length;
  const lowStockItems = validProducts.filter(p => p.quantity < 5 && p.quantity > 0).length;
  const outOfStockItems = validProducts.filter(p => p.quantity === 0).length;
  const totalValue = validProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  const statsData = [
    {
      title: "Total Products",
      content: isLoading ? "..." : totalProducts,
    },
    {
      title: "Low Stock Items",
      content: isLoading ? "..." : lowStockItems,
    },
    {
      title: "Out of Stock",
      content: isLoading ? "..." : outOfStockItems,
    },
    {
      title: "Total Value",
      content: isLoading ? "..." : `₱ ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }
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