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
// import EnhancedBarcodeScanner from '@/components/pos/EnhancedBarcodeScanner';

interface POSLeftColProps {
  step: 1 | 2 | 3;
}

export default function POSLeftCol({ step }: POSLeftColProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const { selectedRowId, selectRow, clearSelection } = useCartSelection<string>();
  const { products } = useProducts();
  const {
    cart,
    updateCartItemQuantity,
    scanAndAddToCart,
    addProductToCart,
    updateCartItemPrice,
    deleteCartItem,
    scanError,
    setScanError,
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
        } catch (error) {
          console.warn('Failed to focus search input:', error);
        }
      }, 100);
    },
    [addProductToCart]
  );

  const handleScanAndAddToCart = useCallback(
    async (barcode: string) => {
      console.log('🔍 DEBUG - handleScanAndAddToCart called with:', barcode);
      
      try {
        await scanAndAddToCart(barcode);
        console.log('🔍 DEBUG - scanAndAddToCart completed');
        
        setTimeout(() => {
          try {
            productSearchInputRef.current?.focus();
            productSearchInputRef.current?.select?.();
          } catch (error) {
            console.warn('Failed to focus search input:', error);
          }
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

  // STATE DECLARATIONS - Move these before any useEffect that uses them
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);

  // Add comprehensive debugging - NOW AFTER state declarations
  useEffect(() => {
    console.log('🔍 DEBUG - Modal state changed:', { 
      showRegisterDialog, 
      unregisteredBarcode, 
      scanError,
      timestamp: new Date().toISOString()
    });
  }, [showRegisterDialog, unregisteredBarcode, scanError]);

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
        } catch (error) {
          console.warn('Failed to focus search input:', error);
        }
      }, 100);
    };

    window.addEventListener("product:added", handleProductAdded);
    return () => window.removeEventListener("product:added", handleProductAdded);
  }, [clearSearch]);

  // Handle unregistered barcode
  const handleUnregisteredBarcode = useCallback((barcode: string) => {
    console.log('🔍 DEBUG - handleUnregisteredBarcode called with:', barcode);
    console.log('🔍 DEBUG - Current state before setting:', { 
      showRegisterDialog, 
      unregisteredBarcode, 
      scanError 
    });
    
    setUnregisteredBarcode(barcode);
    setShowRegisterDialog(true);
    
    console.log('🔍 DEBUG - State setters called, modal should show');
  }, []);

  // ✅ FIXED: Listen for unregistered barcode events from cart-context
  useEffect(() => {
    const handleUnregisteredBarcodeEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      console.log('🔍 DEBUG - Unregistered barcode event received:', detail);
      console.log('🔍 DEBUG - Current modal state before handling:', { 
        showRegisterDialog, 
        unregisteredBarcode, 
        scanError 
      });
      
      if (detail?.barcode) {
        console.log('🔍 DEBUG - Calling handleUnregisteredBarcode with:', detail.barcode);
        handleUnregisteredBarcode(detail.barcode);
      }
    };

    console.log('🔍 DEBUG - Setting up unregistered barcode event listener');
    window.addEventListener("unregistered-barcode", handleUnregisteredBarcodeEvent);
    return () => {
      console.log('🔍 DEBUG - Removing unregistered barcode event listener');
      window.removeEventListener("unregistered-barcode", handleUnregisteredBarcodeEvent);
    };
  }, [handleUnregisteredBarcode, showRegisterDialog, unregisteredBarcode, scanError]);

  // Handle register dialog close
  const handleRegisterDialogClose = useCallback(() => {
    console.log('🔍 DEBUG - Modal close button clicked');
    console.log('🔍 DEBUG - Current state before close:', { 
      showRegisterDialog, 
      unregisteredBarcode, 
      scanError 
    });
    
    setShowRegisterDialog(false);
    setUnregisteredBarcode(null);
    setScanError(null);
    
    console.log('🔍 DEBUG - Modal closed, all states cleared');
    
    setTimeout(() => {
      try {
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      } catch (error) {
        console.warn('Operation failed:', error);
      }
    }, 100);
  }, [setScanError]);

  // ✅ FIXED: Handle register dialog confirm - now opens the modal
  const handleRegisterDialogConfirm = useCallback(() => {
    console.log('🔍 DEBUG - Modal confirm button clicked');
    console.log('🔍 DEBUG - Current state before confirm:', { 
      showRegisterDialog, 
      unregisteredBarcode, 
      scanError 
    });
    
    setShowRegisterDialog(false);
    if (unregisteredBarcode) {
      setBarcode(unregisteredBarcode);
      setOpen(true);
    }
    setUnregisteredBarcode(null);
    setScanError(null);
    
    console.log('🔍 DEBUG - Modal confirmed, opening product register modal');
    
    setTimeout(() => {
      try {
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select?.();
      } catch (error) {
        console.warn('Operation failed:', error);
      }
    }, 100);
  }, [unregisteredBarcode, setBarcode, setOpen, setScanError]);

  // Add this effect to clear scan error when search changes
  useEffect(() => {
    if (scanError) {
      setScanError(null);
    }
  }, [searchQuery, scanError, setScanError]);

  // Also add a debug effect to see what's happening
  useEffect(() => {
    console.log('Modal state changed:', { showRegisterDialog, unregisteredBarcode, scanError });
  }, [showRegisterDialog, unregisteredBarcode, scanError]);

  useEffect(() => {
    if (showRegisterDialog) {
      console.log('🔍 DEBUG - Modal should be visible now!');
      console.log('🔍 DEBUG - Checking DOM for AlertDialog...');
      
      // Check if the modal is actually in the DOM
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"]');
        console.log('🔍 DEBUG - Modal in DOM:', modal);
        console.log('🔍 DEBUG - Modal visible:', modal?.getAttribute('aria-hidden'));
      }, 100);
    }
  }, [showRegisterDialog]);



  // ZXing continuous decode with explicit hints
  useEffect(() => {
    if (!isCameraOpen) return;

    let cancelled = false;
    let reader: any = null;
    let decodedOnce = false;
    let notFoundCount = 0;
    let fallbackStarted = false;

    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
        ]);

        reader = new BrowserMultiFormatReader(hints);

        const video = videoRef.current;
        if (!video) return;

        video.setAttribute("playsinline", "true");
        video.autoplay = true;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices().catch(() => []);
        const preferred =
          Array.isArray(devices) && devices.find(d => /back|rear|environment|external/i.test(d.label)) || devices[0];
        const deviceId = preferred?.deviceId;

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: { ideal: "environment" as any }, width: { ideal: 1280 }, height: { ideal: 720 } },
        };
        console.log("[ZXing] using constraints:", constraints);

        const onResult = async (result: any, err: any) => {
          if (cancelled) return;

          if (result) {
            decodedOnce = true;
            const raw = String(result.getText?.() ?? "");
            const cleaned = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
            const numeric = cleaned.replace(/\s+/g, "").replace(/[^0-9]/g, "");
            const valueToUse = numeric.length >= 8 ? numeric : cleaned;

            const now = Date.now();
            if (valueToUse && (lastScanRef.current.value !== valueToUse || now - lastScanRef.current.at > 2000)) {
              lastScanRef.current = { value: valueToUse, at: now };
              console.log("[ZXing] decoded:", valueToUse);
              await handleScanAndAddToCart(valueToUse);
              setIsCameraOpen(false);
              try { reader?.reset?.(); } catch {}
            }
          } else if (err) {
            if (err.name === "NotFoundException") {
              notFoundCount++;
              if (notFoundCount % 50 === 0) {
                // Throttled log every ~50 frames with no barcode
                const vw = video.videoWidth, vh = video.videoHeight;
                console.log(`[ZXing] still searching… notFound=${notFoundCount}, video=${vw}x${vh}, readyState=${video.readyState}`);
              }
            } else {
              console.warn("[ZXing] error:", err);
            }
          }
        };

        console.log("[ZXing] starting decode loop");
        reader.decodeFromConstraints(constraints, video, onResult);

        // Watchdog: if no decode within 5s, fallback to decodeFromVideoDevice
        setTimeout(() => {
          if (!decodedOnce && !cancelled && !fallbackStarted) {
            fallbackStarted = true;
            console.log("[ZXing] no decode after 5s; falling back to decodeFromVideoDevice()");
            try { reader?.reset?.(); } catch {}
            reader.decodeFromVideoDevice(deviceId, video, onResult);
          }
        }, 5000);
      } catch (e) {
        console.warn("[ZXing] setup failed:", e);
      }
    };

    start();

    return () => {
      cancelled = true;
      try { reader?.reset?.(); } catch {}
      console.log("[ZXing] stopped");
    };
  }, [isCameraOpen, handleScanAndAddToCart]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <Card className="flex flex-col flex-1 h-full overflow-hidden">
        <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
          {/* Search */}
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
            onOpenCamera={() => setIsCameraOpen(true)}
          />

          

          {/* Show scan error if any */}
          {scanError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 text-sm">{scanError}</span>
                <button
                  onClick={() => {/* Error will auto-clear on next search */}}
                  className="ml-auto text-red-500 hover:text-red-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Enhanced camera scanner - COMMENTED OUT FOR TESTING */}
          {/* <EnhancedBarcodeScanner
            onScan={handleCameraScan}
            onError={handleCameraError}
            isActive={isCameraActive}
            onToggle={() => setIsCameraActive(!isCameraActive)}
            className="mb-4"
          /> */}

          {isLoading && (
            <div className="text-center text-gray-500 py-4">
              Searching...
            </div>
          )}
          {/* Cart list: make it fill and scroll */}
          <div className="flex-1 overflow-auto">
            <CartTable
              cart={cart}
              selectedRowId={selectedRowId}
              selectRow={selectRow}
              updateCartItemQuantity={updateCartItemQuantity}
              updateCartItemPrice={updateCartItemPrice}
              deleteCartItem={deleteCartItem}
              disabled={step !== 1}
            />
          </div>
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

      {/* Camera modal */}
      <div className={isCameraOpen ? "" : "hidden"}>
        <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setIsCameraOpen(false)} />
        <div className="fixed inset-x-4 bottom-8 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:w-[480px] z-50 rounded-lg overflow-hidden bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-medium">Camera Scanner</div>
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-gray-900"
              onClick={() => setIsCameraOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="bg-black">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-[280px] object-contain"
            />
            {/* Hidden canvas used for detection */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="p-3 text-xs text-gray-600">
            Point the barcode straight-on, steady, and well-lit. Avoid glare and motion blur.
          </div>
        </div>
      </div>

      {/* Product Register Modal */}
      <ProductRegisterModal />
    </div>
  );
}
