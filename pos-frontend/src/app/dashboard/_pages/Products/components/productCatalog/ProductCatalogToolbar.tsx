import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function ProductCatalogToolbar() {
    return (
        <div className="flex justify-between items-center">
            <div className="relative flex items-center w-[500px]">
                <Search
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                />
                <Input
                    className="pl-9 w-full"
                    placeholder="Search by product name or barcode..."
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="class"></div>
            <Select>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}