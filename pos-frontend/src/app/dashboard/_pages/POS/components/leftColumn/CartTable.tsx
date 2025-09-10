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
import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/hooks/products/useProductApi";
import { useCart } from "@/contexts/cart-context";

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
  refocusScanner: () => void;
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
  const { lastAddedItemId } = useCart();
  const lastAutoSelectedId = useRef<string | null>(null);

  // Auto-select the last added item - but only once per item
  useEffect(() => {
    if (lastAddedItemId &&
      cart.find(item => item.id === lastAddedItemId) &&
      lastAutoSelectedId.current !== lastAddedItemId) {

      lastAutoSelectedId.current = lastAddedItemId;
      selectRow(lastAddedItemId);
    }
  }, [lastAddedItemId, selectRow, cart]);

  // Reset the auto-selection tracking when cart changes significantly
  useEffect(() => {
    // If the lastAddedItemId is no longer in the cart, reset tracking
    if (lastAddedItemId && !cart.find(item => item.id === lastAddedItemId)) {
      lastAutoSelectedId.current = null;
    }
  }, [cart, lastAddedItemId]);

  const handleRowClick = (itemId: string, e: React.MouseEvent) => {
    // Prevent the click from bubbling up to parent elements
    e.stopPropagation();

    // Blur the scanner input to remove the red border
    const scannerInput = document.getElementById('barcode-scanner') as HTMLInputElement;
    if (scannerInput) {
      scannerInput.blur();
    }

    // Select the row
    selectRow(itemId);
  };

  // Add click handler for table cells that should select the row
  const handleCellClick = (itemId: string, e: React.MouseEvent) => {
    // Only handle clicks on non-interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON' && !target.closest('button')) {
      handleRowClick(itemId, e);
    }
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-lg font-semibold py-3">Barcode</TableHead>
          <TableHead className="text-lg font-semibold py-3">Name</TableHead>
          <TableHead className="text-lg font-semibold py-3">Price</TableHead>
          <TableHead className="text-lg font-semibold py-3">Quantity</TableHead>
          <TableHead className="text-lg font-semibold py-3">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cart.map((item) => {
          const isSelected = selectedRowId === item.id;

          return (
            <TableRow
              key={item.id}
              className={cn(
                "hover:bg-gray-50 cursor-pointer transition-all duration-200",
                isSelected
                  ? "bg-gray-100 dark:bg-gray-800"
                  : ""
              )}
              onClick={(e) => handleRowClick(item.id, e)}
              data-cart-selected={isSelected}
            >
              <TableCell
                className="font-medium max-w-[140px] break-words whitespace-normal py-3 px-4"
                onClick={(e) => handleCellClick(item.id, e)}
              >
                {item.product.barcode || "N/A"}
              </TableCell>

              <TableCell
                className="min-w-0 max-w-[320px] break-words whitespace-normal py-3 px-4"
                onClick={(e) => handleCellClick(item.id, e)}
              >
                {item.product.name}
              </TableCell>

              <TableCell className="py-3 px-4">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  // allow keyboard shortcuts to target this input
                  data-cart-price-input={item.id}
                  value={String(item.product.price)}
                  className="w-20 h-8 text-sm"
                  onFocus={() => selectRow(item.id)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = Number(raw);
                    const price = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
                    updateCartItemPrice(item.id, price);
                  }}
                  onBlur={() => {
                    // finished price edit -> refocus scanner
                    refocusScanner();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                      refocusScanner();
                    }
                  }}
                  disabled={disabled}
                />
              </TableCell>

              <TableCell className="py-3 px-4">
                <Input
                  type="number"
                  min={1}
                  // allow keyboard shortcuts to target this input
                  data-cart-qty-input={item.id}
                  value={item.quantity}
                  className="w-16 h-8 text-sm"
                  onFocus={() => selectRow(item.id)}
                  onChange={(e) => {
                    const qty = Math.max(1, Number(e.target.value));
                    updateCartItemQuantity(item.id, qty);
                  }}
                  onBlur={() => {
                    // finished quantity edit -> refocus scanner
                    refocusScanner();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                      refocusScanner();
                    }
                  }}
                  disabled={disabled}
                />
              </TableCell>

              <TableCell className="py-3 px-4">
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCartItem(item.id);
                    // ensure scanner regains focus after a delete (keyboard flow)
                    refocusScanner();
                  }}
                  disabled={disabled}
                >
                  Delete
                </button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}