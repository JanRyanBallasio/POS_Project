import Head from './components/head';
import ProductsStats from './components/ProductStats';
import Index from './components/productCatalog/index';
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useState, useEffect } from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";

export default function ProductsScreen() {
  // Get initial products from your hook
  const { products: initialProducts, refetch } = useProducts();
  // Local state for products, so we can update instantly
  const [products, setProducts] = useState(initialProducts);

  // Keep local products in sync with backend
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  const handleProductDeleted = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Callback for when a product is added
  const handleProductAdded = (product: Product) => {
    if (product && typeof product.quantity === "number" && typeof product.price === "number") {
      setProducts(prev => [product, ...prev]);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full p-8">
      <div className="flex-[7%]">
        <Head />
      </div>
      {/* Pass products as props to children */}
      <div className="flex-[18%]"><ProductsStats products={products} /></div>
      <div className="flex-[75%]"><Index
        products={products}
        onProductDeleted={handleProductDeleted}
      /></div>
    </div>
  );
}