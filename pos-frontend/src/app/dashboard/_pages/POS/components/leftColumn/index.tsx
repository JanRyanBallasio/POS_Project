import { Card, CardContent } from "@/components/ui/card";
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
}

export default function POSLeftCol({ step }: POSLeftColProps) {
  const { selectedRowId, selectRow, clearSelection } = useCartSelection<string>();
  const { products } = useProducts();
  const {
    cart,
    updateCartItemQuantity,
    scanAndAddToCart,
    addProductToCart,
    updateCartItemPrice,
    deleteCartItem,
  } = useCart();

  const { setOpen, setBarcode } = useProductModal();

  useCartKeyboard(selectedRowId);

  const productSearchInputRef = useRef<HTMLInputElement>(null!);

  // Utility: focus search bar (same as in CartTable)
  const focusSearchBar = useCallback(() => {
    requestAnimationFrame(() => {
      const ps = document.querySelector<HTMLInputElement>('[data-product-search="true"]');
      ps?.focus();
      ps?.select?.();
    });
  }, []);

  // Flag to prevent focusing search when user triggers "edit price"
  const priceEditRequestedRef = useRef(false);

  // CRITICAL: Listen for focusBarcodeScanner event from pos-screen.tsx
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocusBarcodeScanner = () => {
      if (priceEditRequestedRef.current) return;
      focusSearchBar();
    };

    window.addEventListener("focusBarcodeScanner", handleFocusBarcodeScanner);
    return () => {
      window.removeEventListener("focusBarcodeScanner", handleFocusBarcodeScanner);
    };
  }, [focusSearchBar]);

  // Handle edit price request
  useEffect(() => {
    const onEditRequest = () => {
      priceEditRequestedRef.current = true;
      setTimeout(() => (priceEditRequestedRef.current = false), 600);
    };
    window.addEventListener("cart:edit-price", onEditRequest);
    return () => window.removeEventListener("cart:edit-price", onEditRequest);
  }, []);

  // DECLARE FUNCTIONS FIRST before using them in useProductSearch
  const handleSearchSelect = useCallback(
    (product: any) => {
      addProductToCart(product);
      // clearSearch will be called by the useProductSearch hook
      setTimeout(() => {
        try {
          productSearchInputRef.current?.focus();
          productSearchInputRef.current?.select?.();
        } catch {}
      }, 100);
    },
    [addProductToCart]
  );

  const handleScanAndAddToCart = useCallback(
    async (barcode: string) => {
      try {
        await scanAndAddToCart(barcode);
        // clearSearch will be called by the useProductSearch hook
        setTimeout(() => {
          try {
            productSearchInputRef.current?.focus();
            productSearchInputRef.current?.select?.();
          } catch {}
        }, 100);
      } catch (error) {
        console.error("Scan error:", error);
      }
    },
    [scanAndAddToCart]
  );

  const {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearchChange,
    clearSearch,
    isScannerInputRef,
    isLoading,
    handleDebugProductSelect,
    isDebugCheatCode,
  } = useProductSearch(handleSearchSelect, products, handleScanAndAddToCart);

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);

  // Add this function
  const handleAddProduct = () => {
    setBarcode(searchQuery); // Pre-fill with the search query
    setOpen(true);
  };

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

  // Handle unregistered barcode
  const handleUnregisteredBarcode = useCallback((barcode: string) => {
    setUnregisteredBarcode(barcode);
    setShowRegisterDialog(true);
  }, []);

  // Handle register dialog close
  const handleRegisterDialogClose = useCallback(() => {
    setShowRegisterDialog(false);
    setUnregisteredBarcode(null);
    setTimeout(() => {
      try {
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      } catch {}
    }, 100);
  }, []);

  // Handle register dialog confirm
  const handleRegisterDialogConfirm = useCallback(() => {
    setShowRegisterDialog(false);
    setUnregisteredBarcode(null);
    setTimeout(() => {
      try {
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      } catch {}
    }, 100);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col">
          <ProductSearch
            searchQuery={searchQuery}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            handleSearchChange={handleSearchChange}
            handleSearchSelect={handleSearchSelect}
            clearSearch={clearSearch}
            disabled={step !== 1}
            inputRef={productSearchInputRef}
            isScannerInputRef={isScannerInputRef}
            isLoading={isLoading}
            onAddProduct={handleAddProduct}
            handleDebugProductSelect={handleDebugProductSelect}
            isDebugCheatCode={isDebugCheatCode}
          />
          {isLoading && (
            <div className="text-center text-gray-500 py-4">
              Searching...
            </div>
          )}
          <CartTable
            cart={cart}
            selectedRowId={selectedRowId}
            selectRow={selectRow}
            updateCartItemQuantity={updateCartItemQuantity}
            updateCartItemPrice={updateCartItemPrice}
            deleteCartItem={deleteCartItem}
            disabled={step !== 1}
          />
        </CardContent>
      </Card>

      {/* Unregistered Barcode Dialog */}
      <AlertDialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Product Not Found</AlertDialogTitle>
            <AlertDialogDescription>
              The barcode "{unregisteredBarcode}" is not registered in the system. 
              Would you like to add this product?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRegisterDialogClose}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRegisterDialogConfirm}>
              Add Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Register Modal */}
      <ProductRegisterModal />
    </div>
  );
}
