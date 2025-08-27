import { useState, useEffect, useRef, useCallback } from "react";

export const useBarcodeScan = (onScan: (barcode: string) => void) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);

    if (value.includes("\n") || value.includes("\r")) {
      const cleanBarcode = value.replace(/[\n\r]/g, "").trim();
      if (cleanBarcode) {
        onScan(cleanBarcode);
        setBarcodeInput("");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (barcodeInput.trim()) {
        onScan(barcodeInput.trim());
        setBarcodeInput("");
      }
    }
  };

  const refocusScanner = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const reset = useCallback(() => {
    setBarcodeInput("");
    try {
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.focus();
      }
    } catch {}
  }, []);

  return {
    barcodeInput,
    inputRef,
    handleBarcodeChange,
    handleKeyPress,
    refocusScanner,
    reset,
  };
};