// YZY-POS/src/main.ts
console.log('YZY POS Tauri app starting...');

// Initialize Tauri app
window.addEventListener('DOMContentLoaded', () => {
  console.log('YZY POS loaded successfully');
  
  // Optional: Add any global initialization here
  document.body.classList.add('tauri-app');
});

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});