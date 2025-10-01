(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/qz.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
    } catch (e) {
        return null;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/printing/usePrint.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pos-frontend/src/hooks/printing/usePrint.ts
__turbopack_context__.s([
    "usePrint",
    ()=>usePrint
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$webviewWindow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/webviewWindow.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/qz.ts [app-client] (ecmascript)");
;
;
;
function genId() {
    return "pr-".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8));
}
function persistPrintPayload(id, data) {
    localStorage.setItem("print:".concat(id), JSON.stringify(data));
}
function removePrintPayload(id) {
    try {
        localStorage.removeItem("print:".concat(id));
    } catch (e) {}
}
function usePrint() {
    const openPrintPreview = async (data)=>{
        const id = genId();
        persistPrintPayload(id, data);
        const label = "print-preview-".concat(id);
        const origin = window.location.origin; // http://localhost:3000, http://tauri.localhost, app://-/
        const isDevHttp = origin.includes('localhost') && !origin.includes('tauri.localhost');
        const url = isDevHttp ? "".concat(origin, "/print/receipt?id=").concat(id) : origin.startsWith('http') ? "".concat(origin, "/print/receipt.html?id=").concat(id) : "app://-/print/receipt.html?id=".concat(id);
        const win = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$webviewWindow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebviewWindow"](label, {
            title: 'Print Preview',
            url,
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
    const printDirect = async (escposData, itemCount, printerName)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["invoke"])('print_receipt_direct', {
            receiptData: escposData,
            itemCount,
            printerName: printerName !== null && printerName !== void 0 ? printerName : null
        });
    };
    // Optional: QZ raw printing (when using QZ)
    const printViaQZ = async (escposData, preferredPrinter)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initQZ"])();
        const target = preferredPrinter || await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultPrinter"])() || '';
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setPrinterByName"])(target);
        const buf = new TextEncoder().encode(escposData);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qz$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["printRaw"])(buf);
    };
    // New: list installed printers (Windows)
    const listPrinters = async ()=>{
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["invoke"])('list_printers');
        } catch (e) {
            return [];
        }
    };
    // New: get default printer name (Windows)
    const getDefaultPrinterName = async ()=>{
        try {
            const n = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["invoke"])('get_default_printer_name');
            return n || null;
        } catch (e) {
            return null;
        }
    };
    return {
        openPrintPreview,
        printDirect,
        printViaQZ,
        listPrinters,
        getDefaultPrinterName
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_2c053c77._.js.map