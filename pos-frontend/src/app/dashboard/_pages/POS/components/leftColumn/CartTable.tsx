// ...existing code...
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanLine, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Product } from "@/hooks/products/useProductApi";

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface CartTableProps {
  cart: CartItem[];
  selectedRowId: string | null;
  selectRow: (id: string) => void;
  updateCartItemQuantity: (id: string, qty: number) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  deleteCartItem: (id: string) => void;
  refocusScanner: () => void; // Add this line
  disabled?: boolean;
}

export default function CartTable({
  cart,
  selectedRowId,
  selectRow,
  updateCartItemQuantity,
  updateCartItemPrice,
  deleteCartItem,
  refocusScanner,
  disabled = false,
}: CartTableProps) {
  const [refocused, setRefocused] = useState<boolean>(false);

  const handleRefocus = () => {
    refocusScanner();
    setRefocused(true);
    setTimeout(() => setRefocused(false), 1000);
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <div className="text-center space-y-4">
          <span className="text-gray-500">
            🛒 Scan items to add to cart
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-lg font-semibold">Barcode</TableHead>
            <TableHead className="text-lg font-semibold">Name</TableHead>
            <TableHead className="text-lg font-semibold">Price</TableHead>
            <TableHead className="text-lg font-semibold">Quantity</TableHead>
            <TableHead className="text-lg font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cart.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-gray-50 cursor-pointer transition-all duration-200"
              onClick={() => selectRow(item.id)}
              data-cart-selected={selectedRowId === item.id}
            >
              <TableCell className="font-medium max-w-[140px] break-words whitespace-normal">
                {item.product.barcode || "N/A"}
              </TableCell>
              <TableCell className="min-w-0 max-w-[320px] break-words whitespace-normal">
                {item.product.name}
              </TableCell>

              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={String(item.product.price)}
                  className="w-28"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = Number(raw);
                    const price = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
                    updateCartItemPrice(item.id, price);
                  }}
                  disabled={disabled}
                />
              </TableCell>

              <TableCell>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  className="w-16"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const qty = Math.max(1, Number(e.target.value));
                    updateCartItemQuantity(item.id, qty);
                  }}
                  disabled={disabled}
                />
              </TableCell>

              <TableCell>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCartItem(item.id);
                  }}
                  disabled={disabled}
                >
                  Delete
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}