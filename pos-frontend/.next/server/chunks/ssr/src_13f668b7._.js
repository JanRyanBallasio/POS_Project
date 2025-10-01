module.exports = [
"[project]/src/lib/qz.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Lightweight QZ Tray wrapper with lazy loading
// Usage: await initQZ(); await setPrinterByName('YOUR_PRINTER'); await printRaw(escposBytes);
__turbopack_context__.s([
    "getDefaultPrinter",
    ()=>getDefaultPrinter,
    "getPrinters",
    ()=>getPrinters,
    "initQZ",
    ()=>initQZ,
    "printRaw",
    ()=>printRaw,
    "setPrinterByName",
    ()=>setPrinterByName
]);
let qzReady = false;
function qzLib() {
    // @ts-ignore
    return window.qz;
}
async function loadQZScript() {
    if (qzLib()) return;
    // Avoid duplicate loads
    const existing = document.querySelector('script[data-qz]');
    if (existing) {
        // If QZ is already attached, we’re done
        if (qzLib()) return;
        // Otherwise wait for the existing tag to finish loading
        await new Promise((resolve)=>{
            existing.addEventListener('load', ()=>resolve(), {
                once: true
            });
        });
        return;
    }
    await new Promise((resolve, reject)=>{
        const s = document.createElement('script');
        s.src = '/vendor/qz-tray.js'; // served from Next public/
        s.async = true;
        s.defer = true;
        s.dataset.qz = '1';
        s.onload = ()=>resolve();
        s.onerror = ()=>reject(new Error('Failed to load /vendor/qz-tray.js'));
        document.head.appendChild(s);
    });
}
async function initQZ() {
    if (qzReady) return;
    await loadQZScript();
    const qz = qzLib();
    if (!qz) throw new Error('QZ Tray library not available. Is QZ Tray running?');
    // In dev you can allow unsigned; in prod you should set certificate/signing
    qz.api.setPromiseType((p)=>new Promise(p));
    if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
    }
    qzReady = true;
}
async function setPrinterByName(name) {
    const qz = qzLib();
    if (!qzReady) await initQZ();
    const cfg = qz.configs.create(name, {
        encoding: 'binary',
        rasterize: false
    });
    // @ts-ignore
    window.__qz_cfg = cfg;
    return cfg;
}
async function printRaw(data) {
    const qz = qzLib();
    if (!qzReady) await initQZ();
    // @ts-ignore
    const cfg = window.__qz_cfg || qz.configs.create(null, {
        encoding: 'binary',
        rasterize: false
    });
    const bytes = Array.from(data);
    return qz.print(cfg, [
        {
            type: 'raw',
            format: 'command',
            data: bytes
        }
    ]);
}
async function getPrinters() {
    const qz = qzLib();
    if (!qzReady) await initQZ();
    return qz.printers.find();
}
async function getDefaultPrinter() {
    const qz = qzLib();
    if (!qzReady) await initQZ();
    try {
        return await qz.printers.getDefault();
    } catch  {
        return null;
    }
}
}),
"[project]/src/hooks/printing/usePrint.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePrint",
    ()=>usePrint
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$webviewWindow$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/webviewWindow.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/core.js [app-ssr] (ecmascript)");
// NEW: QZ Tray helpers
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/qz.ts [app-ssr] (ecmascript)");
;
;
;
function genId() {
    return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function persistPrintPayload(id, data) {
    localStorage.setItem(`print:${id}`, JSON.stringify(data));
}
function removePrintPayload(id) {
    try {
        localStorage.removeItem(`print:${id}`);
    } catch  {}
}
function usePrint() {
    const openPrintPreview = async (data)=>{
        const id = genId();
        persistPrintPayload(id, data);
        const label = `print-preview-${id}`;
        const win = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$webviewWindow$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebviewWindow"](label, {
            title: 'Print Preview',
            url: `/print/receipt?id=${id}`,
            width: 420,
            height: 800,
            resizable: true,
            center: true,
            visible: true
        });
        win.once('tauri://created', ()=>console.log('Print preview window created:', label));
        win.once('tauri://error', (e)=>{
            console.error('Failed to create print preview window:', e);
            alert('Failed to open print preview window. Check Tauri capabilities.');
        });
        win.once('tauri://destroyed', ()=>removePrintPayload(id));
        return win;
    };
    // Existing native direct printing via Tauri command (fallback)
    const printDirect = async (escposData, itemCount, printerName)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["invoke"])('print_receipt_direct', {
            receipt_data: escposData,
            item_count: itemCount,
            printer_name: printerName ?? null
        });
    };
    // NEW: QZ Tray direct raw printing
    const printViaQZ = async (escposData, preferredPrinter)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initQZ"])();
        const target = preferredPrinter || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDefaultPrinter"])() || '';
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setPrinterByName"])(target);
        // Convert string to Uint8Array for raw ESC/POS
        const buf = new TextEncoder().encode(escposData);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["printRaw"])(buf);
    };
    return {
        openPrintPreview,
        printDirect,
        printViaQZ
    };
}
}),
];

//# sourceMappingURL=src_13f668b7._.js.map