// pos-frontend/src/lib/devtools.ts
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export function setupDevtoolsShortcut() {
  if (typeof (window as any).__TAURI__ === 'undefined') return;
  const open = () => {
    const w = getCurrentWebviewWindow() as any;
    if (w?.openDevtools) w.openDevtools();
  };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')) {
      e.preventDefault();
      open();
    }
  });
}