import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/cart-context";
import { useCartSelection } from "@/hooks/poss/leftCol/useCartSelection";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useBarcodeScan } from "@/hooks/poss/leftCol/useBarcodeScan";
import { useProductSearch } from "@/hooks/poss/leftCol/useProductsSearch";
import { useCartKeyboard } from "@/contexts/cart-context";
import { useEffect } from "react";
import CartTable from "./CartTable";
import ProductSearch from "./ProductSearch";
import BarcodeScannerInput from "./BarcodeScannerInput";

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
  } = useCart();
  const { barcodeInput, inputRef, handleBarcodeChange, handleKeyPress } =
    useBarcodeScan(scanAndAddToCart);

  useCartKeyboard(selectedRowId);

  const {
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearchChange,
    clearSearch,
  } = useProductSearch(products);

  useEffect(() => {
    setScannerRef(inputRef as React.RefObject<HTMLInputElement>);
  }, [setScannerRef, inputRef]);

  useEffect(() => {
    if (step === 2 || step === 3) {
      // Cancel/clear scanning here
      if (inputRef?.current) inputRef.current.blur();
      // If you have a barcodeInput state:
      // setBarcodeInput("");
    }
  }, [step]);

  const handleSearchSelect = (product: any) => {
    scanAndAddToCart(product.barcode || "");
    clearSearch();
    refocusScanner();
  };

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
              disabled={step === 2 || step === 3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
