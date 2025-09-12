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
import { ScanLine, CheckIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  refocusScanner: (force?: boolean) => void;
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

  // Robustly auto-select the last added cart row.
  // Some add flows (search -> add) may set lastAddedItemId before the cart
  // update has propagated here, so retry for a few frames until the row exists.
  useEffect(() => {
    if (!lastAddedItemId) return;
    if (lastAutoSelectedId.current === lastAddedItemId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const trySelect = () => {
      if (cancelled) return;
      const exists = cart.some((it) => it.id === lastAddedItemId);
      if (exists) {
        lastAutoSelectedId.current = lastAddedItemId;
        try { selectRow(lastAddedItemId); } catch { /* ignore */ }

        // Ensure scanner refocus after selection (defer so the row actually exists in the DOM)
        requestAnimationFrame(() => {
          try { refocusScanner(true); } catch { /* ignore */ }
        });
        return;
      }
      attempts++;
      if (attempts < maxAttempts) {
        requestAnimationFrame(trySelect);
      }
    };

    requestAnimationFrame(trySelect);
    return () => { cancelled = true; };
  }, [lastAddedItemId, cart, selectRow, refocusScanner]);

  // If the tracked lastAutoSelectedId is removed from the cart, reset tracking
  useEffect(() => {
    if (lastAutoSelectedId.current && !cart.find((it) => it.id === lastAutoSelectedId.current)) {
      lastAutoSelectedId.current = null;
    }
  }, [cart]);

  const handleRowClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectRow(itemId);

    // Always force scanner focus after selecting a row; defer to next frame
    requestAnimationFrame(() => {
      try { refocusScanner(true); } catch { /* ignore */ }
    });
  };

  // Add click handler for table cells that should select the row
  const handleCellClick = (itemId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "INPUT" && target.tagName !== "BUTTON" && !target.closest("button")) {
      handleRowClick(itemId, e);
    }
  };

  // Local Price editor component: keeps editing text (allows "1." and partial decimals)
  const PriceCell: React.FC<{ item: CartItem }> = ({ item }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>(String(item.product.price ?? 0));
    const ref = useRef<HTMLInputElement | null>(null);

    // keep value in sync when external product price changes (but not while editing)
    useEffect(() => {
      if (!editing) setValue(String(item.product.price ?? 0));
    }, [item.product.price, editing]);

    const commit = useCallback(() => {
      setEditing(false);
      const parsed = Number(String(value).replace(/,/g, ""));
      const price = Number.isFinite(parsed) ? parsed : 0;
      updateCartItemPrice(item.id, price);
      // refocus scanner after finishing edit
      requestAnimationFrame(() => {
        try { refocusScanner(true); } catch { /* ignore */ }
      });
    }, [value, item.id, updateCartItemPrice, refocusScanner]);

    return (
      <Input
        ref={ref}
        type="text"
        data-cart-price-input={item.id}
        value={value}
        className="w-20 h-8 text-sm"
        onFocus={() => { selectRow(item.id); setEditing(true); }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setEditing(false);
            setValue(String(item.product.price ?? 0));
            requestAnimationFrame(() => {
              try { refocusScanner(true); } catch { /* ignore */ }
            });
          }
        }}
        disabled={disabled}
      />
    );
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
                {item.product.__placeholder ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Fetching product…</span>
                  </div>
                ) : (
                  item.product.name
                )}
              </TableCell>

              <TableCell className="py-3 px-4">
                <PriceCell item={item} />
              </TableCell>

              <TableCell className="py-3 px-4">
                <Input
                  type="number"
                  min={1}
                  data-cart-qty-input={item.id}
                  value={item.quantity}
                  className="w-16 h-8 text-sm"
                  onFocus={() => selectRow(item.id)}
                  onChange={(e) => {
                    const qty = Math.max(1, Number(e.target.value) || 1);
                    updateCartItemQuantity(item.id, qty);
                  }}
                  onBlur={() => {
                    try { refocusScanner(true); } catch { /* ignore */ }
                  }}   // ✅ after editing qty
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                      try { refocusScanner(true); } catch { /* ignore */ } // ✅ confirm + refocus
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

                    // Force scanner refocus after delete (defer to next frame)
                    requestAnimationFrame(() => {
                      try { refocusScanner(true); } catch { /* ignore */ }
                    });
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