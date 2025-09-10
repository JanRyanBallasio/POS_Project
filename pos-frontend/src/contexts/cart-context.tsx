import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  RefObject,
  useEffect,
  useCallback,
} from "react";
import { productApi, Product } from "@/hooks/products/useProductApi";
import { useProductModal } from "@/contexts/productRegister-context";

interface CartItem {
  product: Product;
  quantity: number;
  id: string;
}

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  scanError: string | null;
  isScanning: boolean;
  lastAddedItemId: string | null;
  scanAndAddToCart: (barcode: string, preValidatedProduct?: Product | null) => Promise<void>;
  addProductToCart: (product: Product) => void;
  refocusScanner: (force?: boolean) => void;
  setScannerRef: (ref: RefObject<HTMLInputElement>) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  deleteCartItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const genId = () =>
  typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : Date.now().toString();

const productEqual = (a: Product, b: Product) => {
  if (a?.id && b?.id) return a.id === b.id;
  return Boolean(a?.barcode && b?.barcode && a.barcode === b.barcode);
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [scannerInputRef, setScannerInputRef] =
    useState<RefObject<HTMLInputElement> | null>(null);
  const [pendingScans, setPendingScans] = useState<Set<string>>(new Set());
  const [lastScanTime, setLastScanTime] = useState<Map<string, number>>(new Map());

  const { setBarcode: setContextBarcode, openModal, setOpen: setProductModalOpen } =
    useProductModal();

  const clearCart = useCallback(() => {
    setCart([]);
    setLastAddedItemId(null);
    setLastScanTime(new Map());
  }, []);

  const setScannerRef = useCallback((ref: RefObject<HTMLInputElement>) => {
    setScannerInputRef(ref);
  }, []);

  const refocusScanner = useCallback((force = false) => {
    try {
      const el = scannerInputRef?.current;
      if (!el) return;
      const active = document.activeElement as HTMLElement | null;

      // If not forced, don't steal focus while user is actively typing in a visible input we care about
      if (!force && active) {
        const tag = active.tagName;
        const isTyping =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable === true;

        const isProductSearch =
          active.getAttribute?.("data-product-search") === "true" ||
          String((active as HTMLInputElement).placeholder || "")
            .toLowerCase()
            .includes("search by product");

        const isCustomerSearch =
          active.getAttribute?.("data-customer-search") === "true" ||
          String((active as HTMLInputElement).placeholder || "")
            .toLowerCase()
            .includes("search name");

        const isPriceInput = !!active.getAttribute?.("data-cart-price-input");
        const isQtyInput = !!active.getAttribute?.("data-cart-qty-input");
        const isCashInput =
          active.getAttribute?.("data-pos-cash-input") === "true" ||
          (active.getAttribute && active.getAttribute("placeholder") === "0.00");

        // If user is actively typing in any of those, do not override unless forced
        if (
          isTyping &&
          (isProductSearch || isCustomerSearch || isPriceInput || isQtyInput || isCashInput)
        ) {
          return;
        }
      }

      // Defer to next frame so DOM updates (removal/add) complete first
      requestAnimationFrame(() => {
        try {
          scannerInputRef?.current?.focus();
          // If the scanner input supports select, select its content
          (scannerInputRef?.current as HTMLInputElement | null)?.select?.();
        } catch {
          // swallow focus errors
        }
      });
    } catch {
      // ignore
    }
  }, [scannerInputRef]);

  // Use refocusScanner inside deleteCartItem to ensure focus returns after deletion
  const deleteCartItem = useCallback((id: string) => {
    // compute next selected id (row above or new first) based on current cart
    let nextSelectedId: string | null = null;
    if (cart && cart.length > 0) {
      const idx = cart.findIndex((item) => item.id === id);
      if (cart.length > 1) {
        if (idx > 0) {
          nextSelectedId = cart[idx - 1].id;
        } else {
          // deleted first item -> select the new first (old index 1)
          nextSelectedId = cart[1]?.id ?? null;
        }
      } else {
        nextSelectedId = null;
      }
    }

    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    setLastAddedItemId((prev) => (prev === id ? null : prev));

    // Notify listeners about deletion and desired next selection
    try {
      window.dispatchEvent(
        new CustomEvent("cart:item-deleted", {
          detail: { deletedId: id, nextSelectedId },
        })
      );
    } catch (err) {
      // ignore in environments without window
    }

    // Ensure scanner regains focus after DOM update (force true)
    refocusScanner(true);
  }, [cart, refocusScanner]);

  // Update quantity for an item
  const updateCartItemQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item))
    );
  }, []);

  // Update price for an item
  const updateCartItemPrice = useCallback((id: string, price: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, product: { ...item.product, price: Number(isFinite(Number(price)) ? price : 0) } } : item
      )
    );
  }, []);

  const addOrIncrement = useCallback((product: Product) => {
    const now = Date.now();
    const productKey = product.barcode || product.id?.toString() || product.name;

    console.log("🛒 addOrIncrement called:", {
      productName: product.name,
      productKey,
      currentTime: now
    });

    // Check for recent addition of the same product (within 1 second)
    const lastTime = lastScanTime.get(productKey);
    if (lastTime && (now - lastTime) < 1000) {
      console.log("⏰ Duplicate prevention triggered, ignoring:", productKey);
      return;
    }

    setLastScanTime(prev => new Map(prev).set(productKey, now));

    setCart((prevCart) => {
      const existing = prevCart.find((item) => productEqual(item.product, product));
      if (existing) {
        console.log("📈 Incrementing existing item:", {
          itemId: existing.id,
          productName: product.name,
          newQuantity: existing.quantity + 1
        });
        setLastAddedItemId(existing.id);
        return prevCart.map((item) =>
          productEqual(item.product, product) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const cartItem: CartItem = {
        product,
        quantity: 1,
        id: genId(),
      };
      console.log("➕ Adding new item to cart:", {
        itemId: cartItem.id,
        productName: product.name,
        quantity: 1
      });
      setLastAddedItemId(cartItem.id);
      console.log("🎯 Set lastAddedItemId to:", cartItem.id);

      // PREPEND new item so latest products show first
      return [cartItem, ...prevCart];
    });
  }, [lastScanTime]);

  const addProductToCart = useCallback((product: Product) => {
    addOrIncrement(product);
  }, [addOrIncrement]);

  const scanAndAddToCart = useCallback(
    async (barcode: string, preValidatedProduct?: Product | null): Promise<void> => {
      if (!barcode) return;

      const cleanedBarcode = String(barcode).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
      if (!cleanedBarcode) {
        setScanError("Invalid barcode");
        return;
      }

      if (pendingScans.has(cleanedBarcode)) {
        return;
      }

      try {
        setIsScanning(true);
        setScanError(null);
        setPendingScans(prev => new Set([...prev, cleanedBarcode]));

        let product: Product | null = null;

        // Use pre-validated product if provided
        if (preValidatedProduct) {
          product = preValidatedProduct;
        } else {
          try {
            product = await productApi.getByBarcode(cleanedBarcode);
          } catch (apiError) {
            product = null;
          }
        }

        if (product) {
          addOrIncrement(product);
          setScanError(null);
        } else {
          // ⚡ Optimistic placeholder insert
          const placeholder: Product = {
            id: `pending-${cleanedBarcode}`,
            name: "Loading product...",
            barcode: cleanedBarcode,
            price: 0,
            quantity: 0,         // ✅ default
            category_id: 0,      // ✅ default (use 0 or -1 for "unassigned")
            __placeholder: true, // 👈 mark so you can detect it later
          };
          addOrIncrement(placeholder);

          // Then trigger product register modal
          try {
            if (typeof setContextBarcode === "function") {
              setContextBarcode(cleanedBarcode);
            }
            if (typeof openModal === "function") {
              openModal("addProduct");
            } else if (typeof setProductModalOpen === "function") {
              setProductModalOpen(true);
            }
          } catch { }
          setScanError(`Product not found: ${cleanedBarcode}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error scanning barcode";
        setScanError(errorMessage);
        console.warn("[scanAndAddToCart] Error:", error);
      } finally {
        setPendingScans(prev => {
          const next = new Set(prev);
          next.delete(cleanedBarcode);
          return next;
        });
        setIsScanning(false);

        // ⚡ Always refocus via rAF
        requestAnimationFrame(() => refocusScanner(true));
      }
    },
    [pendingScans, openModal, setProductModalOpen, setContextBarcode, refocusScanner, addOrIncrement]
  );


  useEffect(() => {
    const onProductAdded = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;

      const addedProduct: Product | undefined = detail.product;
      const barcode: string | undefined = detail.barcode;

      if (addedProduct) {
        addOrIncrement(addedProduct);
      } else if (barcode) {
        (async () => {
          try {
            const product = await productApi.getByBarcode(barcode);
            if (product) addOrIncrement(product);
          } catch {
            // ignore fetch errors here
          }
        })();
      }

      try {
        const el = scannerInputRef?.current;
        if (el) {
          try { el.value = ""; } catch { }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          try { el.focus(); } catch { }
        }
      } catch { }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener("product:added", onProductAdded as EventListener);
      return () => window.removeEventListener("product:added", onProductAdded as EventListener);
    }
  }, [scannerInputRef, addOrIncrement]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + Number(item.product.price || 0) * item.quantity, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      cartTotal,
      scanError,
      isScanning,
      lastAddedItemId,
      scanAndAddToCart,
      addProductToCart,
      refocusScanner,
      setScannerRef,
      updateCartItemQuantity,
      updateCartItemPrice,
      deleteCartItem,
      clearCart,
    }),
    [
      cart,
      cartTotal,
      scanError,
      isScanning,
      lastAddedItemId,
      scanAndAddToCart,
      addProductToCart,
      refocusScanner,
      setScannerRef,
      updateCartItemQuantity,
      updateCartItemPrice,
      deleteCartItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const useCartKeyboard = (selectedRowId: string | null) => {
  const { cart, updateCartItemQuantity, refocusScanner, deleteCartItem } = useCart();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const isScanner = target.getAttribute('data-barcode-scanner') === 'true' || (target.id === 'barcode-scanner');
      const activeEl = document.activeElement as HTMLElement | null;

      // detect product search input (matches placeholder used in ProductSearch)
      const isProductSearch = activeEl && activeEl.tagName === 'INPUT' && (
        (activeEl as HTMLInputElement).placeholder?.toLowerCase().includes('search by product') ||
        activeEl.getAttribute('data-product-search') === 'true' ||
        activeEl.closest('[data-product-search]') !== null
      );

      // More comprehensive customer search detection
      const isCustomerSearch = target.tagName === 'INPUT' && (
        target.getAttribute('data-customer-search') === 'true' ||
        (target as HTMLInputElement).placeholder?.toLowerCase().includes('search name') ||
        (target as HTMLInputElement).placeholder?.toLowerCase().includes('customer') ||
        target.closest('[data-customer-search]') !== null
      );

      const currentStep = (window as any).posStep || 1;

      // Quick add-customer shortcut: Ctrl+Shift+C -> open Add Customer modal
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation();
        try {
          window.dispatchEvent(new CustomEvent("customer:add"));
        } catch { }
        return;
      }

      // Quick add-customer shortcut: Ctrl+Shift+C (unchanged)
      // if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   window.dispatchEvent(new CustomEvent("customer:add"));
      //   return;
      // }

      // STEP-2 ONLY SHORTCUTS (mirror pattern used for STEP-1)
      if (currentStep === 2) {
        // Ctrl+C -> focus customer input (select text). Do not interfere with Shift or other combos.
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "c") {
          e.preventDefault();
          e.stopPropagation();
          const customerInput = document.querySelector<HTMLInputElement>(
            'input[data-customer-search="true"], input[placeholder*="customer"], input[placeholder*="search name"]'
          );
          if (customerInput) {
            try {
              customerInput.focus();
              customerInput.select();
              // mark global flag so other handlers can detect customer typing
              (window as any).customerSearchActive = true;
              // clear the flag on blur to restore global shortcuts
              const onBlur = () => {
                try {
                  (window as any).customerSearchActive = false;
                } catch { }
                customerInput.removeEventListener("blur", onBlur);
              };
              customerInput.addEventListener("blur", onBlur);
            } catch { }
          }
          return;
        }

        // Ctrl+B -> go back to Step 1
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "b") {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent("pos:step-1-back"));
          return;
        }

        // Plain Enter in Step 2 -> advance to Step 3.
        // Only block advancement when focused element is a TEXTAREA or contentEditable.
        if (e.key === "Enter" && !e.ctrlKey) {
          const activeEl = document.activeElement as HTMLElement | null;
          // If focus is inside the AddCustomer modal, let the modal handle Enter (do not dispatch step event).
          const isInAddCustomerModal = !!activeEl && typeof activeEl.closest === "function" && !!activeEl.closest('[data-add-customer-modal="true"]');
          if (isInAddCustomerModal) {
            // allow modal inputs / buttons to receive the Enter key
            return;
          }
          const isTextArea = !!activeEl && activeEl.tagName === "TEXTAREA";
          const isContentEditable = !!activeEl && (activeEl as HTMLElement).isContentEditable === true;
          if (!isTextArea && !isContentEditable) {
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("pos:step-2-complete"));
            return;
          }
          // otherwise let the focused element handle Enter (e.g. multiline inputs)
          return;
        }

        // keep Step 2-specific shortcuts here if you want more (e.g. Ctrl+D delete in step2), then return
      } // end STEP-2 block

      // STEP-3: Enter -> complete/close transaction (unless typing in a textarea/contentEditable)
      if (currentStep === 3 && e.key === "Enter" && !e.ctrlKey) {
        const activeEl = document.activeElement as HTMLElement | null;
        const isTextArea = !!activeEl && activeEl.tagName === "TEXTAREA";
        const isContentEditable = !!activeEl && (activeEl as HTMLElement).isContentEditable === true;
        // If focused element is multiline/contentEditable let it handle Enter
        if (isTextArea || isContentEditable) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        try {
          window.dispatchEvent(new CustomEvent("pos:step-3-complete"));
        } catch { }
        return;
      }

      // STEP-1 ONLY SHORTCUTS
      if (currentStep === 1) {
        // F2 handled in leftColumn already (keeps responsibility there) - keep global no-op to avoid interference
        if (e.key === 'F2') {
          // do not prevent ProductSearch local handler; leftColumn handles focusing
          return;
        }

        // Arrow navigation: move selection up/down in cart
        // Allow when not typing in a regular input OR when the scanner input is focused
        if ((!isInput || isScanner) && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === "ArrowDown") {
            window.dispatchEvent(new CustomEvent("cart:select-next"));
          } else {
            window.dispatchEvent(new CustomEvent("cart:select-prev"));
          }
          return;
        }

        // Ctrl+Shift+P -> focus selected row price input
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          e.stopPropagation();
          if (selectedRowId) {
            const priceInput = document.querySelector(`input[data-cart-price-input="${selectedRowId}"]`) as HTMLInputElement | null;
            if (priceInput) {
              priceInput.focus();
              priceInput.select();
            }
          }
          return;
        }

        // Ctrl+D -> delete selected item, refocus scanner
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          e.stopPropagation();
          if (selectedRowId) {
            try {
              deleteCartItem(selectedRowId);
            } catch (err) { /* ignore */ }
            refocusScanner();
          }
          return;
        }

        // +/- quantity adjustments while not typing in a different input (preserve previous behavior but limited to step 1)
        const isPlusKey = e.key === "+" || e.code === "NumpadAdd" || (e.code === "Equal" && e.shiftKey);
        const isMinusKey = e.key === "-" || e.code === "NumpadSubtract" || e.code === "Minus";
        if ((isPlusKey || isMinusKey) && !isInput) {
          e.preventDefault();
          e.stopPropagation();
          if (!selectedRowId) {
            refocusScanner();
            return;
          }
          const item = cart.find((i) => i.id === selectedRowId);
          if (!item) {
            refocusScanner();
            return;
          }
          if (isPlusKey) {
            updateCartItemQuantity(item.id, item.quantity + 1);
          } else if (item.quantity > 1) {
            updateCartItemQuantity(item.id, item.quantity - 1);
          }
          // Always refocus scanner after quantity change
          refocusScanner();
          return;
        }

        // If Enter pressed while editing a price input: confirm (blur) and refocus scanner
        if (e.key === 'Enter' && !e.ctrlKey) {
          const activeIsPriceInput = !!activeEl && !!(activeEl.getAttribute && activeEl.getAttribute('data-cart-price-input'));
          if (activeIsPriceInput) {
            e.preventDefault();
            e.stopPropagation();
            try { (activeEl as HTMLInputElement).blur(); } catch { }
            refocusScanner();
            return;
          }

          // Let ProductSearch (and other local inputs) handle Enter — do not advance step from here
          const activeIsProductSearch = isProductSearch;
          if (activeIsProductSearch) {
            return;
          }

          // For other inputs in step 1, do nothing here
          return;
        }
      } // end step 1-only block

      // existing handlers for Ctrl+Enter / Ctrl+1 / scanner / plus/minus in other steps
      const isBody = target.tagName === 'BODY';

      // Handle Ctrl+Enter for POS navigation - preserve focus behavior and dispatch step-specific event
      if (e.ctrlKey && e.key === 'Enter') {
        const activeElement = document.activeElement as HTMLElement | null;
        const isCashInput = activeElement && (activeElement.getAttribute('data-pos-cash-input') === 'true' || activeElement.getAttribute('placeholder') === '0.00');

        // Only in Step 1: if not already on cash input, focus it instead of advancing
        if (currentStep === 1 && !isCashInput) {
          const cashInput = document.querySelector('input[placeholder="0.00"], input[data-pos-cash-input="true"]') as HTMLInputElement;
          if (cashInput) {
            cashInput.focus();
            cashInput.select();
          }
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Otherwise dispatch the current step complete event
        e.preventDefault();
        e.stopPropagation();
        if (currentStep === 1) {
          window.dispatchEvent(new CustomEvent('pos:step-1-complete'));
        } else if (currentStep === 2) {
          window.dispatchEvent(new CustomEvent('pos:step-2-complete'));
        } else if (currentStep === 3) {
          // New: allow Ctrl+Enter to complete Step 3 (finish/close transaction)
          window.dispatchEvent(new CustomEvent('pos:step-3-complete'));
        }
        return;
      }

      // Handle Ctrl+1 - behave like a "go to next from step 1" shortcut
      if (e.ctrlKey && e.key === '1') {
        const activeElement = document.activeElement as HTMLElement | null;
        const isCashInput = activeElement && (activeElement.getAttribute('data-pos-cash-input') === 'true' || activeElement.getAttribute('placeholder') === '0.00');

        if (currentStep === 1 && !isCashInput) {
          const cashInput = document.querySelector('input[placeholder="0.00"], input[data-pos-cash-input="true"]') as HTMLInputElement;
          if (cashInput) {
            cashInput.focus();
            cashInput.select();
          }
          e.preventDefault();
          e.stopPropagation();
          return; // focus only, do not advance
        }

        e.preventDefault();
        e.stopPropagation();
        if (currentStep === 1) {
          window.dispatchEvent(new CustomEvent('pos:step-1-complete'));
        } else if (currentStep === 2) {
          window.dispatchEvent(new CustomEvent('pos:step-2-complete'));
        }
        return;
      }

      // Handle numpad 0 / F5 for refocusing scanner (unchanged)
      if ((e.key === "0" && e.code === "Numpad0") || e.key === "F5") {
        if (!isInput || isScanner) {
          e.preventDefault();
          e.stopPropagation();
          refocusScanner();
          window.dispatchEvent(new Event('focusBarcodeScanner'));
        }
        return;
      }

      if (!selectedRowId) {
        if (!isInput && !isBody) {
          refocusScanner();
        }
        return;
      }

      // +/- quantity handling (only when appropriate) - unchanged
      const shouldHandlePlusMinus = isBody || isScanner || (!isInput && !isCustomerSearch);
      if (!shouldHandlePlusMinus) return;

      const isPlusKey = e.key === "+" || e.code === "NumpadAdd" || (e.code === "Equal" && e.shiftKey);
      const isMinusKey = e.key === "-" || e.code === "NumpadSubtract" || e.code === "Minus";

      if (isPlusKey || isMinusKey) {
        e.preventDefault();
        e.stopPropagation();

        const item = cart.find((i) => i.id === selectedRowId);
        if (!item) return;

        if (isPlusKey) {
          updateCartItemQuantity(item.id, item.quantity + 1);
        } else if (item.quantity > 1) {
          updateCartItemQuantity(item.id, item.quantity - 1);
        }
      }
    };

    // Use capture:true so this global handler runs before element-level handlers.
    // This ensures Enter in step 2 is caught even when focus is inside inputs.
    document.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [selectedRowId, cart, updateCartItemQuantity, refocusScanner]);
};