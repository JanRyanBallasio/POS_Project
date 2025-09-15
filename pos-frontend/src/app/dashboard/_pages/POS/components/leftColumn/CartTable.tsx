import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
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
  disabled?: boolean;
}

export default function CartTable({
  cart,
  selectedRowId,
  selectRow,
  updateCartItemQuantity,
  updateCartItemPrice,
  deleteCartItem,
  disabled = false,
}: CartTableProps) {
  const { lastAddedItemId } = useCart();
  const lastAutoSelectedId = useRef<string | null>(null);

  // Auto-select last added cart row
  useEffect(() => {
    if (!lastAddedItemId || lastAutoSelectedId.current === lastAddedItemId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const trySelect = () => {
      if (cancelled) return;
      const exists = cart.some((it) => it.id === lastAddedItemId);
      if (exists) {
        lastAutoSelectedId.current = lastAddedItemId;
        try {
          selectRow(lastAddedItemId);
        } catch {}
        return;
      }
      attempts++;
      if (attempts < maxAttempts) requestAnimationFrame(trySelect);
    };

    requestAnimationFrame(trySelect);
    return () => {
      cancelled = true;
    };
  }, [lastAddedItemId, cart, selectRow]);

  // Reset tracking if row is removed
  useEffect(() => {
    if (lastAutoSelectedId.current && !cart.find((it) => it.id === lastAutoSelectedId.current)) {
      lastAutoSelectedId.current = null;
    }
  }, [cart]);

  const handleRowClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectRow(itemId);
  };

  const handleCellClick = (itemId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "INPUT" && target.tagName !== "BUTTON" && !target.closest("button")) {
      handleRowClick(itemId, e);
    }
  };

  const priceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Utility: focus search bar
  const focusSearchBar = useCallback(() => {
    requestAnimationFrame(() => {
      const ps = document.querySelector<HTMLInputElement>('[data-product-search="true"]');
      ps?.focus();
      ps?.select?.();
    });
  }, []);

  // --- Listen for custom cart events ---
  useEffect(() => {
    function handleIncrementQty(e: Event) {
      const id = (e as CustomEvent).detail?.id;
      const item = cart.find((it) => it.id === id);
      if (item) {
        updateCartItemQuantity(id, item.quantity + 1);
        selectRow(id);
      }
    }
    function handleDecrementQty(e: Event) {
      const id = (e as CustomEvent).detail?.id;
      const item = cart.find((it) => it.id === id);
      if (item) {
        updateCartItemQuantity(id, Math.max(1, item.quantity - 1));
        selectRow(id);
      }
    }
    function handleEditPrice(e: Event) {
      const id = (e as CustomEvent).detail?.id;
      if (!id) return;
      selectRow(id);
      setTimeout(() => {
        const input = priceInputRefs.current[id];
        input?.focus();
        input?.select?.();
      }, 0);
    }
    function handleDeleteItem(e: Event) {
      const id = (e as CustomEvent).detail?.id;
      if (id) {
        deleteCartItem(id);
        focusSearchBar();
      }
    }

    window.addEventListener("cart:increment-qty", handleIncrementQty);
    window.addEventListener("cart:decrement-qty", handleDecrementQty);
    window.addEventListener("cart:edit-price", handleEditPrice);
    window.addEventListener("cart:delete-item", handleDeleteItem);

    return () => {
      window.removeEventListener("cart:increment-qty", handleIncrementQty);
      window.removeEventListener("cart:decrement-qty", handleDecrementQty);
      window.removeEventListener("cart:edit-price", handleEditPrice);
      window.removeEventListener("cart:delete-item", handleDeleteItem);
    };
  }, [cart, updateCartItemQuantity, selectRow, deleteCartItem, focusSearchBar]);

  // --- PriceCell ---
  const PriceCell: React.FC<{ item: CartItem }> = ({ item }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>(String(item.product.price ?? 0));
    const ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      priceInputRefs.current[item.id] = ref.current;
      return () => {
        priceInputRefs.current[item.id] = null;
      };
    }, [item.id]);

    useEffect(() => {
      if (!editing) setValue(String(item.product.price ?? 0));
    }, [item.product.price, editing]);

    const commit = useCallback(() => {
      setEditing(false);
      const parsed = Number(String(value).replace(/,/g, ""));
      const price = Number.isFinite(parsed) ? parsed : 0;
      updateCartItemPrice(item.id, price);
      focusSearchBar();
    }, [value, item.id, updateCartItemPrice]);

    return (
      <Input
        ref={ref}
        type="text"
        data-cart-price-input={item.id}
        value={value}
        className="w-20 h-8 text-sm"
        onFocus={() => {
          selectRow(item.id);
          setEditing(true);
        }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setEditing(false);
            setValue(String(item.product.price ?? 0));
            focusSearchBar();
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
          <span className="text-gray-500">🛒 Scan or search to add products</span>
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
              data-cart-id={item.id}
              className={cn(
                "hover:bg-gray-50 cursor-pointer transition-all duration-200",
                isSelected ? "bg-gray-100 dark:bg-gray-800" : ""
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
                <div className="flex items-center gap-2">
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
                    onBlur={focusSearchBar}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                        focusSearchBar();
                      }
                    }}
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-600 font-medium">
                    {item.product.unit || 'pcs'}
                  </span>
                </div>
              </TableCell>

              <TableCell className="py-3 px-4">
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCartItem(item.id);
                    focusSearchBar();
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
