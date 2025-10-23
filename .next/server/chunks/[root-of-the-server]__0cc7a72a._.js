module.exports = {

"[project]/.next-internal/server/app/api/documents/list/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}}),
"[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("@aws-sdk/client-s3", () => require("@aws-sdk/client-s3"));

module.exports = mod;
}}),
"[externals]/node:crypto [external] (node:crypto, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[project]/app/api/documents/list/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET
});
var __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/createGetAuth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/clerkClient.js [app-route] (ecmascript)");
;
;
const s3 = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["S3Client"]({
    region: "eu-west-3",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
});
async function GET(req) {
    const { userId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuth"])(req);
    if (!userId) {
        return new Response(JSON.stringify({
            error: "Non autorisé"
        }), {
            status: 401
        });
    }
    const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
    const user = await client.users.getUser(userId);
    const rawRole = user.publicMetadata.role ?? [];
    const roles = Array.isArray(rawRole) ? rawRole : typeof rawRole === "string" ? [
        rawRole
    ] : [];
    const baseFolders = [];
    if (roles.includes("professeur")) baseFolders.push("professeurs/");
    if (roles.includes("administratif")) baseFolders.push("administratif/");
    if (roles.includes("direction")) baseFolders.push("direction/");
    if (roles.includes("comptabilite")) baseFolders.push("Compta RH/");
    if (roles.includes("education")) baseFolders.push("education/");
    const userFolders = [
        ...new Set(baseFolders.map((f)=>`documents/${f}`))
    ];
    const url = new URL(req.url);
    const prefixParam = url.searchParams.get("prefix") || "";
    try {
        const allItems = [];
        for (const folderPrefix of userFolders){
            const effectivePrefix = prefixParam.startsWith("documents/") ? prefixParam : `${folderPrefix}${prefixParam}`;
            const command = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["ListObjectsV2Command"]({
                Bucket: process.env.BUCKET_NAME,
                Prefix: effectivePrefix,
                Delimiter: "/"
            });
            const response = await s3.send(command);
            const folders = response.CommonPrefixes?.map((p)=>({
                    type: "folder",
                    name: `${p.Prefix.split("/").slice(-2, -1)[0]} (${folderPrefix.replace("documents/", "")})`,
                    path: p.Prefix
                })) || [];
            const files = (response.Contents || []).filter((file)=>file.Key && !file.Key.endsWith("/")).filter((file)=>[
                    ".pdf",
                    ".doc",
                    ".docx",
                    ".xls",
                    ".xlsx"
                ].some((ext)=>file.Key.toLowerCase().endsWith(ext))).map((file)=>({
                    type: "file",
                    name: file.Key.split("/").pop().replace(/\.(pdf|docx?|xlsx?|xls)$/, ""),
                    path: file.Key,
                    ext: file.Key.split(".").pop()?.toLowerCase()
                }));
            allItems.push(...folders, ...files);
        }
        const uniqueItems = Array.from(new Map(allItems.map((item)=>[
                item.path,
                item
            ])).values());
        return new Response(JSON.stringify(uniqueItems), {
            status: 200
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err) {
        console.error("Erreur S3:", err);
        return new Response(JSON.stringify({
            error: err.message
        }), {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__0cc7a72a._.js.map