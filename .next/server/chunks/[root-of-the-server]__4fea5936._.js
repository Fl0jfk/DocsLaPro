module.exports = [
"[project]/.next-internal/server/app/api/travels/create/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@aws-sdk/client-s3", () => require("@aws-sdk/client-s3"));

module.exports = mod;
}),
"[project]/app/utils/voyageStore.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BUCKET",
    ()=>BUCKET,
    "addVoyage",
    ()=>addVoyage,
    "readVoyages",
    ()=>readVoyages,
    "removeVoyage",
    ()=>removeVoyage,
    "s3",
    ()=>s3,
    "writeVoyages",
    ()=>writeVoyages
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)");
;
const s3 = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["S3Client"]({
    region: "eu-west-3",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const KEY = "voyages_en_attente.json";
async function readVoyages() {
    try {
        const obj = await s3.send(new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["GetObjectCommand"]({
            Bucket: BUCKET,
            Key: KEY
        }));
        const body = await obj.Body?.transformToString();
        return body ? JSON.parse(body) : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e) {
        if (e.$metadata?.httpStatusCode === 404) return [];
        throw e;
    }
}
async function writeVoyages(entries) {
    await s3.send(new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["PutObjectCommand"]({
        Bucket: BUCKET,
        Key: KEY,
        Body: JSON.stringify(entries, null, 2),
        ContentType: "application/json"
    }));
}
async function addVoyage(entry) {
    const entries = await readVoyages();
    entries.push(entry);
    await writeVoyages(entries);
}
async function removeVoyage(id) {
    const entries = await readVoyages();
    const out = entries.filter((e)=>e.id !== id);
    await writeVoyages(out);
}
}),
"[project]/app/api/travels/create/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-route] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$voyageStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/utils/voyageStore.ts [app-route] (ecmascript)");
;
;
;
const RECIPIENTS = {
    direction_ecole: [
        "flojfk+direction.ecole@gmail.com"
    ],
    direction_college: [
        "flojfk+direction.college@gmail.com"
    ],
    direction_lycee: [
        "flojfk+direction.lycee@gmail.com"
    ],
    default: [
        "secretariat@domaine.fr"
    ]
};
async function POST(req) {
    const form = await req.formData();
    const direction_cible = form.get("direction_cible");
    const files = form.getAll("pj").filter((f)=>f instanceof File);
    if (files.length > 5) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Pas plus de 5 fichiers"
    }, {
        status: 400
    });
    const pieces_jointes = [];
    for (const file of files){
        const buf = await file.arrayBuffer();
        pieces_jointes.push({
            filename: file.name,
            buffer: Buffer.from(buf).toString("base64"),
            type: file.type
        });
    }
    const programmeFile = form.get("programme") instanceof File ? form.get("programme") : null;
    let programme = null;
    if (programmeFile) {
        const progBuf = await programmeFile.arrayBuffer();
        programme = {
            filename: programmeFile.name,
            buffer: Buffer.from(progBuf).toString("base64"),
            type: programmeFile.type
        };
    }
    const voyage = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        prenom: form.get("prenom"),
        nom: form.get("nom"),
        email: form.get("email"),
        direction_cible: direction_cible,
        date_depart: form.get("date_depart"),
        date_retour: form.get("date_retour"),
        lieu: form.get("lieu"),
        activite: form.get("activite"),
        classes: form.get("classes"),
        effectif_eleves: Number(form.get("effectif_eleves") || 0),
        effectif_accompagnateurs: Number(form.get("effectif_accompagnateurs") || 0),
        commentaire: form.get("commentaire"),
        pieces_jointes,
        programme,
        etat: "en_attente",
        date_declaration: new Date().toISOString()
    };
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$voyageStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addVoyage"])(voyage);
    const attachments = [
        ...programme ? [
            {
                filename: programme.filename,
                content: Buffer.from(programme.buffer, "base64"),
                contentType: programme.type
            }
        ] : [],
        ...pieces_jointes.map((f)=>({
                filename: f.filename,
                content: Buffer.from(f.buffer, "base64"),
                contentType: f.type
            }))
    ];
    const to = RECIPIENTS[direction_cible] || RECIPIENTS.default;
    const subject = `[Voyage scolaire] Nouvelle demande à valider - ${voyage.lieu}`;
    const text = `Nouvelle demande de voyage scolaire:\n\n` + `Établissement : ${direction_cible}\n` + `Demandeur : ${voyage.prenom} ${voyage.nom} (${voyage.email})\n` + `Dates : du ${voyage.date_depart} au ${voyage.date_retour}\n` + `Lieu/activité : ${voyage.lieu} | ${voyage.activite}\n` + `Classes concernées : ${voyage.classes}\n` + `Élèves : ${voyage.effectif_eleves} | Accompagnateurs : ${voyage.effectif_accompagnateurs}\n` + (voyage.commentaire ? `Programme : ${voyage.commentaire}\n` : "") + `\nLien de validation : ${("TURBOPACK compile-time value", "https://docslapro.com") || "http://localhost:3000"}/travels/validate?id=${voyage.id}`;
    await fetch(`${("TURBOPACK compile-time value", "https://docslapro.com") || "http://localhost:3000"}/api/email`, {
        method: "POST",
        body: JSON.stringify({
            to,
            subject,
            text,
            attachments
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        success: true,
        message: "Demande enregistrée et transmise à la direction."
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4fea5936._.js.map