import React, { useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, PackagePlus } from "lucide-react";
import { useProductModal } from "@/contexts/productRegister-context";

function ProductsHead() {
  const { openModal } = useProductModal();

  // Handlers
  const openAddCategory = useCallback(() => openModal("addCategory"), [openModal]);
  const openAddProduct = useCallback(() => openModal("addProduct"), [openModal]);

  return (
    <header className="w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        
        {/* Action Buttons - Responsive */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Add Category Button */}
          <Button
            onClick={openAddCategory}
            variant="outline"
            className="flex-1 sm:flex-none justify-center gap-2 h-11"
            aria-label="Add category"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="font-medium">Add Category</span>
          </Button>

          {/* Add Product Button - Primary */}
          <Button
            onClick={openAddProduct}
            className="flex-1 sm:flex-none justify-center gap-2 h-11"
            aria-label="Add product"
          >
            <PackagePlus className="h-4 w-4" />
            <span className="font-medium">Add Product</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default memo(ProductsHead);