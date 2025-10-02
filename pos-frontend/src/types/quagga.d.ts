declare module "quagga" {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement;
      constraints: {
        width: number;
        height: number;
        facingMode: string;
      };
    };
    decoder: {
      readers: string[];
      debug: {
        showCanvas: boolean;
        showPatches: boolean;
        showFoundPatches: boolean;
        showSkeleton: boolean;
        showLabels: boolean;
        showPatchLabels: boolean;
        showBoundingBox: boolean;
        showBoundingBoxes: boolean;
        showScanRegion: boolean;
        showScanRegionPatches: boolean;
        showExpectedPattern: boolean;
        drawPatches: boolean;
        drawBoundingBoxes: boolean;
        drawLabels: boolean;
        drawScanRegion: boolean;
        drawScanRegionPatches: boolean;
        drawExpectedPattern: boolean;
      };
    };
    locate: boolean;
    locator: {
      patchSize: string;
      halfSample: boolean;
    };
  }

  interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
    };
  }

  interface QuaggaStatic {
    init(config: QuaggaConfig, callback: (err: any) => void): Promise<void>;
    start(): void;
    stop(): void;
    onDetected(callback: (result: QuaggaResult) => void): void;
  }

  const Quagga: QuaggaStatic;
  export default Quagga;
}
