module.exports = [
"[project]/.next-internal/server/app/api/match-eleve/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@aws-sdk/client-s3", () => require("@aws-sdk/client-s3"));

module.exports = mod;
}),
"[project]/app/api/match-eleve/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/match-eleve/route.ts
__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/createGetAuth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs)");
;
;
;
const s3 = new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["S3Client"]({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    }
});
const BUCKET = process.env.ELEVES_CONFIG_BUCKET;
const KEY = process.env.ELEVES_CONFIG_KEY || "config/eleves.json";
async function getElevesFromS3() {
    const res = await s3.send(new __TURBOPACK__imported__module__$5b$externals$5d2f40$aws$2d$sdk$2f$client$2d$s3__$5b$external$5d$__$2840$aws$2d$sdk$2f$client$2d$s3$2c$__cjs$29$__["GetObjectCommand"]({
        Bucket: BUCKET,
        Key: KEY
    }));
    const body = await res.Body?.transformToString("utf-8");
    if (!body) return [];
    return JSON.parse(body);
}
// Normalisation très simple pour comparer les noms
function normalize(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // accents
    .toLowerCase().replace(/[-\s]+/g, " ") // tirets/espaces homogènes
    .trim();
}
// petit score "similitude" nom/prénom
function nameSimilarity(aNom, aPrenom, bNom, bPrenom) {
    const an = normalize(aNom);
    const ap = normalize(aPrenom);
    const bn = normalize(bNom);
    const bp = normalize(bPrenom);
    let score = 0;
    if (an && bn && (an === bn || bn.includes(an) || an.includes(bn))) score += 2;
    if (ap && bp && (ap === bp || bp.includes(ap) || ap.includes(bp))) score += 2;
    return score;
}
async function POST(req) {
    try {
        const { userId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuth"])(req);
        console.log("[match-eleve] userId =", userId);
        if (!userId) {
            console.log("[match-eleve] 401 non autorisé");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Non autorisé"
            }, {
                status: 401
            });
        }
        const { ine, nom, prénom, texteDocument } = await req.json();
        console.log("[match-eleve] body =", {
            ine,
            nom,
            prénom
        });
        const eleves = await getElevesFromS3();
        console.log("[match-eleve] nb eleves =", eleves.length);
        // 1) Match direct sur INE si présent
        if (ine && ine !== "non_trouvé") {
            const found = eleves.find((e)=>e.ine && e.ine.trim().toUpperCase() === ine.trim().toUpperCase());
            if (found) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    matchType: "ine",
                    eleve: found
                });
            }
        }
        // 2) Fallback: shortlist sur nom + prénom
        if (!nom || !prénom || nom === "non_trouvé" || prénom === "non_trouvé") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                matchType: "none",
                eleve: null
            });
        }
        const scored = eleves.map((e)=>({
                eleve: e,
                score: nameSimilarity(nom, prénom, e.nom, e.prenom)
            }));
        // garder les meilleurs scores
        const sorted = scored.filter((s)=>s.score > 0).sort((a, b)=>b.score - a.score).slice(0, 5); // shortlist max 5
        if (sorted.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                matchType: "none",
                eleve: null
            });
        }
        const shortlist = sorted.map((s)=>s.eleve);
        // 3) Demander à Mistral de choisir dans la shortlist
        if (!texteDocument) {
            // pas de texte → on se contente du meilleur score
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                matchType: "best_score",
                eleve: shortlist[0]
            });
        }
        const shortlistDescription = shortlist.map((e, idx)=>`${idx + 1}. INE: ${e.ine}, Nom: ${e.nom}, Prénom: ${e.prenom}, Dossier: ${e.folderName}`).join("\n");
        const selectionPrompt = `
Tu es un système qui associe un document scolaire à l'élève correspondant.

Voici le texte OCR brut du document :
---
${texteDocument}
---

Voici une liste de quelques élèves possibles (shortlist) :
${shortlistDescription}

Règles :
- Analyse le texte du document.
- Compare avec les informations de chaque élève (nom, prénom, INE si présent dans le texte).
- Choisis l'index de l'élève qui correspond le mieux au document.
- Si aucun élève ne correspond de manière raisonnable, répond "0".

Réponds UNIQUEMENT avec un JSON valide de la forme :
{"index": 0}
ou
{"index": 1}
ou
{"index": 2}
etc.
`;
        const selectionResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [
                    {
                        role: "user",
                        content: selectionPrompt
                    }
                ],
                temperature: 0,
                response_format: {
                    type: "json_object"
                }
            })
        });
        if (!selectionResponse.ok) {
            const err = await selectionResponse.text();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Erreur Mistral selection élève: ${err}`
            }, {
                status: selectionResponse.status
            });
        }
        const selectionData = await selectionResponse.json();
        let content = selectionData.choices?.[0]?.message?.content || "";
        content = content.trim();
        let selectedIndex = 0;
        try {
            const parsed = JSON.parse(content);
            selectedIndex = parsed.index ?? 0;
        } catch  {
            selectedIndex = 0;
        }
        if (!selectedIndex || selectedIndex < 1 || selectedIndex > shortlist.length) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                matchType: "shortlist_none",
                eleve: null
            });
        }
        const selectedEleve = shortlist[selectedIndex - 1];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            matchType: "shortlist_mistral",
            eleve: selectedEleve
        });
    } catch (error) {
        console.error("Erreur POST /api/match-eleve:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: String(error)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a62968da._.js.map