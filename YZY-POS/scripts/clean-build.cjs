// Node 16+ script to clean build directories
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');         // YZY-POS/
const repoRoot = path.resolve(root, '..');          // C:\Code\POS_Project\

const frontendNext = path.join(repoRoot, 'pos-frontend', '.next');
const frontendOut = path.join(repoRoot, 'pos-frontend', 'out');
const tauriTarget = path.join(root, 'src-tauri', 'target');

console.log('Cleaning build directories...');

// Clean Next.js build directories
if (fs.existsSync(frontendNext)) {
    fs.rmSync(frontendNext, { recursive: true, force: true });
    console.log('Cleaned .next directory');
}

if (fs.existsSync(frontendOut)) {
    fs.rmSync(frontendOut, { recursive: true, force: true });
    console.log('Cleaned out directory');
}

// Clean Tauri target directory
if (fs.existsSync(tauriTarget)) {
    fs.rmSync(tauriTarget, { recursive: true, force: true });
    console.log('Cleaned tauri target directory');
}

console.log('Clean completed.');
