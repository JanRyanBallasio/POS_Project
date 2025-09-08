// ...existing code...
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
  } = useCart();
  
  const { barcodeInput, inputRef, handleBarcodeChange, handleKeyPress, refocusScanner: hookRefocus } =
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
    } else {
      // Re-focus when returning to step 1
      setTimeout(() => {
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [step]);

  const handleSearchSelect = (product: any) => {
    addProductToCart(product);
    clearSearch();
    hookRefocus();
  };

  async function handleScanAndAddToCart(barcode: string) {
    console.log("🔍 Frontend: Starting barcode scan process for:", barcode);
    
    const clean = (v: string | null | undefined) => (v == null ? "" : String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim());
    const cleaned = clean(barcode);
    console.log("🧹 Frontend: Cleaned barcode:", cleaned);

    if (!cleaned || cleaned.length < 2) {
      console.log("❌ Frontend: Invalid barcode length");
      return;
    }

    const normalizeBarcode = (bc: string) => {
      return bc.replace(/^0+/, '') || '0';
    };

    const cleanedNormalized = normalizeBarcode(cleaned);
    console.log("🔢 Frontend: Normalized barcode:", cleanedNormalized);

    // 1) Try local cache with multiple comparison strategies
    const foundProduct = products.find((p) => {
      const productBarcode = clean(p?.barcode);
      
      if (!productBarcode) return false;
      
      if (productBarcode === cleaned) {
        console.log(`✅ Frontend: EXACT MATCH found: ${p.name}`);
        return true;
      }
      
      if (normalizeBarcode(productBarcode) === cleanedNormalized) {
        console.log(`✅ Frontend: NORMALIZED MATCH found: ${p.name}`);
        return true;
      }
      
      return false;
    });

    if (foundProduct) {
      console.log("✅ Frontend: Found product in cache:", foundProduct);
      await scanAndAddToCart(cleaned, foundProduct);
      return;
    }

    console.log("❌ Frontend: Product not found in cache, trying server lookup...");

    // 2) Fallback to server lookup
    try {
      const serverProduct = await productApi.getByBarcode(cleaned);
      if (serverProduct) {
        console.log("✅ Frontend: Found product on server:", serverProduct);
        await scanAndAddToCart(cleaned, serverProduct);
        return;
      }
    } catch (error) {
      console.log("❌ Frontend: Server lookup failed:", error);
    }

    // 3) Product not found -> prompt to register
    console.log("❌ Frontend: Product not found anywhere, showing register dialog");
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

      <Card
        className="w-full h-full flex flex-col"
        onClick={handleRefocus}
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
            refocusScanner={hookRefocus}
            disabled={step === 2 || step === 3}
          />
          <div className="rounded-md border flex-1 flex flex-col min-h-0 overflow-auto relative">
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
// ...existing code...