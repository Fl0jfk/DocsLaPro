module.exports = [
"[project]/.next-internal/server/app/api/move-file/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/app/api/move-file/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/move-file-onedrive/route.ts
__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/createGetAuth.js [app-route] (ecmascript)");
;
;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
async function POST(req) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { userId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuth"])(req);
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Non autorisé"
            }, {
                status: 401
            });
        }
        const body = await req.json();
        const { accessToken, sourcePath, targetFolderPath, newFileName } = body;
        if (!accessToken) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "accessToken manquant"
            }, {
                status: 400
            });
        }
        if (!sourcePath || !targetFolderPath) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "sourcePath et targetFolderPath sont requis"
            }, {
                status: 400
            });
        }
        const sourceRes = await fetch(`${GRAPH_BASE}/me/drive/root:/${sourcePath}:`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!sourceRes.ok) {
            const errText = await sourceRes.text();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Erreur récupération fichier source",
                details: errText
            }, {
                status: sourceRes.status
            });
        }
        const sourceItem = await sourceRes.json();
        const sourceItemId = sourceItem.id;
        const driveId = sourceItem.parentReference?.driveId;
        if (!sourceItemId || !driveId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Impossible de récupérer l'ID du fichier source ou du drive"
            }, {
                status: 500
            });
        }
        const targetFolderRes = await fetch(`${GRAPH_BASE}/me/drive/root:/${targetFolderPath}:`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!targetFolderRes.ok) {
            const errText = await targetFolderRes.text();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Erreur récupération dossier cible",
                details: errText
            }, {
                status: targetFolderRes.status
            });
        }
        const targetFolder = await targetFolderRes.json();
        const targetFolderId = targetFolder.id;
        if (!targetFolderId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Impossible de récupérer l'ID du dossier cible"
            }, {
                status: 500
            });
        }
        const finalFileName = newFileName && newFileName.trim().length > 0 ? newFileName.trim() : sourceItem.name;
        const childrenRes = await fetch(`${GRAPH_BASE}/drives/${driveId}/items/${targetFolderId}/children`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let children = [];
        if (childrenRes.ok) {
            const childrenJson = await childrenRes.json();
            children = childrenJson.value || [];
        }
        const dotIndex = finalFileName.lastIndexOf(".");
        const base = dotIndex > 0 ? finalFileName.slice(0, dotIndex) : finalFileName;
        const ext = dotIndex > 0 ? finalFileName.slice(dotIndex) : "";
        let safeName = finalFileName;
        let suffix = 2;
        while(children.some((c)=>c.name === safeName)){
            safeName = `${base} (${suffix})${ext}`;
            suffix++;
        }
        const moveRes = await fetch(`${GRAPH_BASE}/drives/${driveId}/items/${sourceItemId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                parentReference: {
                    id: targetFolderId
                },
                name: safeName
            })
        });
        if (!moveRes.ok) {
            const errText = await moveRes.text();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Erreur lors du déplacement du fichier",
                details: errText
            }, {
                status: moveRes.status
            });
        }
        const movedItem = await moveRes.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: "Fichier déplacé vers le dossier cible",
            itemId: movedItem.id,
            finalFileName: safeName,
            targetFolderId
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: String(error)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a4893c98._.js.map