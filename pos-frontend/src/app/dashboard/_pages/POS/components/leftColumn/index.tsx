import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useCartSelection } from "@/hooks/pos/leftCol/useCartSelection";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useProductSearch } from "@/hooks/pos/leftCol/useProductsSearch";
import { useCartKeyboard } from "@/contexts/cart-context";
import React, { useRef, useEffect, useState, useCallback } from "react";
import CartTable from "./CartTable";
import ProductSearch from "./ProductSearch";
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
} from "@/components/ui/alert-dialog";
import ProductRegisterModal from "@/components/product/components/ProductRegisterModal";
import { productApi } from "@/hooks/products/useProductApi";

interface POSLeftColProps {
  step: 1 | 2 | 3;
  isMobile?: boolean;
  onMobileNext?: () => void;
}

export default function POSLeftCol({ step, isMobile = false, onMobileNext }: POSLeftColProps) {
  const { selectedRowId, selectRow, clearSelection } = useCartSelection<string>();
  const { products } = useProducts();
  const {
    cart,
    updateCartItemQuantity,
    scanAndAddToCart,
    addProductToCart,
    updateCartItemPrice,
    deleteCartItem,
    cartTotal,
  } = useCart();

  const { setOpen, setBarcode } = useProductModal();

  // Add this function
  const handleAddProduct = () => {
    setBarcode(searchQuery); // Pre-fill with the search query
    setOpen(true);
  };

  useCartKeyboard(selectedRowId);

  const productSearchInputRef = useRef<HTMLInputElement>(null!);

  const {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearchChange,
    clearSearch,
    isScannerInputRef,
    isLoading,
  } = useProductSearch(handleSearchSelect, products, handleScanAndAddToCart);

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);

  // Utility: focus search bar (same as in CartTable)
  const focusSearchBar = useCallback(() => {
    requestAnimationFrame(() => {
      const ps = document.querySelector<HTMLInputElement>('[data-product-search="true"]');
      ps?.focus();
      ps?.select?.();
    });
  }, []);

  // Add effect to handle product added event
  useEffect(() => {
    const handleProductAdded = () => {
      // Clear search and refocus search bar when product is added
      clearSearch();
      setTimeout(() => {
        try {
          productSearchInputRef.current?.focus();
          productSearchInputRef.current?.select?.();
        } catch {}
      }, 100);
    };

    window.addEventListener("product:added", handleProductAdded);
    return () => window.removeEventListener("product:added", handleProductAdded);
  }, [clearSearch]);

  // Flag to prevent focusing search when user triggers "edit price"
  const priceEditRequestedRef = useRef(false);
  useEffect(() => {
    const onEditRequest = () => {
      priceEditRequestedRef.current = true;
      setTimeout(() => (priceEditRequestedRef.current = false), 600);
    };
    window.addEventListener("cart:edit-price", onEditRequest);
    return () => window.removeEventListener("cart:edit-price", onEditRequest);
  }, []);

  // Focus search on step change
  useEffect(() => {
    if (step === 2 || step === 3) {
      productSearchInputRef.current?.blur();
      return;
    }
    setTimeout(() => {
      try {
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      } catch {}
    }, 100);
  }, [step]);

  // F2 shortcut → refocus search
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (step === 1 && e.key === "F2") {
        e.preventDefault();
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [step]);

  // Selection events
  useEffect(() => {
    const selectNext = () => {
      if (!cart.length) return;
      const idx = cart.findIndex((c) => c.id === selectedRowId);
      const nextIdx = idx < 0 ? 0 : Math.min(cart.length - 1, idx + 1);
      const id = cart[nextIdx]?.id;
      if (id) selectRow(id);
    };

    const selectPrev = () => {
      if (!cart.length) return;
      const idx = cart.findIndex((c) => c.id === selectedRowId);
      const prevIdx = idx <= 0 ? 0 : idx - 1;
      const id = cart[prevIdx]?.id;
      if (id) selectRow(id);
    };

    const onItemDeleted = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const nextId: string | null = detail.nextSelectedId ?? null;
      if (nextId) {
        selectRow(nextId);
      } else if (cart.length > 0) {
        selectRow(cart[0].id);
      } else {
        clearSelection();
      }
    };

    window.addEventListener("cart:select-next", selectNext);
    window.addEventListener("cart:select-prev", selectPrev);
    window.addEventListener("cart:item-deleted", onItemDeleted);
    return () => {
      window.removeEventListener("cart:select-next", selectNext);
      window.removeEventListener("cart:select-prev", selectPrev);
      window.removeEventListener("cart:item-deleted", onItemDeleted);
    };
  }, [cart, selectedRowId, selectRow]);

  // Cash input focus shortcut
  useEffect(() => {
    const onFocusCash = () => {
      const el =
        document.querySelector<HTMLInputElement>('[data-pos-cash-input="true"]') ||
        document.querySelector<HTMLInputElement>('input[placeholder="0.00"]');
      el?.focus();
      el?.select?.();
    };
    window.addEventListener("cart:focus-cash", onFocusCash);
    return () => window.removeEventListener("cart:focus-cash", onFocusCash);
  }, []);

  async function handleScanAndAddToCart(barcode: string) {
    const clean = (v: string | null | undefined) =>
      v == null ? "" : String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    const normalizeBarcode = (bc: string) => bc.replace(/^0+/, "") || "0";
    const cleaned = clean(barcode);
    if (!cleaned || cleaned.length < 2) return;

    const cleanedNormalized = normalizeBarcode(cleaned);
    
    console.log('Scanning barcode:', cleaned); // Add debug log

    const foundProduct = products.find((p) => {
      const productBarcode = clean(p?.barcode);
      if (!productBarcode) return false;
      return (
        productBarcode === cleaned || normalizeBarcode(productBarcode) === cleanedNormalized
      );
    });

    if (foundProduct) {
      console.log('Product found locally:', foundProduct.name); // Add debug log
      await scanAndAddToCart(cleaned, foundProduct);
      return;
    }

    try {
      console.log('Checking server for barcode:', cleaned); // Add debug log
      const serverProduct = await productApi.getByBarcode(cleaned);
      if (serverProduct) {
        console.log('Product found on server:', serverProduct.name); // Add debug log
        await scanAndAddToCart(cleaned, serverProduct);
        return;
      }
    } catch (error) {
      console.log('Server check failed:', error); // Add debug log
    }

    console.log('Product not found, showing register dialog for:', cleaned); // Add debug log
    setUnregisteredBarcode(cleaned);
    setShowRegisterDialog(true);
  }

  function handleRegisterProduct(barcode: string) {
    setShowRegisterDialog(false);
    setBarcode(barcode);
    setOpen(true);
  }

  function handleSearchSelect(product: any) {
    try {
      const addedId = addProductToCart(product);
      clearSearch();
      if (addedId) selectRow(addedId);

      setTimeout(() => {
        if (priceEditRequestedRef.current && addedId) {
          window.dispatchEvent(
            new CustomEvent("cart:edit-price", { detail: { id: addedId } })
          );
          priceEditRequestedRef.current = false;
          return;
        }
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      }, 50);
    } catch {
      clearSearch();
      setTimeout(() => {
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      }, 50);
    }
  }

  return (
    <div className="relative w-full h-full">
      <Card className="w-full h-full flex flex-col">
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'} flex-1 flex flex-col min-h-0`}>
          <ProductSearch
            inputRef={productSearchInputRef}
            searchQuery={searchQuery}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            handleSearchChange={handleSearchChange}
            handleSearchSelect={handleSearchSelect}
            clearSearch={clearSearch}
            disabled={step === 2 || step === 3}
            isScannerInputRef={isScannerInputRef}
            isLoading={isLoading}
            onAddProduct={handleAddProduct}
          />
          {isLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 p-3 text-center text-gray-500">
              Searching...
            </div>
          )}
          <div className={`rounded-md border flex-1 overflow-auto ${isMobile ? 'max-h-96' : ''}`}>
            <CartTable
              cart={cart}
              selectedRowId={selectedRowId}
              selectRow={selectRow}
              updateCartItemQuantity={updateCartItemQuantity}
              updateCartItemPrice={updateCartItemPrice}
              deleteCartItem={deleteCartItem}
              disabled={step === 2 || step === 3}
            />
          </div>
        </CardContent>
        
        {/* Mobile Next Button */}
        {isMobile && (
          <CardFooter className=" ">
            <Button
              className="w-full h-12 text-lg font-medium"
              onClick={onMobileNext}
              disabled={cart.length === 0}
            >
              Next ({cart.length} item{cart.length !== 1 ? 's' : ''})
            </Button>
          </CardFooter>
        )}
      </Card>
      
      <ProductRegisterModal />
      <AlertDialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-red-600">
              Product Not Found
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              The scanned barcode <span className="font-bold">{unregisteredBarcode}</span> is not registered in the system.
              <br /><br />
              Would you like to register this product now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setShowRegisterDialog(false);
                setUnregisteredBarcode(null);
                // Focus search bar after modal closes
                setTimeout(() => {
                  focusSearchBar();
                }, 100); // Small delay to ensure modal is fully closed
              }}
              className="px-4 py-2"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (unregisteredBarcode) {
                  handleRegisterProduct(unregisteredBarcode);
                }
              }}
              className="px-4 py-2 "
            >
              Register Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
