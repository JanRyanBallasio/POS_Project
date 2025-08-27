import React, { useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProductModal } from "@/contexts/productRegister-context";

function HeadComponent() {
  const { openModal } = useProductModal();

  const openAddCategory = useCallback(() => openModal("addCategory"), [openModal]);
  const openAddProduct = useCallback(() => openModal("addProduct"), [openModal]);

  const btnClass = "flex items-center justify-center gap-2 p-3";

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-4xl font-bold">Products</h1>

      <div className="flex gap-3">
        <Button className={btnClass} onClick={openAddCategory} aria-label="Add category">
          <Plus size={16} />
          Add Category
        </Button>

        <Button className={btnClass} onClick={openAddProduct} aria-label="Add product">
          <Plus size={16} />
          Add Product
        </Button>
      </div>
    </div>
  );
}

export default memo(HeadComponent);
