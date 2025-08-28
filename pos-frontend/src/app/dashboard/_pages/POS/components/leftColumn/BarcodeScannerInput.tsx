import { Input } from "@/components/ui/input";
import React, { useEffect } from "react";

interface BarcodeScannerInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  barcodeInput: string;
  handleBarcodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export default function BarcodeScannerInput({
  inputRef,
  barcodeInput,
  handleBarcodeChange,
  handleKeyPress,
  disabled = false,
}: BarcodeScannerInputProps) {
  useEffect(() => {
    const onProductAdded = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      // if sender asked to prevent focusing (e.g., product added from Products tab), do nothing
      if (detail?.preventScan) return;

      const el = inputRef?.current;
      if (!el) return;

      try {
        el.focus();
      } catch {}

      // clear DOM value so next hardware scan starts fresh
      try {
        el.value = "";
      } catch {}

      const syntheticEvent = { target: el } as unknown as React.ChangeEvent<HTMLInputElement>;
      try {
        handleBarcodeChange(syntheticEvent);
      } catch {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    const onFocusRequest = () => {
      const el = inputRef?.current;
      if (!el) return;
      try {
        el.focus();
      } catch {}
      try {
        el.value = "";
      } catch {}
      const syntheticEvent = { target: el } as unknown as React.ChangeEvent<HTMLInputElement>;
      try {
        handleBarcodeChange(syntheticEvent);
      } catch {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    window.addEventListener("product:added", onProductAdded as EventListener);
    window.addEventListener("focusBarcodeScanner", onFocusRequest as EventListener);

    return () => {
      window.removeEventListener("product:added", onProductAdded as EventListener);
      window.removeEventListener("focusBarcodeScanner", onFocusRequest as EventListener);
    };
  }, [inputRef, handleBarcodeChange]);

  return (
    <Input
      ref={inputRef}
      className="opacity-0 absolute -top-1000"
      value={barcodeInput}
      onChange={handleBarcodeChange}
      onKeyPress={handleKeyPress}
      placeholder="Scanner input..."
      disabled={disabled}
    />
  );
}
