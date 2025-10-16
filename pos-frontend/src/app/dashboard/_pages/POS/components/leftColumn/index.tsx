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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
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
    if (!isCameraOpen) {
      setCameraError(null);
      setCameraLoading(false);
      return;
    }

    let cancelled = false;
    let reader: any = null;
    let decodedOnce = false;
    let notFoundCount = 0;
    let fallbackStarted = false;

    const start = async () => {
      setCameraLoading(true);
      setCameraError(null);

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
          BarcodeFormat.QR_CODE,
        ]);

        reader = new BrowserMultiFormatReader(hints);

        const video = videoRef.current;
        if (!video) {
          setCameraError("Video element not found");
          setCameraLoading(false);
          return;
        }

        // Set video attributes for mobile compatibility (especially iOS)
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true"); // For older iOS devices
        video.setAttribute("autoplay", "true");
        video.setAttribute("muted", "true");
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        // Get available cameras
        const devices = await BrowserMultiFormatReader.listVideoInputDevices().catch(() => []);
        console.log("[ZXing] Available cameras:", devices);

        if (devices.length === 0) {
          setCameraError("No camera found. Please check camera permissions.");
          setCameraLoading(false);
          return;
        }

        // Prefer rear/back camera for mobile
        const preferred =
          devices.find(d => /back|rear|environment|external/i.test(d.label)) || devices[devices.length - 1];
        const deviceId = preferred?.deviceId;

        console.log("[ZXing] Selected camera:", preferred?.label || "Default");

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId
            ? {
                deviceId: { ideal: deviceId }, // Use 'ideal' instead of 'exact' for better compatibility
                facingMode: { ideal: "environment" },
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 }
              }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 }
              },
        };
        console.log("[ZXing] using constraints:", constraints);

        const onResult = async (result: any, err: any) => {
          if (cancelled) return;

          if (result) {
            decodedOnce = true;
            setCameraLoading(false); // Camera is working
            const raw = String(result.getText?.() ?? "");
            const cleaned = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
            const numeric = cleaned.replace(/\s+/g, "").replace(/[^0-9]/g, "");
            const valueToUse = numeric.length >= 8 ? numeric : cleaned;

            const now = Date.now();
            if (valueToUse && (lastScanRef.current.value !== valueToUse || now - lastScanRef.current.at > 2000)) {
              lastScanRef.current = { value: valueToUse, at: now };
              console.log("[ZXing] ✅ Barcode decoded:", valueToUse);

              // Visual feedback
              if (video) {
                video.style.filter = "brightness(1.5)";
                setTimeout(() => {
                  if (video) video.style.filter = "";
                }, 200);
              }

              await handleScanAndAddToCart(valueToUse);
              setIsCameraOpen(false);
              try { reader?.reset?.(); } catch {}
            }
          } else if (err) {
            if (err.name === "NotFoundException") {
              notFoundCount++;
              // Mark camera as ready after first frame
              if (notFoundCount === 1) {
                setCameraLoading(false);
              }
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
        await reader.decodeFromConstraints(constraints, video, onResult);
        console.log("[ZXing] decode loop started successfully");

        // Watchdog: if no decode within 5s, fallback to decodeFromVideoDevice
        setTimeout(() => {
          if (!decodedOnce && !cancelled && !fallbackStarted) {
            fallbackStarted = true;
            console.log("[ZXing] no decode after 5s; falling back to decodeFromVideoDevice()");
            try { reader?.reset?.(); } catch {}
            reader.decodeFromVideoDevice(deviceId, video, onResult);
          }
        }, 5000);
      } catch (e: any) {
        console.error("[ZXing] setup failed:", e);
        setCameraLoading(false);

        // Handle specific errors
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (e.name === "NotFoundError") {
          setCameraError("No camera found on this device.");
        } else if (e.name === "NotReadableError") {
          setCameraError("Camera is being used by another application.");
        } else {
          setCameraError(`Camera error: ${e.message || "Unknown error"}`);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      try {
        reader?.reset?.();
        // Stop all video tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
      } catch (e) {
        console.warn("[ZXing] cleanup error:", e);
      }
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
      {isCameraOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsCameraOpen(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-[520px] z-50 rounded-xl overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="text-base font-semibold text-white">Barcode Scanner</span>
              </div>
              <button
                type="button"
                className="text-white/80 hover:text-white transition-colors"
                onClick={() => setIsCameraOpen(false)}
                aria-label="Close scanner"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-black relative">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-[320px] object-contain"
              />

              {/* Loading overlay */}
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white text-sm">Starting camera...</p>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                  <div className="text-center max-w-xs">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-white text-sm">{cameraError}</p>
                    <button
                      onClick={() => {
                        setCameraError(null);
                        setIsCameraOpen(false);
                      }}
                      className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Scanning overlay - only show when camera is ready */}
              {!cameraLoading && !cameraError && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-blue-500/30"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/3 border-2 border-blue-500 rounded-lg">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                  </div>
                  {/* Scanning line animation */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/3 overflow-hidden rounded-lg">
                    <div className="absolute inset-x-0 h-0.5 bg-blue-500 animate-scan"></div>
                  </div>
                </div>
              )}

              {/* Hidden canvas used for detection */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 text-sm text-gray-700">
                  <p className="font-medium mb-1">Scanning Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Hold barcode steady within the frame</li>
                    <li>• Ensure good lighting (avoid glare)</li>
                    <li>• Keep camera parallel to barcode</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Product Register Modal */}
      <ProductRegisterModal />
    </div>
  );
}
