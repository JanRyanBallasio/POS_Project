module.exports = [
"[project]/src/hooks/printing/usePrint.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pos-frontend/src/hooks/printing/usePrint.ts
__turbopack_context__.s([
    "usePrint",
    ()=>usePrint
]);
function usePrint() {
    const printReceipt = async (data)=>{
        const origin = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'http://localhost:5000';
        const url = `${origin.replace(/\/$/, '')}/print/receipt`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const t = await res.text().catch(()=>'');
            throw new Error(`Print failed: ${res.status} ${t}`);
        }
        return res.json();
    };
    return {
        printReceipt
    };
}
}),
];

//# sourceMappingURL=src_hooks_printing_usePrint_ts_b01a5c10._.js.map