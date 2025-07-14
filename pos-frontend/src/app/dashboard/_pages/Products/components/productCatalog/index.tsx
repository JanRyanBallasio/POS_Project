import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductCatalogToolbar from "./ProductCatalogToolbar";
import ProductTable from "./ProductTable";
import { useState } from "react";

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
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
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          search={search}
          setSearch={setSearch}
        />
        <ProductTable
          selectedCategory={selectedCategory}
          selectedStatuses={selectedStatuses}
          search={search}
        />
      </CardContent>
    </Card>
  );
}