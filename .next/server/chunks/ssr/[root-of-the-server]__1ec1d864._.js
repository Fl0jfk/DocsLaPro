module.exports = [
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/travels/[id]/edit/form.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// VoyageEditForm.tsx (client)
__turbopack_context__.s([
    "default",
    ()=>VoyageEditForm
]);
function VoyageEditForm({ voyageId }) {
    // voyageId est directement une string
    const { user, isLoaded } = useUser();
    const [voyage, setVoyage] = useState(null);
    const [formValues, setFormValues] = useState(null);
    useEffect(()=>{
        if (!isLoaded || !user) return;
        const fetchVoyage = async ()=>{
            const res = await fetch(`/api/travels/get?voyageId=${voyageId}`);
            const data = await res.json();
            setVoyage(data);
            setFormValues({
                lieu: data.lieu,
                activite: data.activite,
                date_depart: data.date_depart,
                date_retour: data.date_retour,
                classes: data.classes,
                effectif_eleves: data.effectif_eleves,
                effectif_accompagnateurs: data.effectif_accompagnateurs,
                commentaire: data.commentaire || ""
            });
        };
        fetchVoyage();
    }, [
        isLoaded,
        user,
        voyageId
    ]);
}
}),
"[project]/app/travels/[id]/edit/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/travels/[id]/edit/page.tsx
__turbopack_context__.s([
    "default",
    ()=>VoyageEditPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$travels$2f5b$id$5d2f$edit$2f$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/travels/[id]/edit/form.tsx [app-rsc] (ecmascript)");
;
;
function VoyageEditPage({ params }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$travels$2f5b$id$5d2f$edit$2f$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
        voyageId: params.id
    }, void 0, false, {
        fileName: "[project]/app/travels/[id]/edit/page.tsx",
        lineNumber: 5,
        columnNumber: 10
    }, this);
}
}),
"[project]/app/travels/[id]/edit/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/travels/[id]/edit/page.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1ec1d864._.js.map