"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function BarcodeScanner({ 
  onScan, 
  disabled = false, 
  placeholder = "Focus here and scan barcode...",
  className = ""
}: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanTime = useRef(0);

  // Focus the input when component mounts
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Listen for focus events from parent components
  useEffect(() => {
    const handleFocusScanner = () => {
      if (!disabled && inputRef.current) {
        inputRef.current.focus();
        setInputValue('');
      }
    };

    window.addEventListener('focusBarcodeScanner', handleFocusScanner);
    return () => window.removeEventListener('focusBarcodeScanner', handleFocusScanner);
  }, [disabled]);

  // Process the scanned barcode
  const processScan = useCallback((barcode: string) => {
    const now = Date.now();
    
    // Prevent duplicate scans within 500ms
    if (now - lastScanTime.current < 500) {
      return;
    }
    
    lastScanTime.current = now;
    
    if (isProcessing) return;
    
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode || cleanBarcode.length < 3) return;

    setIsProcessing(true);
    
    try {
      onScan(cleanBarcode);
    } catch (error) {
      console.error('Barcode scan error:', error);
    } finally {
      // Clear input and refocus after processing
      setTimeout(() => {
        setInputValue('');
        setIsProcessing(false);
        if (!disabled && inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [onScan, isProcessing, disabled]);

  // Handle input changes (for keyboard entry)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // If input contains newline or carriage return (scanner input), process immediately
    if (value.includes('\n') || value.includes('\r')) {
      const cleanValue = value.replace(/[\n\r]/g, '').trim();
      if (cleanValue) {
        processScan(cleanValue);
      }
      return;
    }

    // Set timeout for manual typing (wait 1 second after last keystroke)
    scanTimeoutRef.current = setTimeout(() => {
      if (value.trim() && value.length >= 3) {
        processScan(value);
      }
    }, 1000);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        processScan(inputValue);
      }
    }
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    if (pastedText) {
      processScan(pastedText);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${className}`}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {isProcessing && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}