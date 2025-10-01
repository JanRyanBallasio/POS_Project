import { useEffect } from "react";

export function usePosShortcuts(step: 1 | 2 | 3) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Only on Step 1
      if (step !== 1) return;

      // Don't steal focus from customer tagging
      if ((window as any).customerSearchActive) return;

      const key = e.key;
      const isInput =
        (document.activeElement as HTMLElement | null)?.matches?.(
          'input, textarea, [contenteditable="true"]'
        ) ?? false;

      // F2 → focus product search/scanner
      if (key === "F2") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event("focusBarcodeScanner"));
        return;
      }

      // Ctrl+Enter → focus cash input
      if (e.ctrlKey && key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event("focusCashInput"));
        return;
      }

      // Ctrl+Q → quantity input (reuse existing cart event)
      if (e.ctrlKey && !e.shiftKey && key.toLowerCase() === "q") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("cart:focus-qty"));
        // Backward compatible with your existing handler (Ctrl+Q already supported)
        // If you prefer, keep only one of these events and handle it in CartTable/useCartKeyboard.
        return;
      }

      // Ctrl+Shift+P → edit price (reuse existing cart event)
      if (e.ctrlKey && e.shiftKey && key.toLowerCase() === "p") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("cart:edit-price"));
        return;
      }
    };

    // capture = true so we win races with other listeners
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [step]);
}