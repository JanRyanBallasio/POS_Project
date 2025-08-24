import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProductModal } from "@/contexts/productRegister-context";

export default function Head() {
  const { openModal } = useProductModal();

  return (
    <div className="flex justify-between items-center h-full">
      <div className="text-4xl font-bold">
        <h1>Products</h1>
      </div>
      <div className="flex gap-3">
        <Button
          className="flex items-center justify-center gap-2 p-6"
          onClick={() => openModal("addCategory")}
        >
          <Plus className="text-white w-5 h-5 !w-5 !h-5" />
          Add Category
        </Button>
        <Button
          className="flex items-center justify-center gap-2 p-6"
          onClick={() => openModal("addProduct")}
        >
          <Plus className="text-white w-5 h-5 !w-5 !h-5" />
          Add Product
        </Button>
      </div>
    </div>
  );
}