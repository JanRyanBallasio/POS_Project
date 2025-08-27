// ...existing code...
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/cart-context";
import { useCartSelection } from "@/hooks/pos/leftCol/useCartSelection";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useBarcodeScan } from "@/hooks/pos/leftCol/useBarcodeScan";
import { useProductSearch } from "@/hooks/pos/leftCol/useProductsSearch";
import { useCartKeyboard } from "@/contexts/cart-context";
import { useEffect, useState } from "react";
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
import ProductRegisterModal from "@/components/global/ProductRegisterModal";

import { productApi } from "@/hooks/products/useProductApi";



interface POSLeftColProps {
  step: 1 | 2 | 3;
}

export default function POSLeftCol({ step }: POSLeftColProps) {
  const { selectedRowId, selectRow } = useCartSelection<string>();
  const { products } = useProducts();
  const {
    cart,
    updateCartItemQuantity,
    scanAndAddToCart,
    setScannerRef,
    refocusScanner,
    updateCartItemPrice, // <- added
    deleteCartItem, // <- added
  } = useCart();
  const { barcodeInput, inputRef, handleBarcodeChange, handleKeyPress } =
    useBarcodeScan(handleScanAndAddToCart);
  const { setOpen, setBarcode } = useProductModal();
  useCartKeyboard(selectedRowId);

  const {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearchChange,
    clearSearch,
  } = useProductSearch(products);

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);

  useEffect(() => {
    setScannerRef(inputRef as React.RefObject<HTMLInputElement>);
  }, [setScannerRef, inputRef]);

  useEffect(() => {
    if (step === 2 || step === 3) {
      if (inputRef?.current) inputRef.current.blur();
    }
  }, [step]);

  const handleSearchSelect = (product: any) => {
    scanAndAddToCart(product.barcode || "");
    clearSearch();
    refocusScanner();
  };

  // Modified scanAndAddToCart to handle unregistered products
  // function handleScanAndAddToCart(barcode: string) {
  //   const foundProduct = products.find(p => p.barcode === barcode);
  //   if (foundProduct) {
  //     scanAndAddToCart(barcode);
  //     refocusScanner(); // Refocus after successful scan
  //   } else {
  //     setUnregisteredBarcode(barcode);
  //     setShowRegisterDialog(true);
  //   }
  // }
  async function handleScanAndAddToCart(barcode: string) {
    const clean = (v?: string) => (v == null ? "" : String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim());
    const cleaned = clean(barcode);

    // 1) try local cache (cleaned equality)
    const foundProduct = products.find((p) => clean(p?.barcode) === cleaned);
    if (foundProduct) {
      await scanAndAddToCart(cleaned);
      refocusScanner();
      return;
    }

    // 2) fallback to server lookup (productApi.getByBarcode already cleaned)
    try {
      const serverProduct = await productApi.getByBarcode(cleaned);
      if (serverProduct) {
        await scanAndAddToCart(cleaned);
        refocusScanner();
        return;
      }
    } catch { /* ignore */ }

    // 3) still not found -> prompt to register
    setUnregisteredBarcode(cleaned);
    setShowRegisterDialog(true);
  }
  function handleRegisterProduct(barcode: string) {
    setShowRegisterDialog(false);
    setBarcode(barcode); // <-- set barcode in context
    setOpen(true);       // <-- open modal
  }

  // Pass refocusScanner to ProductRegisterModal so it can reset after adding
  return (
    <div className="relative w-full h-full">
      <Card
        className="w-full h-full flex flex-col"
        onClick={() => refocusScanner()}
      >
        <CardContent className="p-6 flex-1 flex flex-col min-h-0">
          <BarcodeScannerInput
            inputRef={inputRef}
            barcodeInput={barcodeInput}
            handleBarcodeChange={handleBarcodeChange}
            handleKeyPress={handleKeyPress}
            disabled={step === 2 || step === 3}
          />
          <ProductSearch
            searchQuery={searchQuery}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            handleSearchChange={handleSearchChange}
            handleSearchSelect={handleSearchSelect}
            clearSearch={clearSearch}
            refocusScanner={refocusScanner}
            disabled={step === 2 || step === 3}
          />
          <div className="rounded-md border flex-1 flex flex-col min-h-0 overflow-auto relative">
            <CartTable
              cart={cart}
              selectedRowId={selectedRowId}
              selectRow={selectRow}
              updateCartItemQuantity={updateCartItemQuantity}
              updateCartItemPrice={updateCartItemPrice} // <- passed
              deleteCartItem={deleteCartItem} // <- passed
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
// ...existing code...