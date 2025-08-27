'use client'

import Head from './components/head';
import ProductsStats from './components/ProductStats';
import Index from './components/productCatalog/index';
import AddCategoryModal from './components/addCategoryModal';

export default function ProductsScreen() {
  return (
    <div className="flex flex-col gap-4 h-full p-8">
      <div className="flex-[7%]">
        <Head />
      </div>

      <div className="flex-[18%]">
        <ProductsStats />
      </div>

      <div className="flex-[75%]">
        <Index />
      </div>

      <AddCategoryModal />
    </div>
  );
}