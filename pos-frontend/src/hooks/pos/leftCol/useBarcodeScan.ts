import { useState, useEffect, useRef, useCallback } from "react";

export function useBarcodeScan(onScan: (barcode: string) => void | Promise<void>) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const processingRef = useRef(false);
  const lastProcessedBarcode = useRef<string>("");
  const lastProcessedTime = useRef<number>(0);
  const COOLDOWN_MS = 300;
  const SCAN_DEBOUNCE_MS = 500;
  const DUPLICATE_PREVENT_MS = 1000;

  useEffect(() => {
    const focusInput = () => {
      try {
        if (inputRef.current && !processingRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.warn('Failed to focus scanner input:', error);
      }
    };

    focusInput();

    const handleFocusScanner = () => {
      if (!processingRef.current && inputRef.current) {
        inputRef.current.focus();
        setBarcodeInput('');
      }
    };

    // Updated global key handler - respects customer input
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).contentEditable === 'true'
      );

      // FIXED: Don't interfere with customer search
      const isCustomerSearch = activeElement && (
        (activeElement as HTMLElement).getAttribute('data-customer-search') === 'true' ||
        (activeElement as HTMLInputElement).placeholder?.toLowerCase().includes('search name')
      );

      if (!isTypingInInput && !isCustomerSearch && ((e.key === "0" && e.code === "Numpad0") || e.key === "F5")) {
        e.preventDefault();
        e.stopPropagation();
        handleFocusScanner();
      }
    };

    window.addEventListener('focus', focusInput);
    window.addEventListener('focusBarcodeScanner', handleFocusScanner);
    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });

    return () => {
      window.removeEventListener('focus', focusInput);
      window.removeEventListener('focusBarcodeScanner', handleFocusScanner);
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
  }, []);

  const runScan = async (raw: string) => {
    const now = Date.now();
    const clean = String(raw).replace(/[\n\r\t]/g, "").trim();

    if (!clean || clean.length < 2) return;
    if (processingRef.current) {
      console.log("🔍 Scanner: Already processing, ignoring:", clean);
      return;
    }

    if (clean === lastProcessedBarcode.current &&
      (now - lastProcessedTime.current) < DUPLICATE_PREVENT_MS) {
      console.log("🔍 Scanner: Duplicate scan prevented:", clean);
      return;
    }

    if ((now - lastProcessedTime.current) < SCAN_DEBOUNCE_MS) {
      console.log("🔍 Scanner: Debounce active, ignoring:", clean);
      return;
    }

    processingRef.current = true;
    lastProcessedBarcode.current = clean;
    lastProcessedTime.current = now;

    console.log("🔍 Scanner: Processing barcode:", clean);

    try {
      await Promise.resolve(onScan(clean));
    } catch (error) {
      console.warn('[useBarcodeScan] Scan error:', error);
    } finally {
      setBarcodeInput("");

      setTimeout(() => {
        processingRef.current = false;
        try {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
          }
        } catch (error) {
          console.warn('Failed to reset scanner input:', error);
        }
      }, COOLDOWN_MS);
    }
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);

    if (value.includes("\n") || value.includes("\r")) {
      const cleanBarcode = value.replace(/[\n\r]/g, "").trim();
      if (cleanBarcode) {
        void runScan(cleanBarcode);
      }
      setBarcodeInput("");
      return;
    }

    setTimeout(() => {
      if (e.target.value === value && value.trim() && value.length >= 3) {
        void runScan(value);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation(); // <-- prevent global handler
      const val = barcodeInput.trim();
      if (val) {
        void runScan(val);
      }
    }
  };

  const refocusScanner = useCallback(() => {
    try {
      if (inputRef.current && !processingRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    } catch (error) {
      console.warn('Failed to refocus scanner:', error);
    }
  }, []);

  const reset = useCallback(() => {
    setBarcodeInput("");
    lastProcessedBarcode.current = "";
    lastProcessedTime.current = 0;
    try {
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.focus();
      }
    } catch (error) {
      console.warn('Failed to reset scanner:', error);
    }
  }, []);

  return {
    barcodeInput,
    inputRef,
    handleBarcodeChange,
    handleKeyPress,
    refocusScanner,
    reset,
    isProcessing: () => processingRef.current,
  };
}