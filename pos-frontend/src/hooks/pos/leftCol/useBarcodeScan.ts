import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useBarcodeScan(onScan)
 * - onScan may be sync or async
 * - returns handlers and inputRef used by BarcodeScannerInput
 */
export function useBarcodeScan(onScan: (barcode: string) => void | Promise<void>) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // prevent double processing: simple lock + cooldown
  const processingRef = useRef(false);
  const COOLDOWN_MS = 200;
  const SCAN_DEBOUNCE_MS = 100; // Prevent accidental double scans
  let lastScanTime = 0;
  useEffect(() => {
    try {
      inputRef.current?.focus();
    } catch { }
  }, []);

  const runScan = async (raw: string) => {
    const now = Date.now();
    if (now - lastScanTime < SCAN_DEBOUNCE_MS) return;
    lastScanTime = now;

    const clean = String(raw).replace(/[\n\r\t]/g, "").trim();
    if (!clean || clean.length < 2) return; // Minimum barcode length
    if (processingRef.current) return;

    processingRef.current = true;
    try {
      await Promise.resolve(onScan(clean));
    } catch (error) {
      // Log errors for debugging but don't throw
      console.warn('[useBarcodeScan] Scan error:', error);
    } finally {
      try {
        if (inputRef.current) {
          inputRef.current.value = "";
          inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } catch { }
      setTimeout(() => {
        processingRef.current = false;
        try { inputRef.current?.focus(); } catch { }
      }, COOLDOWN_MS);
    }
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);

    if (value.includes("\n") || value.includes("\r")) {
      const cleanBarcode = value.replace(/[\n\r]/g, "").trim();
      if (cleanBarcode) void runScan(cleanBarcode);
      setBarcodeInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = barcodeInput.trim();
      if (val) {
        void runScan(val);
        setBarcodeInput("");
      }
    }
  };

  const refocusScanner = () => {
    try { inputRef.current?.focus(); } catch { }
  };

  const reset = useCallback(() => {
    setBarcodeInput("");
    try {
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.focus();
      }
    } catch { }
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