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
  // Handle blur events - only refocus if no other input is focused
  const handleBlur = () => {
    if (!disabled) {
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        );
        
        // Only refocus scanner if no other input/textarea is focused
        if (inputRef.current && !isInputFocused) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    if (pastedText) {
      const mockEvent = {
        target: { value: pastedText + '\n' }
      } as React.ChangeEvent<HTMLInputElement>;

      handleBarcodeChange(mockEvent);
    }
  };

  return (
    <div className="mb-4">
      {/* Hidden scanner input - positioned off-screen but accessible */}
      <input
        ref={inputRef}
        type="text"
        value={barcodeInput}
        onChange={handleBarcodeChange}
        onKeyDown={handleKeyPress}
        onPaste={handlePaste}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
