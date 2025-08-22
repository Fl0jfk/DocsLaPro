(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/documents/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>DocumentsPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function DocumentsPage() {
    _s();
    const [currentPrefix, setCurrentPrefix] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const cacheKey = (prefix)=>"documents_cache_".concat(prefix);
    const cacheTTL = 24 * 60 * 60 * 1000;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DocumentsPage.useEffect": ()=>{
            setLoading(true);
            const cachedRaw = localStorage.getItem(cacheKey(currentPrefix));
            if (cachedRaw) {
                const cached = JSON.parse(cachedRaw);
                const now = Date.now();
                if (now - cached.timestamp < cacheTTL) {
                    setItems(cached.data);
                    setLoading(false);
                    return;
                }
            }
            fetch("/api/documents/list?prefix=".concat(currentPrefix)).then({
                "DocumentsPage.useEffect": (res)=>res.json()
            }["DocumentsPage.useEffect"]).then({
                "DocumentsPage.useEffect": (data)=>{
                    if (data.error) {
                        console.error("Erreur API documents:", data.error);
                        setItems([]);
                    } else {
                        setItems(data);
                        localStorage.setItem(cacheKey(currentPrefix), JSON.stringify({
                            data,
                            timestamp: Date.now()
                        }));
                    }
                    setLoading(false);
                }
            }["DocumentsPage.useEffect"]).catch({
                "DocumentsPage.useEffect": (err)=>{
                    console.error("Erreur fetch documents:", err);
                    setLoading(false);
                }
            }["DocumentsPage.useEffect"]);
        }
    }["DocumentsPage.useEffect"], [
        currentPrefix
    ]);
    const enterFolder = (path)=>{
        setHistory((prev)=>[
                ...prev,
                currentPrefix
            ]);
        setCurrentPrefix(path.replace(/^documents\/[^/]+\//, ""));
    };
    const goBack = ()=>{
        const prev = history.pop();
        if (prev !== undefined) {
            setHistory([
                ...history
            ]);
            setCurrentPrefix(prev);
        }
    };
    const getFileIcon = (ext)=>{
        if (!ext) return "📄";
        if (ext === "pdf") return "📄";
        if (ext === "doc" || ext === "docx") return "📝";
        if (ext === "xls" || ext === "xlsx") return "📊";
        return "📄";
    };
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Chargement..."
    }, void 0, false, {
        fileName: "[project]/app/documents/page.tsx",
        lineNumber: 71,
        columnNumber: 23
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "flex flex-col gap-4 p-4 w-full mx-auto max-w-[1000px] sm:pt-[10vh]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "space-y-4 flex flex-col gap-2",
            children: [
                history.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: goBack,
                    className: "text-blue-500 hover:underline mb-4",
                    children: "← Retour"
                }, void 0, false, {
                    fileName: "[project]/app/documents/page.tsx",
                    lineNumber: 76,
                    columnNumber: 11
                }, this),
                items.length > 0 ? items.map((item, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 bg-white rounded-lg shadow-md",
                        children: item.type === "folder" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "cursor-pointer font-semibold text-yellow-700",
                            onClick: ()=>enterFolder(item.path),
                            children: [
                                "📁 ",
                                item.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/documents/page.tsx",
                            lineNumber: 82,
                            columnNumber: 17
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-semibold",
                                    children: [
                                        getFileIcon(item.ext),
                                        " ",
                                        item.name
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/documents/page.tsx",
                                    lineNumber: 87,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    className: "text-blue-500 hover:underline",
                                    href: item.url,
                                    children: "Télécharger"
                                }, void 0, false, {
                                    fileName: "[project]/app/documents/page.tsx",
                                    lineNumber: 88,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/documents/page.tsx",
                            lineNumber: 86,
                            columnNumber: 17
                        }, this)
                    }, idx, false, {
                        fileName: "[project]/app/documents/page.tsx",
                        lineNumber: 80,
                        columnNumber: 13
                    }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "Aucun document disponible pour ce dossier."
                }, void 0, false, {
                    fileName: "[project]/app/documents/page.tsx",
                    lineNumber: 94,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/documents/page.tsx",
            lineNumber: 74,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/documents/page.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
_s(DocumentsPage, "3n5vRc5GTe9m2I7wVp8pCrW8q24=");
_c = DocumentsPage;
var _c;
__turbopack_context__.k.register(_c, "DocumentsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=app_documents_page_tsx_377812b3._.js.map