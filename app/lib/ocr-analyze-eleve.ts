import "server-only";

import { getJson } from "@/app/lib/s3-storage";
import type { EleveConfig } from "@/app/lib/eleves-config";
import { resolveEleveFolderName } from "@/app/lib/eleves-config";
import { loadMefSecteurMap } from "@/app/lib/mef-secteurs";
import {
  buildElevesPoolForOcrMatching,
  oneDrivePathForEleve,
} from "@/app/lib/onedrive-eleves";
import type { OneDriveUserProfile } from "@/app/lib/onedrive-user-profiles";
import { getMistralApiKey } from "@/app/lib/tenant-config";

const KEY = "eleves.json";

async function getElevesFromS3(): Promise<EleveConfig[]> {
  const hit = await getJson<EleveConfig[]>(KEY);
  return Array.isArray(hit?.data) ? hit.data : [];
}

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();
}

function normalizeIne(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Proximité 0→1 entre deux chaînes (1 = identiques). */
function closeness(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Score de similarité nom/prénom, tolérant aux fautes d'OCR.
 * Accepte un appariement même si un seul des deux champs est exploitable.
 */
function nameSimilarity(aNom: string, aPrenom: string, bNom: string, bPrenom: string): number {
  const an = normalize(aNom);
  const ap = normalize(aPrenom);
  const bn = normalize(bNom);
  const bp = normalize(bPrenom);

  let score = 0;
  if (an && bn) {
    const c = closeness(an, bn);
    if (c >= 0.8) score += 2 * c;
  }
  if (ap && bp) {
    const c = closeness(ap, bp);
    if (c >= 0.8) score += 2 * c;
  }
  // Inversion nom/prénom fréquente sur les bulletins.
  if (an && bp && ap && bn) {
    const cross = (closeness(an, bp) + closeness(ap, bn)) / 2;
    if (cross >= 0.9) score = Math.max(score, 3.5);
  }
  return score;
}

export type OcrAnalyzeResult = {
  fileName: string;
  oneDriveFolderPath: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export async function analyzeDocMatchEleve(
  text: string,
  odProfile: OneDriveUserProfile | null,
): Promise<OcrAnalyzeResult> {
  const mistralKey = await getMistralApiKey();
  if (!mistralKey) throw new Error("Service IA non configuré (MISTRAL_API_KEY).");

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

  const extractionResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mistralKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-medium",
      messages: [{ role: "user", content: extractionPrompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });
  if (!extractionResponse.ok) {
    throw new Error(`Erreur Mistral extraction: ${await extractionResponse.text()}`);
  }

  const extractionData = await extractionResponse.json();
  let extractionResult = extractionData.choices?.[0]?.message?.content || "";
  extractionResult = extractionResult.trim().replace(/`{3}json/gi, "").replace(/`{3}/g, "");
  extractionResult = extractionResult.replace(/\n/g, " ").trim();
  extractionResult = extractionResult
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*/g, "")
    .replace(/,\s*\*\(.*?\)\*/g, "");
  const jsonStartIndex = extractionResult.indexOf("{");
  const jsonEndIndex = extractionResult.lastIndexOf("}");
  if (jsonStartIndex === -1 || jsonEndIndex === -1) {
    throw new Error("Aucun JSON trouvé dans la réponse Mistral");
  }
  const cleanJson = extractionResult.substring(jsonStartIndex, jsonEndIndex + 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extracted: any;
  try {
    extracted = JSON.parse(cleanJson);
  } catch (parseError) {
    const superCleanJson = cleanJson.replace(/\s+/g, " ").replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    try {
      extracted = JSON.parse(superCleanJson);
    } catch {
      throw new Error(`JSON invalide après extraction: ${String(parseError)}`);
    }
  }

  let oneDriveFolderPath: string | null = null;
  let matchedEleve: { ine: string; nom: string; prenom: string; folderName: string } | null = null;
  let matchDebug: Record<string, unknown> = {};

  try {
    const mefMap = await loadMefSecteurMap();
    const allEleves = await getElevesFromS3();
    const { eleves, secteurFilterApplied } = buildElevesPoolForOcrMatching(allEleves, odProfile, mefMap);
    matchDebug = {
      totalEleves: allEleves.length,
      elevesInPool: eleves.length,
      secteurFilterApplied,
      secteur: odProfile?.secteur ?? null,
      secteurLabel: odProfile?.label ?? null,
      mefCodesInTable: mefMap.size,
      hasOneDriveProfile: Boolean(odProfile),
    };
    const { ine, nom, prénom } = extracted;
    const hasNom = nom && nom !== "non_trouvé";
    const hasPrenom = prénom && prénom !== "non_trouvé";
    if (ine && ine !== "non_trouvé") {
      const ineNorm = normalizeIne(ine);
      if (ineNorm) {
        const found = eleves.find((e) => e.ine && normalizeIne(e.ine) === ineNorm);
        if (found) matchedEleve = found;
      }
    }
    if (!matchedEleve && (hasNom || hasPrenom)) {
      const scored = eleves
        .map((e) => ({
          eleve: e,
          score: nameSimilarity(hasNom ? nom : "", hasPrenom ? prénom : "", e.nom, e.prenom),
        }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      if (scored.length > 0) {
        const shortlist = scored.map((s) => s.eleve);
        const shortlistDescription = shortlist
          .map((e, idx) => `${idx + 1}. INE: ${e.ine}, Nom: ${e.nom}, Prénom: ${e.prenom}, Dossier: ${e.folderName}`)
          .join("\n");
        const selectionPrompt = `
            Tu es un système qui associe un document scolaire à l'élève correspondant.
            Voici le texte OCR brut du document :
            ---
            ${text}
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
            `;
        const selectionResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mistralKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mistral-medium",
            messages: [{ role: "user", content: selectionPrompt }],
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        });
        if (selectionResponse.ok) {
          const selectionData = await selectionResponse.json();
          const content = (selectionData.choices?.[0]?.message?.content || "").trim();
          let selectedIndex = 0;
          try {
            selectedIndex = JSON.parse(content).index ?? 0;
          } catch {
            selectedIndex = 0;
          }
          if (selectedIndex > 0 && selectedIndex <= shortlist.length) {
            matchedEleve = shortlist[selectedIndex - 1];
          }
        }
      }
    }
    if (matchedEleve && odProfile) {
      oneDriveFolderPath = oneDrivePathForEleve(odProfile.basePath, resolveEleveFolderName(matchedEleve));
    }
  } catch (e) {
    console.error("[ocr-analyze] matching:", e);
    matchDebug = { ...matchDebug, matchingError: e instanceof Error ? e.message : String(e) };
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
      Réponds UNIQUEMENT avec le nom de fichier (sans extension), rien d'autre.
    `;

  const namingResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mistralKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-medium",
      messages: [{ role: "user", content: namingPrompt }],
      temperature: 0,
    }),
  });
  if (!namingResponse.ok) {
    throw new Error(`Erreur Mistral naming: ${await namingResponse.text()}`);
  }
  const namingData = await namingResponse.json();
  let fileName = namingData.choices?.[0]?.message?.content?.trim() || "";
  fileName = fileName.replace(/[<>:"/\\|?*]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");

  return {
    ...extracted,
    eleve: {
      nom: extracted.nom !== "non_trouvé" ? extracted.nom : null,
      prénom: extracted.prénom !== "non_trouvé" ? extracted.prénom : null,
      classe: extracted.classe !== "non_trouvé" ? extracted.classe : null,
      ine: extracted.ine !== "non_trouvé" ? extracted.ine : null,
      date_naissance: extracted.date_naissance !== "non_trouvé" ? extracted.date_naissance : null,
    },
    fileName,
    rawExtraction: extracted,
    oneDriveFolderPath,
    matchedEleve,
    matchDebug,
  };
}
