module.exports = [
"[project]/src/components/printing/PrintReceipt.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pos-frontend/src/components/printing/PrintReceipt.tsx
__turbopack_context__.s([
    "default",
    ()=>PrintReceipt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function PrintReceipt({ store, customer, date, items, cartTotal, amount, change, points }) {
    const safeDate = date || new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit"
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            justifyContent: "center",
            background: "#f5f5f5"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            id: "receipt-root",
            style: {
                width: "80mm",
                background: "#fff",
                color: "#000",
                padding: "10px",
                boxSizing: "border-box",
                fontFamily: "'Courier New', monospace",
                fontSize: "12px",
                lineHeight: 1.2
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                    dangerouslySetInnerHTML: {
                        __html: `
@page {
  size: 80mm auto;
  margin: 0;
}
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.no-print {
  display: inline-flex;
}
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 80mm !important;
  }
  .no-print {
    display: none !important;
  }
}
.separator {
  border-top: 1px dashed #000;
  margin: 6px 0;
  height: 1px;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  padding: 2px 0;
  text-align: left;
  font-size: 11px;
  white-space: nowrap;
}
.right { text-align: right; }
.center { text-align: center; }
.header { text-align: center; font-weight: bold; margin-bottom: 6px; font-size: 14px; }
.footer { margin-top: 12px; text-align: center; font-weight: bold; }
.summary { margin: 8px 0; }
.summary-line { display: flex; justify-content: space-between; margin: 2px 0; }
.actions {
  position: sticky;
  bottom: 0;
  margin-top: 10px;
  display: flex;
  gap: 8px;
}
.actions button {
  flex: 1;
  height: 36px;
  font-size: 14px;
}
`
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 59,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "header",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: store?.name ?? "YZY STORE"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 120,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: store?.address1 ?? "Eastern Slide, Tuding"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 121,
                            columnNumber: 11
                        }, this),
                        store?.address2 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: store.address2
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 122,
                            columnNumber: 30
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 119,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "separator"
                }, void 0, false, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 125,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        justifyContent: "space-between"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Customer:"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 128,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: customer?.name || "N/A"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 127,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        justifyContent: "space-between"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Date:"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 132,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: safeDate
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 133,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 131,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "separator"
                }, void 0, false, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 136,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "table",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "#"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                        lineNumber: 141,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "Description"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                        lineNumber: 142,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "right",
                                        children: "Qty"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                        lineNumber: 143,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "right",
                                        children: "Price"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                        lineNumber: 144,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "right",
                                        children: "Amount"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                        lineNumber: 145,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 139,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: items.map((it, i)=>{
                                const price = typeof it.price === "number" ? it.price : it.amount / Math.max(1, it.qty);
                                const desc = it.desc.length > 20 ? `${it.desc.slice(0, 17)}...` : it.desc;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: i + 1
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                            lineNumber: 155,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: desc
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                            lineNumber: 156,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "right",
                                            children: it.qty
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                            lineNumber: 157,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "right",
                                            children: [
                                                "P",
                                                price.toFixed(2)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                            lineNumber: 158,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "right",
                                            children: [
                                                "P",
                                                it.amount.toFixed(2)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                            lineNumber: 159,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                    lineNumber: 154,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 148,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 138,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "separator"
                }, void 0, false, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 166,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "summary",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "summary-line",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Total:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                    lineNumber: 170,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        "P",
                                        cartTotal.toFixed(2)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                    lineNumber: 171,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 169,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "summary-line",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Amount:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                    lineNumber: 174,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        "P",
                                        amount.toFixed(2)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                    lineNumber: 175,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 173,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "summary-line",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Change:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                    lineNumber: 178,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        "P",
                                        change.toFixed(2)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                                    lineNumber: 179,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 177,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 168,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "separator"
                }, void 0, false, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 183,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "summary-line",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Customer Points:"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 186,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: points ?? 0
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 187,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 185,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "separator"
                }, void 0, false, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 190,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "footer",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: "CUSTOMER COPY - NOT AN OFFICIAL RECEIPT"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 193,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: "THANK YOU - GATANG KA MANEN!"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 194,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 192,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "separator"
                }, void 0, false, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 197,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "actions no-print",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>window.print(),
                            children: "Print"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 200,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>window.close(),
                            children: "Close"
                        }, void 0, false, {
                            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                            lineNumber: 201,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/printing/PrintReceipt.tsx",
                    lineNumber: 199,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/printing/PrintReceipt.tsx",
            lineNumber: 46,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/printing/PrintReceipt.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/escpos.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pos-frontend/src/lib/escpos.ts
__turbopack_context__.s([
    "buildEscposReceipt",
    ()=>buildEscposReceipt
]);
function padLeft(s, len) {
    const str = String(s);
    return str.length >= len ? str.slice(0, len) : " ".repeat(len - str.length) + str;
}
function padRight(s, len) {
    const str = String(s);
    return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}
function buildEscposReceipt(data) {
    const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit"
    });
    let r = "";
    // Initialize
    r += "\x1B\x40"; // ESC @
    // Ensure a standard code page (adjust if your printer needs a different one)
    r += "\x1B\x74\x00"; // ESC t 0  => CP437
    // Header (center + bold)
    r += "\x1B\x61\x01"; // center
    r += "\x1B\x45\x01"; // bold on
    r += "YZY STORE\n";
    r += "Eastern Slide, Tuding\n";
    r += "\x1B\x45\x00"; // bold off
    r += "\x1B\x61\x00"; // left
    // Customer / date
    r += "--------------------------------\n";
    r += `Customer: ${data.customer?.name || "N/A"}\n`;
    r += `Date: ${dateStr}\n`;
    r += "--------------------------------\n";
    // Table header
    r += "# Description        Qty Price Amount\n";
    r += "--------------------------------\n";
    // Items
    data.items.forEach((it, i)=>{
        const desc = it.desc.length > 15 ? it.desc.substring(0, 12) + "..." : it.desc;
        const qty = padLeft(it.qty, 3);
        const price = typeof it.price === "number" ? it.price : it.qty > 0 ? it.amount / it.qty : 0;
        const priceStr = padLeft(`P${price.toFixed(2)}`, 6);
        const amountStr = padLeft(`P${it.amount.toFixed(2)}`, 7);
        r += `${padLeft(i + 1, 2)} ${padRight(desc, 15)} ${qty} ${priceStr} ${amountStr}\n`;
    });
    // Totals
    r += "--------------------------------\n";
    r += `Total:                    P${data.cartTotal.toFixed(2)}\n`;
    r += `Amount:                   P${data.amount.toFixed(2)}\n`;
    r += `Change:                   P${data.change.toFixed(2)}\n`;
    r += "--------------------------------\n";
    r += `Customer Points: ${data.points ?? 0}\n`;
    r += "--------------------------------\n\n";
    // Footer
    r += "\x1B\x61\x01"; // center
    r += "CUSTOMER COPY - NOT AN OFFICIAL RECEIPT\n\n";
    r += "THANK YOU - GATANG KA MANEN!\n";
    r += "\x1B\x61\x00"; // left
    r += "--------------------------------\n\n";
    // Feed and cut (increase feed if your printer trims too close)
    r += "\x1B\x64\x03"; // feed 3 lines
    r += "\x1D\x56\x00"; // GS V 0 (full cut)
    return r;
}
}),
"[project]/src/app/print/receipt/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pos-frontend/src/app/print/receipt/page.tsx
__turbopack_context__.s([
    "default",
    ()=>ReceiptPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$printing$2f$PrintReceipt$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/printing/PrintReceipt.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$escpos$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/escpos.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function ReceiptPage() {
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [printers, setPrinters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [printerName, setPrinterName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return "";
        //TURBOPACK unreachable
        ;
    }, []);
    // Load data and bind keyboard print
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!id) return;
        try {
            const key = `print:${id}`;
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                setData(parsed);
                const onKey = async (e)=>{
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            const esc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$escpos$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildEscposReceipt"])(parsed);
                            const pn = localStorage.getItem('print:defaultPrinter') || null;
                            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["invoke"])('print_receipt_direct', {
                                receiptData: esc,
                                itemCount: parsed.items.length,
                                printerName: pn
                            });
                            try {
                                localStorage.removeItem(key);
                            } catch  {}
                            window.close();
                        } catch (err) {
                            alert(err?.message || String(err));
                        }
                    }
                };
                window.addEventListener('keydown', onKey);
                return ()=>window.removeEventListener('keydown', onKey);
            }
        } catch (e) {
            console.error("Failed to load print data:", e);
        }
    }, [
        id
    ]);
    // Load printers and pick last saved or default
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        (async ()=>{
            try {
                const list = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["invoke"])('list_printers').catch(()=>[]);
                setPrinters(Array.isArray(list) ? list : []);
                const saved = localStorage.getItem('print:defaultPrinter') || '';
                if (saved && list && list.includes(saved)) {
                    setPrinterName(saved);
                } else {
                    const def = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["invoke"])('get_default_printer_name').catch(()=>'');
                    setPrinterName(def || null);
                }
            } catch  {}
        })();
    }, []);
    if (!id || !data) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                padding: 16,
                fontFamily: "sans-serif"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Loading receipt..."
            }, void 0, false, {
                fileName: "[project]/src/app/print/receipt/page.tsx",
                lineNumber: 81,
                columnNumber: 67
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/print/receipt/page.tsx",
            lineNumber: 81,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$printing$2f$PrintReceipt$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                store: {
                    name: data.store?.name ?? "YZY STORE",
                    address1: data.store?.address1 ?? "Eastern Slide, Tuding",
                    address2: data.store?.address2
                },
                customer: data.customer,
                date: undefined,
                items: data.items,
                cartTotal: data.cartTotal,
                amount: data.amount,
                change: data.change,
                points: data.points
            }, void 0, false, {
                fileName: "[project]/src/app/print/receipt/page.tsx",
                lineNumber: 86,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "no-print",
                style: {
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
                    marginTop: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: printerName ?? '',
                        onChange: (e)=>setPrinterName(e.target.value || null),
                        style: {
                            height: 32,
                            minWidth: 260
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Default printer"
                            }, void 0, false, {
                                fileName: "[project]/src/app/print/receipt/page.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this),
                            printers.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: p,
                                    children: p
                                }, p, false, {
                                    fileName: "[project]/src/app/print/receipt/page.tsx",
                                    lineNumber: 103,
                                    columnNumber: 30
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/print/receipt/page.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            if (printerName) localStorage.setItem('print:defaultPrinter', printerName);
                        },
                        children: "Set as default"
                    }, void 0, false, {
                        fileName: "[project]/src/app/print/receipt/page.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: async ()=>{
                            try {
                                const esc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$escpos$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildEscposReceipt"])(data);
                                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["invoke"])('print_receipt_direct', {
                                    receiptData: esc,
                                    itemCount: data.items.length,
                                    printerName: printerName ?? null
                                });
                                try {
                                    localStorage.removeItem(`print:${id}`);
                                } catch  {}
                                window.close();
                            } catch (e) {
                                alert(e?.message || String(e));
                            }
                        },
                        children: "Print (Thermal, ESC/POS)"
                    }, void 0, false, {
                        fileName: "[project]/src/app/print/receipt/page.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>window.print(),
                        children: "System Print (A4/Graphic)"
                    }, void 0, false, {
                        fileName: "[project]/src/app/print/receipt/page.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>window.close(),
                        children: "Close"
                    }, void 0, false, {
                        fileName: "[project]/src/app/print/receipt/page.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/print/receipt/page.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/node_modules/@tauri-apps/api/external/tslib/tslib.es6.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ /* global Reflect, Promise, SuppressedError, Symbol, Iterator */ __turbopack_context__.s([
    "__classPrivateFieldGet",
    ()=>__classPrivateFieldGet,
    "__classPrivateFieldSet",
    ()=>__classPrivateFieldSet
]);
function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
;
}),
"[project]/node_modules/@tauri-apps/api/core.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Channel",
    ()=>Channel,
    "PluginListener",
    ()=>PluginListener,
    "Resource",
    ()=>Resource,
    "SERIALIZE_TO_IPC_FN",
    ()=>SERIALIZE_TO_IPC_FN,
    "addPluginListener",
    ()=>addPluginListener,
    "checkPermissions",
    ()=>checkPermissions,
    "convertFileSrc",
    ()=>convertFileSrc,
    "invoke",
    ()=>invoke,
    "isTauri",
    ()=>isTauri,
    "requestPermissions",
    ()=>requestPermissions,
    "transformCallback",
    ()=>transformCallback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tauri-apps/api/external/tslib/tslib.es6.js [app-ssr] (ecmascript)");
;
// Copyright 2019-2024 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
var _Channel_onmessage, _Channel_nextMessageIndex, _Channel_pendingMessages, _Channel_messageEndIndex, _Resource_rid;
/**
 * Invoke your custom commands.
 *
 * This package is also accessible with `window.__TAURI__.core` when [`app.withGlobalTauri`](https://v2.tauri.app/reference/config/#withglobaltauri) in `tauri.conf.json` is set to `true`.
 * @module
 */ /**
 * A key to be used to implement a special function
 * on your types that define how your type should be serialized
 * when passing across the IPC.
 * @example
 * Given a type in Rust that looks like this
 * ```rs
 * #[derive(serde::Serialize, serde::Deserialize)
 * enum UserId {
 *   String(String),
 *   Number(u32),
 * }
 * ```
 * `UserId::String("id")` would be serialized into `{ String: "id" }`
 * and so we need to pass the same structure back to Rust
 * ```ts
 * import { SERIALIZE_TO_IPC_FN } from "@tauri-apps/api/core"
 *
 * class UserIdString {
 *   id
 *   constructor(id) {
 *     this.id = id
 *   }
 *
 *   [SERIALIZE_TO_IPC_FN]() {
 *     return { String: this.id }
 *   }
 * }
 *
 * class UserIdNumber {
 *   id
 *   constructor(id) {
 *     this.id = id
 *   }
 *
 *   [SERIALIZE_TO_IPC_FN]() {
 *     return { Number: this.id }
 *   }
 * }
 *
 * type UserId = UserIdString | UserIdNumber
 * ```
 *
 */ // if this value changes, make sure to update it in:
// 1. ipc.js
// 2. process-ipc-message-fn.js
const SERIALIZE_TO_IPC_FN = '__TAURI_TO_IPC_KEY__';
/**
 * Stores the callback in a known location, and returns an identifier that can be passed to the backend.
 * The backend uses the identifier to `eval()` the callback.
 *
 * @return An unique identifier associated with the callback function.
 *
 * @since 1.0.0
 */ function transformCallback(// TODO: Make this not optional in v3
callback, once = false) {
    return window.__TAURI_INTERNALS__.transformCallback(callback, once);
}
class Channel {
    constructor(onmessage){
        _Channel_onmessage.set(this, void 0);
        // the index is used as a mechanism to preserve message order
        _Channel_nextMessageIndex.set(this, 0);
        _Channel_pendingMessages.set(this, []);
        _Channel_messageEndIndex.set(this, void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldSet"])(this, _Channel_onmessage, onmessage || (()=>{}), "f");
        this.id = transformCallback((rawMessage)=>{
            const index = rawMessage.index;
            if ('end' in rawMessage) {
                if (index == (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f")) {
                    this.cleanupCallback();
                } else {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldSet"])(this, _Channel_messageEndIndex, index, "f");
                }
                return;
            }
            const message = rawMessage.message;
            // Process the message if we're at the right order
            if (index == (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f")) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_onmessage, "f").call(this, message);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldSet"])(this, _Channel_nextMessageIndex, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f") + 1, "f");
                // process pending messages
                while((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f") in (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_pendingMessages, "f")){
                    const message = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_pendingMessages, "f")[(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f")];
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_onmessage, "f").call(this, message);
                    // eslint-disable-next-line @typescript-eslint/no-array-delete
                    delete (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_pendingMessages, "f")[(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f")];
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldSet"])(this, _Channel_nextMessageIndex, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f") + 1, "f");
                }
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_nextMessageIndex, "f") === (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_messageEndIndex, "f")) {
                    this.cleanupCallback();
                }
            } else {
                // eslint-disable-next-line security/detect-object-injection
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_pendingMessages, "f")[index] = message;
            }
        });
    }
    cleanupCallback() {
        window.__TAURI_INTERNALS__.unregisterCallback(this.id);
    }
    set onmessage(handler) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldSet"])(this, _Channel_onmessage, handler, "f");
    }
    get onmessage() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Channel_onmessage, "f");
    }
    [(_Channel_onmessage = new WeakMap(), _Channel_nextMessageIndex = new WeakMap(), _Channel_pendingMessages = new WeakMap(), _Channel_messageEndIndex = new WeakMap(), SERIALIZE_TO_IPC_FN)]() {
        return `__CHANNEL__:${this.id}`;
    }
    toJSON() {
        // eslint-disable-next-line security/detect-object-injection
        return this[SERIALIZE_TO_IPC_FN]();
    }
}
class PluginListener {
    constructor(plugin, event, channelId){
        this.plugin = plugin;
        this.event = event;
        this.channelId = channelId;
    }
    async unregister() {
        return invoke(`plugin:${this.plugin}|remove_listener`, {
            event: this.event,
            channelId: this.channelId
        });
    }
}
/**
 * Adds a listener to a plugin event.
 *
 * @returns The listener object to stop listening to the events.
 *
 * @since 2.0.0
 */ async function addPluginListener(plugin, event, cb) {
    const handler = new Channel(cb);
    return invoke(`plugin:${plugin}|registerListener`, {
        event,
        handler
    }).then(()=>new PluginListener(plugin, event, handler.id));
}
/**
 * Get permission state for a plugin.
 *
 * This should be used by plugin authors to wrap their actual implementation.
 */ async function checkPermissions(plugin) {
    return invoke(`plugin:${plugin}|check_permissions`);
}
/**
 * Request permissions.
 *
 * This should be used by plugin authors to wrap their actual implementation.
 */ async function requestPermissions(plugin) {
    return invoke(`plugin:${plugin}|request_permissions`);
}
/**
 * Sends a message to the backend.
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 * await invoke('login', { user: 'tauri', password: 'poiwe3h4r5ip3yrhtew9ty' });
 * ```
 *
 * @param cmd The command name.
 * @param args The optional arguments to pass to the command.
 * @param options The request options.
 * @return A promise resolving or rejecting to the backend response.
 *
 * @since 1.0.0
 */ async function invoke(cmd, args = {}, options) {
    return window.__TAURI_INTERNALS__.invoke(cmd, args, options);
}
/**
 * Convert a device file path to an URL that can be loaded by the webview.
 * Note that `asset:` and `http://asset.localhost` must be added to [`app.security.csp`](https://v2.tauri.app/reference/config/#csp-1) in `tauri.conf.json`.
 * Example CSP value: `"csp": "default-src 'self' ipc: http://ipc.localhost; img-src 'self' asset: http://asset.localhost"` to use the asset protocol on image sources.
 *
 * Additionally, `"enable" : "true"` must be added to [`app.security.assetProtocol`](https://v2.tauri.app/reference/config/#assetprotocolconfig)
 * in `tauri.conf.json` and its access scope must be defined on the `scope` array on the same `assetProtocol` object.
 *
 * @param  filePath The file path.
 * @param  protocol The protocol to use. Defaults to `asset`. You only need to set this when using a custom protocol.
 * @example
 * ```typescript
 * import { appDataDir, join } from '@tauri-apps/api/path';
 * import { convertFileSrc } from '@tauri-apps/api/core';
 * const appDataDirPath = await appDataDir();
 * const filePath = await join(appDataDirPath, 'assets/video.mp4');
 * const assetUrl = convertFileSrc(filePath);
 *
 * const video = document.getElementById('my-video');
 * const source = document.createElement('source');
 * source.type = 'video/mp4';
 * source.src = assetUrl;
 * video.appendChild(source);
 * video.load();
 * ```
 *
 * @return the URL that can be used as source on the webview.
 *
 * @since 1.0.0
 */ function convertFileSrc(filePath, protocol = 'asset') {
    return window.__TAURI_INTERNALS__.convertFileSrc(filePath, protocol);
}
/**
 * A rust-backed resource stored through `tauri::Manager::resources_table` API.
 *
 * The resource lives in the main process and does not exist
 * in the Javascript world, and thus will not be cleaned up automatiacally
 * except on application exit. If you want to clean it up early, call {@linkcode Resource.close}
 *
 * @example
 * ```typescript
 * import { Resource, invoke } from '@tauri-apps/api/core';
 * export class DatabaseHandle extends Resource {
 *   static async open(path: string): Promise<DatabaseHandle> {
 *     const rid: number = await invoke('open_db', { path });
 *     return new DatabaseHandle(rid);
 *   }
 *
 *   async execute(sql: string): Promise<void> {
 *     await invoke('execute_sql', { rid: this.rid, sql });
 *   }
 * }
 * ```
 */ class Resource {
    get rid() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldGet"])(this, _Resource_rid, "f");
    }
    constructor(rid){
        _Resource_rid.set(this, void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tauri$2d$apps$2f$api$2f$external$2f$tslib$2f$tslib$2e$es6$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["__classPrivateFieldSet"])(this, _Resource_rid, rid, "f");
    }
    /**
     * Destroys and cleans up this resource from memory.
     * **You should not call any method on this object anymore and should drop any reference to it.**
     */ async close() {
        return invoke('plugin:resources|close', {
            rid: this.rid
        });
    }
}
_Resource_rid = new WeakMap();
function isTauri() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return !!(globalThis || window).isTauri;
}
;
}),
];

//# sourceMappingURL=_95fdac85._.js.map