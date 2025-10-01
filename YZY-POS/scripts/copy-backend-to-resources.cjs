// Node 16+ script
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');         // YZY-POS/
const repoRoot = path.resolve(root, '..');          // C:\Code\POS_Project\

const backendDist = path.join(repoRoot, 'pos-backend', 'dist');
const dstBin = path.join(root, 'src-tauri', 'bin');  // Changed: direct bin/ path

fs.mkdirSync(dstBin, { recursive: true });

// copy backend exe to src-tauri/bin/
const exeSrc = path.join(backendDist, 'pos-backend.exe');
const exeDst = path.join(dstBin, 'pos-backend.exe');
if (fs.existsSync(exeSrc)) {
  fs.copyFileSync(exeSrc, exeDst);
  console.log(`Copied ${exeSrc} -> ${exeDst}`);
} else {
  console.warn(`Warning: backend exe not found at ${exeSrc} (skipping)`);
}

// copy root .env to src-tauri/.env (bundled as resources/.env)
const envSrc = path.join(repoRoot, '.env');
const envDst = path.join(root, 'src-tauri', '.env');
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, envDst);
  console.log(`Copied ${envSrc} -> ${envDst}`);
} else {
  console.warn(`Warning: .env not found at ${envSrc} (skipping)`);
}

console.log('Backend and .env copy completed.');