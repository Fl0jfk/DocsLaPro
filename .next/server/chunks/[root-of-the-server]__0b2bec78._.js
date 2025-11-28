module.exports = [
"[project]/.next-internal/server/app/api/analyze-doc/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/app/api/analyze-doc/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/createGetAuth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$currentUser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/currentUser.js [app-route] (ecmascript)");
;
;
const USER_ONEDRIVE_BASES = {
    "HACQUEVILLE-MATHI": "Dossier élèves/Lycée",
    "VILLIER": "Dossier élèves/Collège",
    "LEBLOND": "Dossier élèves/École"
};
async function POST(req) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { userId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createGetAuth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuth"])(req);
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Non autorisé'
            }, {
                status: 401
            });
        }
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$currentUser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["currentUser"])();
        const lastName = (user?.lastName || "").toUpperCase();
        const { text } = await req.json();
        if (!text) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'text requis'
            }, {
                status: 400
            });
        }
        const extractionPrompt = `
Analyse ce document scolaire et extrais UNIQUEMENT les informations suivantes si elles sont clairement présentes dans le texte :
- Type de document (bulletin, relevé de notes, certificat de scolarité, diplôme, bac, etc.)
- Nom de famille de l'élève
- Prénom de l'élève
- INE de l'élève (identifiant national élève), si présent
- Date de naissance de l'élève (si présente)
- Classe ou niveau (si mentionné)
- Période (trimestre 1/2/3, semestre 1/2, année scolaire, etc.)
Si une information n'est PAS présente dans le document, écris exactement "non_trouvé" pour ce champ.
Ne devine JAMAIS, n'invente JAMAIS.
IMPORTANT : Réponds UNIQUEMENT avec du JSON valide, sans aucun commentaire, remarque, note explicative, ou texte supplémentaire.
Pas de markdown, pas de \`\`\`json, pas de notes entre parenthèses, pas de remarques après les valeurs.
Texte du document :
---
${text}
---
Format de réponse (JSON uniquement) :
{
  "type": "...",
  "nom": "...",
  "prénom": "...",
  "ine": "...",
  "date_naissance": "...",
  "classe": "...",
  "période": "..."
}
    `;
        const extractionResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [
                    {
                        role: "user",
                        content: extractionPrompt
                    }
                ],
                temperature: 0,
                response_format: {
                    type: "json_object"
                }
            })
        });
        if (!extractionResponse.ok) {
            const err = await extractionResponse.text();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Erreur Mistral extraction: ${err}`
            }, {
                status: extractionResponse.status
            });
        }
        const extractionData = await extractionResponse.json();
        let extractionResult = extractionData.choices?.[0]?.message?.content || '';
        extractionResult = extractionResult.trim();
        extractionResult = extractionResult.replace(/`{3}json/gi, '');
        extractionResult = extractionResult.replace(/`{3}/g, '');
        extractionResult = extractionResult.replace(/\n/g, ' ');
        extractionResult = extractionResult.trim();
        extractionResult = extractionResult.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '').replace(/,\s*\*\(.*?\)\*/g, '');
        const jsonStartIndex = extractionResult.indexOf('{');
        const jsonEndIndex = extractionResult.lastIndexOf('}');
        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Aucun JSON trouvé dans la réponse",
                brut: extractionResult
            }, {
                status: 500
            });
        }
        const cleanJson = extractionResult.substring(jsonStartIndex, jsonEndIndex + 1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let extracted;
        try {
            extracted = JSON.parse(cleanJson);
        } catch (parseError) {
            const superCleanJson = cleanJson.replace(/\s+/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            try {
                extracted = JSON.parse(superCleanJson);
            } catch  {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "JSON invalide après extraction",
                    brut: extractionResult,
                    cleaned: cleanJson,
                    parseError: String(parseError)
                }, {
                    status: 500
                });
            }
        }
        let oneDriveFolderPath = null;
        let matchedEleve = null;
        try {
            const matchRes = await fetch(`${("TURBOPACK compile-time value", "http://localhost:3000/")}api/match-eleve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    clerkUserId: userId,
                    ine: extracted.ine,
                    nom: extracted.nom,
                    prénom: extracted.prénom,
                    texteDocument: text
                })
            });
            if (matchRes.ok) {
                const matchData = await matchRes.json();
                matchedEleve = matchData.eleve || null;
                if (matchedEleve?.folderName) {
                    const userBase = lastName && USER_ONEDRIVE_BASES[lastName] || "Dossier élèves/Lycée";
                    oneDriveFolderPath = `${userBase}/${matchedEleve.folderName}`;
                }
            } else {
                const errText = await matchRes.text();
                console.error("Erreur /api/match-eleve:", errText);
            }
        } catch (e) {
            console.error("Erreur appel /api/match-eleve:", e);
        }
        const namingPrompt = `
Tu es un système de nommage de fichiers pour une école.

Voici les informations extraites d'un document :
- Type : ${extracted.type || "non_trouvé"}
- Nom : ${extracted.nom || "non_trouvé"}
- Prénom : ${extracted.prénom || "non_trouvé"}
- INE : ${extracted.ine || "non_trouvé"}
- Date de naissance : ${extracted.date_naissance || "non_trouvé"}
- Classe : ${extracted.classe || "non_trouvé"}
- Période : ${extracted.période || "non_trouvé"}
Génère un nom de fichier selon ces règles :
1. Format général : Type Période Classe NOM Prénom
2. Si une information vaut "non_trouvé", ne l'inclus PAS dans le nom
3. Garde les accents et caractères spéciaux
4. Exemples :
   - Bulletin trimestre1 3eme DUPONT Jean
   - Baccalauréat MARTIN Sophie
   - Certificat de scolarité BERNARD Luc
   - Relevé de notes du semestre2 2nde PETIT Marie
Réponds UNIQUEMENT avec le nom de fichier (sans extension), rien d'autre. Pas de ponctuation finale.
    `;
        const namingResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [
                    {
                        role: "user",
                        content: namingPrompt
                    }
                ],
                temperature: 0
            })
        });
        if (!namingResponse.ok) {
            const err = await namingResponse.text();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Erreur Mistral naming: ${err}`
            }, {
                status: namingResponse.status
            });
        }
        const namingData = await namingResponse.json();
        let fileName = namingData.choices?.[0]?.message?.content?.trim() || '';
        fileName = fileName.replace(/[<>:"/\\|?*]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ...extracted,
            eleve: {
                nom: extracted.nom !== "non_trouvé" ? extracted.nom : null,
                prénom: extracted.prénom !== "non_trouvé" ? extracted.prénom : null,
                classe: extracted.classe !== "non_trouvé" ? extracted.classe : null,
                ine: extracted.ine !== "non_trouvé" ? extracted.ine : null,
                date_naissance: extracted.date_naissance !== "non_trouvé" ? extracted.date_naissance : null
            },
            fileName,
            rawExtraction: extracted,
            oneDriveFolderPath,
            matchedEleve
        });
    } catch (error) {
        console.error('Erreur analyse Mistral:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: String(error)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0b2bec78._.js.map