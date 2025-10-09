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
  const priceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Define callbacks BEFORE useEffect to avoid TDZ ReferenceError
  const focusSearchBar = useCallback(() => {
    requestAnimationFrame(() => {
      const ps = document.querySelector<HTMLInputElement>('[data-product-search="true"]');
      ps?.focus();
      ps?.select?.();
    });
  }, []);

  const handleSelectNext = useCallback((e: Event) => {
    const currentId =
      (e as CustomEvent)?.detail?.id ??
      selectedRowId ??
      document
        .querySelector<HTMLElement>('[data-cart-selected="true"]')
        ?.getAttribute("data-cart-id") ??
      null;

    if (cart.length === 0) return;

    if (!currentId) {
      selectRow(cart[0].id);
      return;
    }

    const idx = cart.findIndex((it) => it.id === currentId);
    const nextIdx = Math.min(idx + 1, cart.length - 1);
    selectRow(cart[nextIdx]?.id ?? currentId);
  }, [cart, selectedRowId, selectRow]);

  const handleSelectPrev = useCallback((e: Event) => {
    const currentId =
      (e as CustomEvent)?.detail?.id ??
      selectedRowId ??
      document
        .querySelector<HTMLElement>('[data-cart-selected="true"]')
        ?.getAttribute("data-cart-id") ??
      null;

    if (cart.length === 0) return;

    if (!currentId) {
      selectRow(cart[0].id);
      return;
    }

    const idx = cart.findIndex((it) => it.id === currentId);
    const prevIdx = Math.max(idx - 1, 0);
    selectRow(cart[prevIdx]?.id ?? currentId);
  }, [cart, selectedRowId, selectRow]);

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
      const id =
        (e as CustomEvent).detail?.id ??
        selectedRowId ??
        document
          .querySelector<HTMLElement>('[data-cart-selected="true"]')
          ?.getAttribute("data-cart-id") ??
        null;
      if (!id) return;
      selectRow(id);
      setTimeout(() => {
        const input = priceInputRefs.current[id];
        input?.focus();
        input?.select?.();
      }, 0);
    }
    function handleFocusQty(e: Event) {
      const id =
        (e as CustomEvent).detail?.id ??
        selectedRowId ??
        document
          .querySelector<HTMLElement>('[data-cart-selected="true"]')
          ?.getAttribute("data-cart-id") ??
        null;
      if (!id) return;
      selectRow(id);
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>(
          `input[data-cart-qty-input="${id}"]`
        );
        input?.focus();
        input?.select?.();
      }, 0);
    }
    function handleDeleteItem(e: Event) {
      const id = (e as CustomEvent).detail?.id;
      if (!id) return;

      const idx = cart.findIndex((it) => it.id === id);
      const nextId =
        idx !== -1 ? (cart[idx + 1]?.id ?? cart[idx - 1]?.id ?? null) : null;

      deleteCartItem(id);

      if (nextId) {
        selectRow(nextId);
      }
      focusSearchBar();
    }

    // Auto-select the last added item, but DO NOT return early
    if (lastAddedItemId && lastAutoSelectedId.current !== lastAddedItemId) {
      const exists = cart.some((it) => it.id === lastAddedItemId);
      if (exists) {
        lastAutoSelectedId.current = lastAddedItemId;
        selectRow(lastAddedItemId);
      }
    }

    window.addEventListener("cart:edit-price", handleEditPrice);
    window.addEventListener("cart:focus-qty", handleFocusQty);
    window.addEventListener("cart:delete-item", handleDeleteItem);
    window.addEventListener("cart:select-next", handleSelectNext);
    window.addEventListener("cart:select-prev", handleSelectPrev);
    window.addEventListener("cart:increment-qty", handleIncrementQty);
    window.addEventListener("cart:decrement-qty", handleDecrementQty);

    return () => {
      window.removeEventListener("cart:edit-price", handleEditPrice);
      window.removeEventListener("cart:focus-qty", handleFocusQty);
      window.removeEventListener("cart:delete-item", handleDeleteItem);
      window.removeEventListener("cart:select-next", handleSelectNext);
      window.removeEventListener("cart:select-prev", handleSelectPrev);
      window.removeEventListener("cart:increment-qty", handleIncrementQty);
      window.removeEventListener("cart:decrement-qty", handleDecrementQty);
    };
  }, [
    cart,
    updateCartItemQuantity,
    selectRow,
    deleteCartItem,
    focusSearchBar,
    disabled,
    selectedRowId,
    handleSelectNext,
    handleSelectPrev,
  ]);

  const PriceCell: React.FC<{ item: CartItem }> = ({ item }) => {
    const [value, setValue] = useState<string>(String(item.product.price ?? 0));

    useEffect(() => {
      setValue(String(item.product.price ?? 0));
    }, [item.product.price]);

    const commit = () => {
      const parsed = Number(String(value).replace(/,/g, ""));
      const price = Number.isFinite(parsed) ? parsed : 0;
      updateCartItemPrice(item.id, price);
      focusSearchBar();
    };

    return (
      <Input
        type="text"
        value={value}
        className="w-[60px] h-8 text-sm text-center rounded-md border-gray-200 focus:border-gray-300 focus:ring-0 bg-gray-50 mx-auto"
        onFocus={() => selectRow(item.id)}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        disabled={disabled}
        ref={(el) => { priceInputRefs.current[item.id] = el; }}
      />
    );
  };

  const QuantityInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    onFocus: () => void;
    onBlur: () => void;
    disabled?: boolean;
    inputId?: string;
  }> = ({ value, onChange, onFocus, onBlur, disabled, inputId }) => {
    const [inputValue, setInputValue] = useState<string>(value.toString());

    useEffect(() => {
      setInputValue(value.toString());
    }, [value]);

    return (
      <Input
        type="text"
        value={inputValue}
        className="w-[45px] h-8 text-sm text-center rounded-md border-gray-200 focus:border-gray-300 focus:ring-0 bg-gray-50 mx-auto"
        onFocus={onFocus}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => {
          const num = parseFloat(inputValue);
          onChange(isNaN(num) || num <= 0 ? 1 : num);
          onBlur();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        disabled={disabled}
        data-cart-qty-input={inputId}
      />
    );
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full border border-gray-100 rounded-xl bg-white text-gray-400">
        🛒 Scan or search to add products
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
      <Table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[50%]" />
          <col className="w-[15%]" />
          <col className="w-[15%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
        </colgroup>

        <TableHeader className="bg-gray-50 border-b border-gray-100">
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-medium text-gray-600">
              Product
            </TableHead>
            <TableHead className="px-2 py-2 text-center font-medium text-gray-600">
              Price
            </TableHead>
            <TableHead className="px-2 py-2 text-center font-medium text-gray-600">
              Quantity
            </TableHead>
            <TableHead className="px-2 py-2 text-center font-medium text-gray-600">
              Total
            </TableHead>
            <TableHead className="px-2 py-2 text-center font-medium text-gray-600">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {cart.map((item) => {
            const isSelected = selectedRowId === item.id;

            return (
              <TableRow
                key={item.id}
                data-cart-id={item.id}
                data-cart-selected={isSelected ? "true" : undefined}
                className={cn(
                  "transition-all duration-100 border-b last:border-0",
                  isSelected ? "bg-gray-100 border-gray-300" : "hover:bg-gray-50"
                )}
                onClick={() => selectRow(item.id)}
              >
                {/* Product */}
                <TableCell className="px-4 py-3 text-gray-800 font-medium text-left align-middle break-words whitespace-normal leading-snug">
                  {item.product.__placeholder ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading…</span>
                    </div>
                  ) : (
                    <div className="break-words whitespace-normal leading-snug">
                      {item.product.name}
                    </div>
                  )}
                </TableCell>

                {/* Price */}
                <TableCell className="px-2 py-3 text-center align-middle">
                  <PriceCell item={item} />
                </TableCell>

                {/* Quantity */}
                <TableCell className="px-2 py-3 text-center align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <QuantityInput
                      value={item.quantity}
                      onChange={(qty) => updateCartItemQuantity(item.id, qty)}
                      onFocus={() => selectRow(item.id)}
                      onBlur={focusSearchBar}
                      disabled={disabled}
                      inputId={item.id}
                    />
                    <span className="text-xs text-gray-500">
                      {item.product.unit || "pcs"}
                    </span>
                  </div>
                </TableCell>

                {/* Total */}
                <TableCell className="px-2 py-3 text-center font-semibold text-gray-800 align-middle">
                  ₱{(Number(item.product.price || 0) * item.quantity).toFixed(2)}
                </TableCell>

                {/* Delete */}
                <TableCell className="px-2 py-3 text-center align-middle">
                  <button
                    type="button"
                    className="text-sm text-red-500 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = cart.findIndex((it) => it.id === item.id);
                      const nextId =
                        idx !== -1
                          ? (cart[idx + 1]?.id ?? cart[idx - 1]?.id ?? null)
                          : null;

                      deleteCartItem(item.id);

                      if (nextId) {
                        selectRow(nextId);
                      }
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
    </div>
  );
}
