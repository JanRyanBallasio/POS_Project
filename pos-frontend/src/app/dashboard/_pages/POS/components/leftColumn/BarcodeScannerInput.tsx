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
    <div className="mb-4">
      <input
        ref={inputRef}
        id="barcode-scanner"
        type="text"
        value={barcodeInput}
        onChange={handleBarcodeChange}
        onKeyDown={handleKeyPress}
        className="barcode-scanner-input opacity-0 absolute -z-10 pointer-events-none"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          outline: 'none',
          border: 'none',
        }}
        placeholder="Scan or type barcode..."
        data-barcode-scanner="true"
        disabled={disabled}
        autoComplete="off"
        autoFocus
        tabIndex={-1}
      />
    </div>
  );
}
