(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/hooks/printing/usePrint.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pos-frontend/src/hooks/printing/usePrint.ts
__turbopack_context__.s([
    "usePrint",
    ()=>usePrint
]);
function usePrint() {
    const printReceipt = async (data)=>{
        const origin = ("TURBOPACK compile-time truthy", 1) ? window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin : "TURBOPACK unreachable";
        const url = "".concat(origin.replace(/\/$/, ''), "/print/receipt");
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const t = await res.text().catch(()=>'');
            throw new Error("Print failed: ".concat(res.status, " ").concat(t));
        }
        return res.json();
    };
    return {
        printReceipt
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_hooks_printing_usePrint_ts_93d020d6._.js.map