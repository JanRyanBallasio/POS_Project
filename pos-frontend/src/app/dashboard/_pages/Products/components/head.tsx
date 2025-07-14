import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react';

export default function Head() {
    return (
        <div className="flex justify-between items-center h-full  ">
            <div className="text-4xl font-bold">
                <h1>Products</h1>
            </div>
            <div className="relative flex flex-row items-center mr-5 ">
                <Button className="flex items-center justify-center gap-2 p-6 w-full">
                    <Plus className="text-white w-5 h-5 !w-5 !h-5" />
                    Add Product
                </Button>
            </div>
        </div>
    );
}