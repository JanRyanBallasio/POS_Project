import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductCatalogToolbar from "./ProductCatalogToolbar";
import ProductTable from "./ProductTable";
import { useState } from "react";

interface IndexProps {
  products: any[];
  onProductDeleted?: (id: number) => void; // <-- Add this line
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
        />
        {/* Pass products to ProductTable */}
        <ProductTable
          products={products}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          onProductDeleted={onProductDeleted}
        />
      </CardContent>
    </Card>
  );
}