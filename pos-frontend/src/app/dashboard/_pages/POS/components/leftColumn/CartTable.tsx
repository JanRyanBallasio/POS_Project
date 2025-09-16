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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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
        className={`${isMobile ? 'w-16' : 'w-20'} h-8 text-sm`}
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

  // Add this custom quantity input component before the main CartTable component
  const QuantityInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    onFocus: () => void;
    onBlur: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    disabled?: boolean;
    itemId: string;
  }> = ({ value, onChange, onFocus, onBlur, onKeyDown, disabled, itemId }) => {
    const [inputValue, setInputValue] = useState<string>(value.toString());
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update input value when prop value changes (but not when user is editing)
    useEffect(() => {
      if (!isEditing) {
        setInputValue(value.toString());
      }
    }, [value, isEditing]);

    // Prevent focus loss from external sources while editing
    useEffect(() => {
      if (isEditing && inputRef.current) {
        const handleFocusLoss = (e: FocusEvent) => {
          // If focus is moving to another input, allow it
          const target = e.relatedTarget as HTMLElement;
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return;
          }
          
          // If focus is being lost to the body or null, prevent it and refocus
          if (!target || target === document.body) {
            e.preventDefault();
            setTimeout(() => {
              if (inputRef.current && isEditing) {
                inputRef.current.focus();
              }
            }, 0);
          }
        };

        const input = inputRef.current;
        input.addEventListener('blur', handleFocusLoss);
        
        return () => {
          input.removeEventListener('blur', handleFocusLoss);
        };
      }
    }, [isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Allow empty string, numbers, and valid decimal patterns
      if (newValue === '' || newValue === '.' || /^\d*\.?\d*$/.test(newValue)) {
        setInputValue(newValue);
        // Don't call onChange here - only update on commit to prevent focus loss
      }
    };

    const handleFocus = () => {
      setIsEditing(true);
      onFocus();
    };

    const handleBlur = () => {
      setIsEditing(false);
      
      let finalValue: number;
      let displayValue: string;
      
      // Validate and normalize the value on blur
      if (inputValue === '' || inputValue === '.') {
        finalValue = 1;
        displayValue = '1';
      } else {
        const numValue = parseFloat(inputValue);
        if (isNaN(numValue) || numValue <= 0) {
          finalValue = 1;
          displayValue = '1';
        } else {
          finalValue = numValue;
          // Format to max 2 decimals
          displayValue = numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(2).replace(/\.?0+$/, '');
        }
      }
      
      // Update both the display and the actual value
      setInputValue(displayValue);
      onChange(finalValue);
      
      // Call the original onBlur handler
      onBlur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle Enter key
      if (e.key === "Enter") {
        handleBlur();
        return;
      }
      
      // Allow: backspace, delete, tab, escape, decimal point, and numbers
      if (
        [8, 9, 27, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow home, end, left, right, up, down arrows
        (e.keyCode >= 35 && e.keyCode <= 40) ||
        // Allow numbers and decimal point
        (e.keyCode >= 48 && e.keyCode <= 57) ||
        (e.keyCode >= 96 && e.keyCode <= 105)
      ) {
        return;
      }
      e.preventDefault();
    };

    return (
      <Input
        ref={inputRef}
        type="text"
        data-cart-qty-input={itemId}
        value={inputValue}
        className={`${isMobile ? 'w-12' : 'w-16'} h-8 text-sm`}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="1"
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

  // Mobile Card Layout
  if (isMobile) {
    return (
      <div className="space-y-3 p-2">
        {cart.map((item) => {
          const isSelected = selectedRowId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "border rounded-lg p-3 bg-white transition-all duration-200",
                isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              )}
              onClick={(e) => handleRowClick(item.id, e)}
            >
              {/* Product Name */}
              <div className="mb-2">
                <h3 className="font-medium text-sm leading-tight">
                  {item.product.__placeholder ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Fetching product…</span>
                    </div>
                  ) : (
                    item.product.name
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Barcode: {item.product.barcode || "N/A"}
                </p>
              </div>

              {/* Price and Quantity Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Price:</span>
                  <PriceCell item={item} />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Qty:</span>
                  <QuantityInput
                    value={item.quantity}
                    onChange={(qty) => updateCartItemQuantity(item.id, qty)}
                    onFocus={() => selectRow(item.id)}
                    onBlur={focusSearchBar}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                        focusSearchBar();
                      }
                    }}
                    disabled={disabled}
                    itemId={item.id}
                  />
                  <span className="text-xs text-gray-600">
                    {item.product.unit || "pcs"}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCartItem(item.id);
                    focusSearchBar();
                  }}
                  disabled={disabled}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop Table Layout
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
                  <QuantityInput
                    value={item.quantity}
                    onChange={(qty) => updateCartItemQuantity(item.id, qty)}
                    onFocus={() => selectRow(item.id)}
                    onBlur={focusSearchBar}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                        focusSearchBar();
                      }
                    }}
                    disabled={disabled}
                    itemId={item.id}
                  />
                  <span className="text-sm text-gray-600 font-medium">
                    {item.product.unit || "pcs"}
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
