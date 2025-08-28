import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductCatalogToolbar from "./ProductCatalogToolbar";
import ProductTable from "./ProductTable";
import { useState } from "react";

interface IndexProps {
  onProductDeleted?: (id: number) => void;
}

export default function Index({ onProductDeleted }: IndexProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState("all");
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
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          search={search}
          setSearch={setSearch}
        />
        <ProductTable
          selectedCategory={selectedCategory}
          selectedStatus={selectedProducts}
          onProductDeleted={onProductDeleted}
          search={search}
        />
      </CardContent>
    </Card>
  );
}