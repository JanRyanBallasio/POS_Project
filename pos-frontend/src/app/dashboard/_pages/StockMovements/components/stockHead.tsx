import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddStockModal from "./addStockModal";

export default function StockMovementHead() {
    return (
        <div className="flex justify-between items-center h-full">
            <h1 className="text-3xl font-bold">Stock Movements</h1>
            <div className="flex gap-3">
                <AddStockModal />
            </div>
        </div>
    );
}
