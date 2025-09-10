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
    <input
      ref={inputRef}
      id="barcode-scanner"
      type="text"
      value={barcodeInput}
      onChange={handleBarcodeChange}
      onKeyDown={handleKeyPress}
      placeholder="Scan barcode..."
      data-barcode-scanner="true"
      disabled={disabled}
      autoComplete="off"
      tabIndex={0} // ✅ allow natural focus
      style={{
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
        height: 0,
        width: 0,
        outline: "none",
        border: "none",
      }}
    />
  );
}
