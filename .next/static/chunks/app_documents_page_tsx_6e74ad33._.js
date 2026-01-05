(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/documents/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DocumentsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function DocumentsPage() {
    _s();
    const [currentPrefix, setCurrentPrefix] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const cacheKey = (prefix)=>"documents_cache_".concat(prefix);
    const cacheTTL = 15 * 60 * 1000;
    const [downloading, setDownloading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    console.log(downloading);
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
            fetch("/api/documents/list?prefix=".concat(encodeURIComponent(currentPrefix))).then({
                "DocumentsPage.useEffect": (res)=>res.json()
            }["DocumentsPage.useEffect"]).then({
                "DocumentsPage.useEffect": (data)=>{
                    if (data.error) {
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
                    setLoading(false);
                }
            }["DocumentsPage.useEffect"]);
        }
    }["DocumentsPage.useEffect"], [
        currentPrefix,
        cacheTTL
    ]);
    const enterFolder = (path)=>{
        setHistory((prev)=>[
                ...prev,
                currentPrefix
            ]);
        setCurrentPrefix(path);
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
        switch(ext.toLowerCase()){
            case "pdf":
                return "📄";
            case "doc":
            case "docx":
                return "📝";
            case "xls":
            case "xlsx":
                return "📊";
            default:
                return "📄";
        }
    };
    const handleDownload = async (path)=>{
        setDownloading(path);
        try {
            const res = await fetch("/api/documents/get-url?key=".concat(encodeURIComponent(path)));
            const data = await res.json();
            if (data.url) {
                const a = document.createElement("a");
                a.href = data.url;
                a.download = path.split("/").pop();
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert("Erreur lors de la génération du lien sécurisé.");
            }
        } catch (e) {
            alert("Erreur téléchargement : " + String(e));
        }
        setDownloading(null);
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-screen w-full",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
                    }, void 0, false, {
                        fileName: "[project]/app/documents/page.tsx",
                        lineNumber: 92,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-lg font-medium text-gray-600",
                        children: "Chargement en cours…"
                    }, void 0, false, {
                        fileName: "[project]/app/documents/page.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/documents/page.tsx",
                lineNumber: 91,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/documents/page.tsx",
            lineNumber: 90,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "flex flex-col gap-4 p-4 w-full mx-auto max-w-[1000px] sm:pt-[10vh]",
        children: [
            history.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: goBack,
                className: "flex items-center space-x-2 text-sm text-blue-500 hover:text-blue-700 transition-colors duration-200",
                children: "← Retour"
            }, void 0, false, {
                fileName: "[project]/app/documents/page.tsx",
                lineNumber: 101,
                columnNumber: 9
            }, this),
            items.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-6 sm:grid-cols-3 md:grid-cols-4 gap-6",
                children: items.map((item, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: ()=>item.type === "folder" ? enterFolder(item.path) : handleDownload(item.path),
                        className: "cursor-pointer flex flex-col items-center max-h-[150px] max-w-[100px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-5xl mb-2",
                                children: item.type === "folder" ? "📁" : getFileIcon(item.ext)
                            }, void 0, false, {
                                fileName: "[project]/app/documents/page.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center text-sm font-medium break-words overflow-hidden",
                                children: [
                                    item.name,
                                    ".",
                                    item.ext
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/documents/page.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this)
                        ]
                    }, idx, true, {
                        fileName: "[project]/app/documents/page.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/documents/page.tsx",
                lineNumber: 104,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-500 text-center",
                children: "Aucun document disponible pour ce dossier."
            }, void 0, false, {
                fileName: "[project]/app/documents/page.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/documents/page.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this);
}
_s(DocumentsPage, "EB7XdTgbM3eyenB1VZC/zcR8en4=");
_c = DocumentsPage;
var _c;
__turbopack_context__.k.register(_c, "DocumentsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_documents_page_tsx_6e74ad33._.js.map