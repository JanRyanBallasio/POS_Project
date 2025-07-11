import { Input } from "@/components/ui/input";
import React from "react";

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
