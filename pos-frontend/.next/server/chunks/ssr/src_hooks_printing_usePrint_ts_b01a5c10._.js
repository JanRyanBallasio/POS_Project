module.exports = [
"[project]/src/hooks/printing/usePrint.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePrint",
    ()=>usePrint
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$webviewWindow$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/webviewWindow.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/core.js [app-ssr] (ecmascript)");
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
        win.once('tauri://destroyed', ()=>removePrintPayload(id));
        return win;
    };
    // IMPORTANT: send snake_case keys to match Rust command parameters
    const printDirect = async (escposData, itemCount, printerName)=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["invoke"])('print_receipt_direct', {
            receipt_data: escposData,
            item_count: itemCount,
            printer_name: printerName ?? null
        });
    };
    return {
        openPrintPreview,
        printDirect
    };
}
}),
];

//# sourceMappingURL=src_hooks_printing_usePrint_ts_b01a5c10._.js.map