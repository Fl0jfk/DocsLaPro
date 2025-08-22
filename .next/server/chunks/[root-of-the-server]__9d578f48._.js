module.exports = {

"[project]/.next-internal/server/app/api/absence/want/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

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
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("@aws-sdk/client-s3", () => require("@aws-sdk/client-s3"));

module.exports = mod;
}}),
"[project]/app/utils/jsonStore.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// app/utils/jsonStore.ts
__turbopack_context__.s({
    "BUCKET": ()=>BUCKET,
    "addEntry": ()=>addEntry,
    "readStore": ()=>readStore,
    "removeEntry": ()=>removeEntry,
    "s3": ()=>s3,
    "writeStore": ()=>writeStore
});
var __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)");
;
const s3 = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["S3Client"]({
    region: process.env.AWS_REGION || "eu-west-3",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const KEY = "absences_en_attente.json";
async function readStore() {
    try {
        const obj = await s3.send(new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["GetObjectCommand"]({
            Bucket: BUCKET,
            Key: KEY
        }));
        const body = await obj.Body?.transformToString();
        return body ? JSON.parse(body) : [];
    } catch (e) {
        // Si l'objet n'existe pas encore
        if (e?.$metadata?.httpStatusCode === 404) return [];
        throw e;
    }
}
async function writeStore(entries) {
    await s3.send(new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["PutObjectCommand"]({
        Bucket: BUCKET,
        Key: KEY,
        Body: JSON.stringify(entries, null, 2),
        ContentType: "application/json"
    }));
}
async function addEntry(entry) {
    const entries = await readStore();
    entries.push(entry);
    await writeStore(entries);
}
async function removeEntry(id) {
    const entries = await readStore();
    const out = entries.filter((e)=>e.id !== id);
    await writeStore(out);
}
}),
"[project]/app/api/absence/want/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-route] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$jsonStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/utils/jsonStore.ts [app-route] (ecmascript)");
;
;
;
const MAX_FILES = 5;
const ALLOWED_MIME = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp"
]);
async function POST(req) {
    try {
        const data = await req.formData();
        const type = data.get("type");
        const cible = data.get("cible");
        const nom = data.get("nom") || "";
        const email = data.get("email") || "";
        const date_debut = data.get("date_debut");
        const date_fin = data.get("date_fin");
        const motif = data.get("motif");
        const commentaire = data.get("commentaire") || undefined;
        if (!type || !cible || !nom || !email || !date_debut || !date_fin || !motif) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Champs requis manquants."
            }, {
                status: 400
            });
        }
        const files = data.getAll("attachments").filter((f)=>f instanceof File);
        if (files.length > MAX_FILES) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Pas plus de ${MAX_FILES} fichiers.`
            }, {
                status: 400
            });
        }
        const attachments = [];
        for (const file of files){
            if (!ALLOWED_MIME.has(file.type)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `Type de fichier non autorisé: ${file.name}`
                }, {
                    status: 400
                });
            }
            const arrayBuffer = await file.arrayBuffer();
            attachments.push({
                filename: file.name,
                buffer: Buffer.from(arrayBuffer).toString("base64"),
                type: file.type
            });
        }
        const absence = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            type,
            cible,
            nom,
            email,
            date_debut,
            date_fin,
            motif,
            commentaire,
            justificatifs: attachments,
            etat: "en_attente",
            date_declaration: new Date().toISOString()
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$jsonStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addEntry"])(absence);
        const appUrl = ("TURBOPACK compile-time value", "https://docs-la-pro.vercel.app") || "http://localhost:3000";
        const lien = `${appUrl}/validationAbsences?id=${absence.id}`;
        console.log("📌 Nouvelle demande d'absence:", absence);
        console.log("🔗 Lien pour traitement:", lien);
        console.log("📩 Envoi du mail via /api/email...");
        await fetch(`${appUrl}/api/email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                target: cible,
                subject: `[Absence] Nouvelle demande (${motif})`,
                text: `Nouvelle demande d'absence de ${nom} (${email}) du ${date_debut} au ${date_fin}.\nMotif: ${motif}\nCliquez pour traiter: ${lien}`,
                replyTo: email,
                attachments
            })
        });
        console.log("✅ Mail envoyé via /api/email");
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: "Demande enregistrée et transmise à la direction."
        });
    } catch (err) {
        console.error("❌ Erreur /api/absence/want:", err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Erreur serveur"
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__9d578f48._.js.map