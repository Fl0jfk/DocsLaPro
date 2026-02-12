import { NextResponse } from 'next/server';
import { getAuth, currentUser } from '@clerk/nextjs/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.BUCKET_NAME!;
const KEY = "eleves.json";

type EleveConfig = {
  ine: string;
  nom: string;
  prenom: string;
  folderName: string;
};

const USER_ONEDRIVE_BASES: Record<string, string> = { "HACQUEVILLE-MATHI": "Dossier élèves/Lycée", "VILLIER": "Dossier élèves/Collège", "LEBLOND": "Dossier élèves/École"};

async function getElevesFromS3(): Promise<EleveConfig[]> {
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
    })
  );
  const body = await res.Body?.transformToString("utf-8");
  if (!body) return [];
  return JSON.parse(body) as EleveConfig[];
}

function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-\s]+/g, " ").trim();
}

function nameSimilarity(
  aNom: string,
  aPrenom: string,
  bNom: string,
  bPrenom: string
): number {
  const an = normalize(aNom);
  const ap = normalize(aPrenom);
  const bn = normalize(bNom);
  const bp = normalize(bPrenom);
  let score = 0;
  if (an && bn && (an === bn || bn.includes(an) || an.includes(bn))) score += 2;
  if (ap && bp && (ap === bp || bp.includes(ap) || ap.includes(bp))) score += 2;
  return score;
}

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) { return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })}
    const user = await currentUser();
    const lastName = (user?.lastName || "").toUpperCase();
    const { text } = await req.json();
    if (!text) { return NextResponse.json({ error: 'text requis' }, { status: 400 })}
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
        messages: [{ role: "user", content: extractionPrompt }],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });
    if (!extractionResponse.ok) {
      const err = await extractionResponse.text();
      return NextResponse.json({ error: `Erreur Mistral extraction: ${err}` }, { status: extractionResponse.status });
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
    if (jsonStartIndex === -1 || jsonEndIndex === -1) { return NextResponse.json({ error: "Aucun JSON trouvé dans la réponse", brut: extractionResult }, { status: 500 })}
    const cleanJson = extractionResult.substring(jsonStartIndex, jsonEndIndex + 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let extracted: any;
    try {
      extracted = JSON.parse(cleanJson);
    } catch (parseError) {
      const superCleanJson = cleanJson.replace(/\s+/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      try {
        extracted = JSON.parse(superCleanJson);
      } catch {
        return NextResponse.json({
            error: "JSON invalide après extraction",
            brut: extractionResult,
            cleaned: cleanJson,
            parseError: String(parseError)
          }, { status: 500 });
      }
    }
    let oneDriveFolderPath: string | null = null;
    let matchedEleve: { ine: string; nom: string; prenom: string; folderName: string } | null = null;
    try {
      const eleves = await getElevesFromS3();
      const { ine, nom, prénom } = extracted;
      if (ine && ine !== "non_trouvé") {
        const ineTrim = ine.trim().toUpperCase();
        const found = eleves.find((e) => e.ine && e.ine.trim().toUpperCase() === ineTrim);
        if (found) {matchedEleve = found}
      }
      if (!matchedEleve && nom && prénom && nom !== "non_trouvé" && prénom !== "non_trouvé") {
        const scored = eleves.map((e) => ({
          eleve: e,
          score: nameSimilarity(nom, prénom, e.nom, e.prenom),
        }));
        const sorted = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
        if (sorted.length > 0) {
          const shortlist = sorted.map((s) => s.eleve);
          const shortlistDescription = shortlist.map((e, idx) => `${idx + 1}. INE: ${e.ine}, Nom: ${e.nom}, Prénom: ${e.prenom}, Dossier: ${e.folderName}`).join("\n");
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
            ou
            {"index": 1}
            ou
            {"index": 2}
            etc.
            `;
          const selectionResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
              'Content-Type': 'application/json'
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
            let content = (selectionData.choices?.[0]?.message?.content || "").trim();
            let selectedIndex = 0;
            try {
              const parsed = JSON.parse(content);
              selectedIndex = parsed.index ?? 0;
            } catch {
              selectedIndex = 0;
            }
            if (selectedIndex > 0 && selectedIndex <= shortlist.length) {
              matchedEleve = shortlist[selectedIndex - 1];
            }
          }
        }
      }
      if (matchedEleve?.folderName) {
        const userBase = (lastName && USER_ONEDRIVE_BASES[lastName]) || "Dossier élèves/Lycée";
        oneDriveFolderPath = `${userBase}/${matchedEleve.folderName}`;
      }
    } catch (e) {
      console.error("Erreur matching interne:", e);
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
        messages: [{ role: "user", content: namingPrompt }],
        temperature: 0
      })
    });
    if (!namingResponse.ok) {
      const err = await namingResponse.text();
      return NextResponse.json({ error: `Erreur Mistral naming: ${err}` }, { status: namingResponse.status });
    }
    const namingData = await namingResponse.json();
    let fileName = namingData.choices?.[0]?.message?.content?.trim() || '';
    fileName = fileName.replace(/[<>:"/\\|?*]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return NextResponse.json({
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
      matchedEleve,
    });
  } catch (error) {
    console.error('Erreur analyse Mistral:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}