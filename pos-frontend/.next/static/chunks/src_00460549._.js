(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/global/BreakpointIndicator.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BreakpointIndicator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const breakpoints = [
    {
        name: "2xl",
        min: 1536
    },
    {
        name: "xl",
        min: 1280
    },
    {
        name: "lg",
        min: 1024
    },
    {
        name: "md",
        min: 768
    },
    {
        name: "sm",
        min: 640
    },
    {
        name: "xs",
        min: 0
    }
];
function getBreakpoint(width) {
    const bp = breakpoints.find((b)=>width >= b.min) || breakpoints[breakpoints.length - 1];
    return "".concat(bp.name, ":").concat(bp.min);
}
function BreakpointIndicator() {
    _s();
    const [breakpoint, setBreakpoint] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BreakpointIndicator.useEffect": ()=>{
            const updateBreakpoint = {
                "BreakpointIndicator.useEffect.updateBreakpoint": ()=>setBreakpoint(getBreakpoint(window.innerWidth))
            }["BreakpointIndicator.useEffect.updateBreakpoint"];
            updateBreakpoint();
            window.addEventListener("resize", updateBreakpoint);
            return ({
                "BreakpointIndicator.useEffect": ()=>window.removeEventListener("resize", updateBreakpoint)
            })["BreakpointIndicator.useEffect"];
        }
    }["BreakpointIndicator.useEffect"], []);
    if (!breakpoint) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: "fixed",
            left: 8,
            bottom: 8,
            zIndex: 9999,
            background: "#222",
            color: "#fff",
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 14,
            opacity: 0.7,
            pointerEvents: "none"
        },
        children: breakpoint
    }, void 0, false, {
        fileName: "[project]/src/components/global/BreakpointIndicator.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
_s(BreakpointIndicator, "MzpaUUx3YsVs/VPQL7oe7ayxakE=");
_c = BreakpointIndicator;
var _c;
__turbopack_context__.k.register(_c, "BreakpointIndicator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/sonner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const Toaster = (param)=>{
    let { ...props } = param;
    _s();
    const { theme = "system" } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toaster"], {
        theme: theme,
        className: "toaster group",
        style: {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)"
        },
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sonner.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Toaster, "EriOrahfenYKDCErPq+L6926Dw4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = Toaster;
;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/productRegister-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ...existing code...
__turbopack_context__.s([
    "ProductModalProvider",
    ()=>ProductModalProvider,
    "useProductModal",
    ()=>useProductModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const ProductModalContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    activeModals: [],
    activeModal: null,
    isOpen: ()=>false,
    modalProps: undefined,
    openModal: ()=>{},
    closeModal: ()=>{},
    open: false,
    setOpen: ()=>{},
    barcode: "",
    setBarcode: ()=>{}
});
const ProductModalProvider = (param)=>{
    let { children } = param;
    _s();
    const [activeModals, setActiveModals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [modalProps, setModalProps] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(undefined);
    const [barcode, setBarcode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const openModal = (name, props)=>{
        setActiveModals((prev)=>{
            if (prev.includes(name)) return prev;
            return [
                ...prev,
                name
            ];
        });
        setModalProps((prev)=>({
                ...prev || {},
                [name]: props
            }));
    };
    const closeModal = (name)=>{
        if (typeof name === "string") {
            setActiveModals((prev)=>prev.filter((m)=>m !== name));
            setModalProps((prev)=>{
                if (!prev) return prev;
                const next = {
                    ...prev
                };
                delete next[name];
                return Object.keys(next).length ? next : undefined;
            });
        } else {
            // no name -> close all
            setActiveModals([]);
            setModalProps(undefined);
        }
    };
    const isOpen = (name)=>activeModals.includes(name);
    // backward compat: treat the "product register" modal name as "addProduct"
    const open = isOpen("addProduct");
    const setOpen = (v)=>{
        if (v) {
            openModal("addProduct");
        } else {
            // only remove the product modal entry
            closeModal("addProduct");
        }
    };
    const activeModal = activeModals.length ? activeModals[activeModals.length - 1] : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProductModalContext.Provider, {
        value: {
            activeModals,
            activeModal,
            isOpen,
            modalProps,
            openModal,
            closeModal,
            open,
            setOpen,
            barcode,
            setBarcode
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/productRegister-context.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ProductModalProvider, "ma+BlKDPAcSBQnF2o0mqDeROXkI=");
_c = ProductModalProvider;
const useProductModal = ()=>{
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ProductModalContext);
}; // ...existing code...
_s1(useProductModal, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c;
__turbopack_context__.k.register(_c, "ProductModalProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_00460549._.js.map