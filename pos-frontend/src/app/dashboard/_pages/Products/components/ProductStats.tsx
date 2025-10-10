import { Card, CardContent } from "@/components/ui/card";
import useSWR from "swr";
import { productApi } from "@/hooks/products/useProductApi";
import type { Product } from "@/hooks/products/useProductApi";
import { useMemo } from "react";
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";

// Use consistent key
const PRODUCTS_KEY = "products:list";
const fetcher = () => productApi.getAll();

export default function ProductStats() {
  const { data: products = [], isLoading } = useSWR(PRODUCTS_KEY, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const stats = useMemo(() => {
    const list = products as Product[];

    // Count all non-deleted products returned by API
    const totalProducts = Array.isArray(list) ? list.length : 0;

    let lowStockItems = 0;
    let outOfStockItems = 0;
    let totalValue = 0;

    for (const p of list) {
      if (!p) continue;

      // Stock status only when quantity is numeric
      if (typeof p.quantity === "number") {
        if (p.quantity === 0) outOfStockItems++;
        else if (p.quantity < 5) lowStockItems++;
      }

      // Inventory value only when both price and quantity are numeric
      if (typeof p.quantity === "number" && typeof p.price === "number") {
        totalValue += p.price * p.quantity;
      }
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
    { 
      title: "Total Products", 
      content: isLoading ? "..." : stats.totalProducts,
      icon: Package,
      color: "text-blue-600"
    },
    { 
      title: "Low Stock Items", 
      content: isLoading ? "..." : stats.lowStockItems,
      icon: AlertTriangle,
      color: "text-yellow-600"
    },
    { 
      title: "Out of Stock", 
      content: isLoading ? "..." : stats.outOfStockItems,
      icon: XCircle,
      color: "text-red-600"
    },
    { 
      title: "Total Value", 
      content: isLoading ? "..." : stats.totalValueFormatted,
      icon: DollarSign,
      color: "text-green-600"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {statsData.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.content}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}