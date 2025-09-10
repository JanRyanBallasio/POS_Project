import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useCartSelection } from "@/hooks/pos/leftCol/useCartSelection";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useBarcodeScan } from "@/hooks/pos/leftCol/useBarcodeScan";
import { useProductSearch } from "@/hooks/pos/leftCol/useProductsSearch";
import { useCartKeyboard } from "@/contexts/cart-context";
import React, { useRef, useEffect, useState } from "react";
import CartTable from "./CartTable";
import ProductSearch from "./ProductSearch";
import BarcodeScannerInput from "./BarcodeScannerInput";
import { useProductModal } from "@/contexts/productRegister-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ProductRegisterModal from "@/components/product/components/ProductRegisterModal";
import { productApi } from "@/hooks/products/useProductApi";

interface POSLeftColProps {
  step: 1 | 2 | 3;
}

export default function POSLeftCol({ step }: POSLeftColProps) {
  const [refocused, setRefocused] = useState<boolean>(false);
  const { selectedRowId, selectRow } = useCartSelection<string>();
  const { products } = useProducts();
  const {
    cart,
    updateCartItemQuantity,
    scanAndAddToCart,
    addProductToCart,
    setScannerRef,
    refocusScanner,
    updateCartItemPrice,
    deleteCartItem,
    lastAddedItemId,
  } = useCart();

  const { barcodeInput, inputRef, handleBarcodeChange, handleKeyPress, refocusScanner: hookRefocus } =
    useBarcodeScan(handleScanAndAddToCart);

  const { setOpen, setBarcode } = useProductModal();
  useCartKeyboard(selectedRowId);

  const handleSearchSelect = (product: any) => {
    addProductToCart(product);
    clearSearch();
    hookRefocus();
  };

  const {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearchChange,
    clearSearch,
  } = useProductSearch(products, handleSearchSelect); // Pass the callback here

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);
  const productSearchInputRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    setScannerRef(inputRef as React.RefObject<HTMLInputElement>);
  }, [setScannerRef, inputRef]);

  useEffect(() => {
    if (step === 2 || step === 3) {
      if (inputRef?.current) inputRef.current.blur();
    } else {
      // Re-focus when returning to step 1
      setTimeout(() => {
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [step]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      // Only trigger in POS step 1 and only for Numpad 8 or F2
      if (step === 1 && (e.key === "F2")) {
        e.preventDefault();
        if (productSearchInputRef.current) {
          productSearchInputRef.current.focus();
          productSearchInputRef.current.select();
        }
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [step]);

  // Listen for cart selection events triggered by global keyboard handler
  useEffect(() => {
    if (typeof window === "undefined") return;

    const selectNext = () => {
      if (!cart || cart.length === 0) return;
      const idx = cart.findIndex((c) => c.id === selectedRowId);
      const nextIdx = idx < 0 ? 0 : Math.min(cart.length - 1, idx + 1);
      const id = cart[nextIdx]?.id;
      if (id) {
        selectRow(id);
      }
    };

    const selectPrev = () => {
      if (!cart || cart.length === 0) return;
      const idx = cart.findIndex((c) => c.id === selectedRowId);
      const prevIdx = idx <= 0 ? 0 : idx - 1;
      const id = cart[prevIdx]?.id;
      if (id) {
        selectRow(id);
      }
    };

    window.addEventListener("cart:select-next", selectNext);
    window.addEventListener("cart:select-prev", selectPrev);

    // When an item is deleted, the cart-context will emit nextSelectedId.
    const onItemDeleted = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      const nextId: string | null = detail.nextSelectedId ?? null;

      if (nextId) {
        selectRow(nextId);
        return;
      }

      // Fallback: if cart still has items, select the current first row; otherwise clear selection
      if (cart && cart.length > 0) {
        selectRow(cart[0].id);
      } else {
        selectRow("");
      }
    };
    window.addEventListener("cart:item-deleted", onItemDeleted);

    return () => {
      window.removeEventListener("cart:select-next", selectNext);
      window.removeEventListener("cart:select-prev", selectPrev);
      window.removeEventListener("cart:item-deleted", onItemDeleted);
    };
  }, [cart, selectedRowId, selectRow, inputRef]);

  async function handleScanAndAddToCart(barcode: string) {
    const clean = (v: string | null | undefined) => (v == null ? "" : String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim());
    const cleaned = clean(barcode);

    if (!cleaned || cleaned.length < 2) {
      return;
    }

    const normalizeBarcode = (bc: string) => {
      return bc.replace(/^0+/, '') || '0';
    };

    const cleanedNormalized = normalizeBarcode(cleaned);

    // 1) Try local cache with multiple comparison strategies
    const foundProduct = products.find((p) => {
      const productBarcode = clean(p?.barcode);

      if (!productBarcode) return false;

      if (productBarcode === cleaned) {
        return true;
      }

      if (normalizeBarcode(productBarcode) === cleanedNormalized) {
        return true;
      }

      return false;
    });

    if (foundProduct) {
      await scanAndAddToCart(cleaned, foundProduct);
      return;
    }

    // 2) Fallback to server lookup
    try {
      const serverProduct = await productApi.getByBarcode(cleaned);
      if (serverProduct) {
        await scanAndAddToCart(cleaned, serverProduct);
        return;
      }
    } catch (error) {
      // Server lookup failed
    }

    // 3) Product not found -> prompt to register
    setUnregisteredBarcode(cleaned);
    setShowRegisterDialog(true);
  }

  function handleRegisterProduct(barcode: string) {
    setShowRegisterDialog(false);
    setBarcode(barcode);
    setOpen(true);
  }

  const handleRefocus = () => {
    // Use both refocus functions to ensure compatibility
    refocusScanner();
    hookRefocus();

    // Dispatch the global focus event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('focusBarcodeScanner'));
    }

    setRefocused(true);
    setTimeout(() => setRefocused(false), 1000);
  };

  // Handle clicks on empty areas to refocus scanner
  const handleEmptyAreaClick = (e: React.MouseEvent) => {
    // Only refocus if clicking on the card content itself, not on child elements
    if (e.target === e.currentTarget) {
      handleRefocus();
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Refocus button and Scanner status positioned at top-right */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
        {/* Scanner Active Status */}
        {!(step === 2 || step === 3) && (
          <div className="bg-green-500 text-white px-2 py-1 rounded-md text-xs opacity-70">
            Scanner Active
          </div>
        )}

        {/* Refocus Button */}
        <Button
          variant="outline"
          size="sm"
          className="relative disabled:opacity-100"
          onClick={handleRefocus}
          disabled={(step === 2 || step === 3) || refocused}
        >
          <span className={cn('transition-all', refocused ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
            <CheckIcon className='stroke-green-600 dark:stroke-green-400' />
          </span>
          <span className={cn('absolute start-4 transition-all', refocused ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
            <ScanLine />
          </span>
          {refocused ? 'Focused!' : 'Refocus Scanner'}
        </Button>
      </div>

      <Card className="w-full h-full flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col min-h-0" onClick={handleEmptyAreaClick}>
          <BarcodeScannerInput
            inputRef={inputRef}
            barcodeInput={barcodeInput}
            handleBarcodeChange={handleBarcodeChange}
            handleKeyPress={handleKeyPress}
            disabled={step === 2 || step === 3}
          />
          <ProductSearch
            inputRef={productSearchInputRef} // <-- Pass the ref here
            searchQuery={searchQuery}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            handleSearchChange={handleSearchChange}
            handleSearchSelect={handleSearchSelect}
            clearSearch={clearSearch}
            refocusScanner={hookRefocus}
            disabled={step === 2 || step === 3}
          />
          {/* Simplified container - no nested divs */}
          <div className="rounded-md border flex-1 overflow-auto">
            <CartTable
              cart={cart}
              selectedRowId={selectedRowId}
              selectRow={selectRow}
              updateCartItemQuantity={updateCartItemQuantity}
              updateCartItemPrice={updateCartItemPrice}
              deleteCartItem={deleteCartItem}
              refocusScanner={hookRefocus}
              disabled={step === 2 || step === 3}
            />
          </div>
        </CardContent>
      </Card>
      <ProductRegisterModal />
      <AlertDialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Product Not Registered</AlertDialogTitle>
            <AlertDialogDescription>
              The scanned product (<span className="font-bold">{unregisteredBarcode}</span>) is not registered. Would you like to register it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRegisterDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => unregisteredBarcode && handleRegisterProduct(unregisteredBarcode)}>
              Register Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}