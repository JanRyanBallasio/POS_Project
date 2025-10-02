import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from 'quagga';
import { Camera, CameraOff, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export default function EnhancedBarcodeScanner({
  onScan,
  onError,
  isActive,
  onToggle,
  className = ""
}: EnhancedBarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const lastScanTime = useRef(0);

  const initializeScanner = useCallback(async () => {
    if (!scannerRef.current || isInitialized || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ],
          debug: {
            showCanvas: false,
            showPatches: false,
            showFoundPatches: false,
            showSkeleton: false,
            showLabels: false,
            showPatchLabels: false,
            showBoundingBox: false,
            showBoundingBoxes: false,
            showScanRegion: false,
            showScanRegionPatches: false,
            showExpectedPattern: false,
            drawPatches: false,
            drawBoundingBoxes: false,
            drawLabels: false,
            drawScanRegion: false,
            drawScanRegionPatches: false,
            drawExpectedPattern: false
          }
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true
        }
      }, (err) => {
        setIsInitializing(false);
        
        if (err) {
          console.error('Quagga initialization error:', err);
          const errorMessage = err.message || 'Failed to initialize camera scanner';
          setError(errorMessage);
          onError?.(errorMessage);
          return;
        }
        
        setIsInitialized(true);
        setIsScanning(true);
      });

      // Handle successful barcode detection
      Quagga.onDetected((result) => {
        const now = Date.now();
        const code = result.codeResult?.code;
        
        // Prevent duplicate scans within 500ms
        if (now - lastScanTime.current < 500) {
          return;
        }
        
        lastScanTime.current = now;
        
        if (code) {
          setScanCount(prev => prev + 1);
          onScan(code);
          
          // Brief pause to prevent duplicate scans
          setIsScanning(false);
          setTimeout(() => setIsScanning(true), 800);
        }
      });

    } catch (err: any) {
      setIsInitializing(false);
      console.error('Scanner initialization error:', err);
      const errorMessage = err.message || 'Camera access denied or not available';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [isInitialized, isInitializing, onScan, onError]);

  const startScanner = useCallback(() => {
    if (isInitialized && isActive) {
      try {
        Quagga.start();
        setIsScanning(true);
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('Failed to start camera');
      }
    }
  }, [isInitialized, isActive]);

  const stopScanner = useCallback(() => {
    if (isInitialized) {
      try {
        Quagga.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isActive && !isInitialized && !isInitializing) {
      initializeScanner();
    } else if (isActive && isInitialized) {
      startScanner();
    } else if (!isActive && isInitialized) {
      stopScanner();
    }
  }, [isActive, isInitialized, isInitializing, initializeScanner, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        try {
          Quagga.stop();
        } catch (err) {
          console.error('Error cleaning up scanner:', err);
        }
      }
    };
  }, [isInitialized]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Button
          onClick={onToggle}
          variant={isActive ? "destructive" : "default"}
          size="sm"
          className="flex items-center gap-2"
          disabled={isInitializing}
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Start Camera
            </>
          )}
        </Button>
        
        {scanCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <Zap className="w-4 h-4" />
            <span>{scanCount} scans</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <div>
            <div className="text-red-700 text-sm font-medium">Camera Error</div>
            <div className="text-red-600 text-xs">{error}</div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="relative">
          <div 
            ref={scannerRef} 
            className="w-full h-64 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
          >
            {isInitializing && (
              <div className="text-center text-gray-500">
                <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Initializing camera...</p>
                <p className="text-xs mt-1">Please allow camera access</p>
              </div>
            )}
            {!isInitializing && !isInitialized && (
              <div className="text-center text-gray-500">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <p>Camera ready</p>
              </div>
            )}
          </div>
          
          {isScanning && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Scanning...
            </div>
          )}
          
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            {isInitializing ? 'Initializing...' : isInitialized ? 'Ready' : 'Not Ready'}
          </div>
        </div>
      )}

      {!isActive && (
        <div className="text-center text-gray-500 text-sm py-4">
          <Camera className="w-6 h-6 mx-auto mb-2" />
          <p>Camera scanner is off</p>
          <p className="text-xs">Click "Start Camera" to begin scanning</p>
        </div>
      )}
    </div>
  );
}
