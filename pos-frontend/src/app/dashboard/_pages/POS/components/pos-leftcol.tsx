import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import { Product } from "@/lib/api";

import { useCart } from "@/contexts/cart-context";

import { useProducts } from "@/hooks/products/useProducts";
import { useBarcodeScan } from "@/hooks/products/useBarcodeScan";
import { useProductSearch } from "@/hooks/products/useProductsSearch";
import { useEffect } from "react";

export default function POSLeftCol() {
  const { products } = useProducts();
  const {
    cart,
    scanError,
    isScanning,
    scanAndAddToCart,
    setScannerRef,
    refocusScanner,
  } = useCart();
  const { barcodeInput, inputRef, handleBarcodeChange, handleKeyPress } =
    useBarcodeScan(scanAndAddToCart);

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
  const handleSearchSelect = (product: Product) => {
    scanAndAddToCart(product.barcode || "");
    clearSearch();
    refocusScanner();
  };

  const renderCartContent = () => {
    if (cart.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
            🛒 Scan items to add to cart
          </TableCell>
        </TableRow>
      );
    }

    return cart.map((item) => (
      <TableRow key={item.id} className="hover:bg-gray-50">
        <TableCell className="font-medium">
          {item.product.barcode || "N/A"}
        </TableCell>
        <TableCell>{item.product.name}</TableCell>
        <TableCell>₱ {item.product.price.toFixed(2)}</TableCell>
        <TableCell>{item.quantity}</TableCell>
        <TableCell>₱ 0.00</TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="w-full h-full" onClick={() => refocusScanner()}>
      <CardContent className="p-6">
        {/* Hidden scanner input - automatic scanning */}
        <Input
          ref={inputRef}
          className="opacity-0 absolute -top-1000"
          value={barcodeInput}
          onChange={handleBarcodeChange}
          onKeyPress={handleKeyPress}
          placeholder="Scanner input..."
        />

        {/* Manual search input */}
        <div className="relative mb-6">
          <div className="relative flex items-center">
            <Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              className="pl-9 w-full"
              placeholder="Search by product name or barcode..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onBlur={refocusScanner}
            />
          </div>

          {/* Search results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSearchSelect(product)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Barcode: {product.barcode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ₱ {product.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {showSearchResults &&
            searchResults.length === 0 &&
            searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 p-3 text-center text-gray-500">
                No products found matching "{searchQuery}"
              </div>
            )}
        </div>

        {/* Cart table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-lg font-semibold">Barcode</TableHead>
                <TableHead className="text-lg font-semibold">Name</TableHead>
                <TableHead className="text-lg font-semibold">Price</TableHead>
                <TableHead className="text-lg font-semibold">
                  Quantity
                </TableHead>
                <TableHead className="text-lg font-semibold">
                  Discount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderCartContent()}</TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
