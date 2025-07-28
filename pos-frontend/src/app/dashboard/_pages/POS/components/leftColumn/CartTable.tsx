import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import React from "react";
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
  disabled?: boolean;
}

export default function CartTable({
  cart,
  selectedRowId,
  selectRow,
  updateCartItemQuantity,
  disabled = false,
}: CartTableProps) {
  if (cart.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <span className="text-center text-gray-500">
          🛒 Scan items to add to cart
        </span>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-lg font-semibold">Barcode</TableHead>
          <TableHead className="text-lg font-semibold">Name</TableHead>
          <TableHead className="text-lg font-semibold">Price</TableHead>
          <TableHead className="text-lg font-semibold">Quantity</TableHead>
          <TableHead className="text-lg font-semibold">Discount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cart.map((item) => (
          <TableRow
            key={item.id}
            className={`hover:bg-gray-50 cursor-pointer ${selectedRowId === item.id ? "bg-gray-100" : ""
              }`}
            onClick={() => selectRow(item.id)}
          >
            <TableCell className="font-medium">
              {item.product.barcode || "N/A"}
            </TableCell>
            <TableCell>{item.product.name}</TableCell>
            <TableCell>₱ {item.product.price.toFixed(2)}</TableCell>
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
            <TableCell>₱ 0.00</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
