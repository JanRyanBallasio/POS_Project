import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductCatalogToolbar from "./ProductCatalogToolbar";
import ProductTable from "./ProductTable";
import { useState } from "react";
import type { Product } from "@/hooks/products/useProductApi"; // adjust import if needed

interface IndexProps {
  products: Product[];
  onProductDeleted?: (id: number) => void;
}

export default function Index({ products, onProductDeleted }: IndexProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <h2 className="text-2xl font-semibold">Product Catalog</h2>
      </CardHeader>
      <CardContent>
        <ProductCatalogToolbar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedProducts={selectedStatus}
          setSelectedProducts={setSelectedStatus}
          search={search}
          setSearch={setSearch}
        />
        {/* Pass products to ProductTable */}
        <ProductTable
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          onProductDeleted={onProductDeleted}
          search={search}
        />
      </CardContent>
    </Card>
  );
}