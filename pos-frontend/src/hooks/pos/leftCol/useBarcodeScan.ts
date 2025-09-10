import { useState, useRef, useCallback } from "react";

export function useBarcodeScan(onScan: (barcode: string) => void | Promise<void>) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const processingRef = useRef(false);
  const lastProcessedBarcode = useRef<string>("");
  const lastProcessedTime = useRef<number>(0);

  // ⚡ Faster timings
  const COOLDOWN_MS = 20;          // was 50
  const SCAN_DEBOUNCE_MS = 80;     // was 150
  const DUPLICATE_PREVENT_MS = 400; // was 500

  const runScan = useCallback(
    async (raw: string) => {
      const now = Date.now();
      const clean = String(raw).replace(/[\n\r\t]/g, "").trim();

      if (!clean || clean.length < 2) return;
      if (processingRef.current) return;

      if (
        clean === lastProcessedBarcode.current &&
        now - lastProcessedTime.current < DUPLICATE_PREVENT_MS
      ) {
        return;
      }

      processingRef.current = true;
      lastProcessedBarcode.current = clean;
      lastProcessedTime.current = now;

      try {
        await Promise.resolve(onScan(clean));
      } catch (err) {
        console.warn("[useBarcodeScan] scan error:", err);
      } finally {
        setBarcodeInput("");
        requestAnimationFrame(() => {
          processingRef.current = false;
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        });
      }
    },
    [onScan]
  );

  const handleBarcodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setBarcodeInput(value);

      if (value.includes("\n") || value.includes("\r")) {
        void runScan(value.replace(/[\n\r]/g, "").trim());
        return;
      }

      setTimeout(() => {
        if (e.target.value === value && value.trim().length >= 3) {
          void runScan(value);
        }
      }, SCAN_DEBOUNCE_MS);
    },
    [runScan]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = barcodeInput.trim();
        if (val) {
          void runScan(val);
        }
      }
    },
    [barcodeInput, runScan]
  );

  return {
    barcodeInput,
    inputRef,
    handleBarcodeChange,
    handleKeyPress,
  };
}
