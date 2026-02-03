// app/api/match-eleve/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();
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

export async function POST(req: NextRequest) {
  try {
    const { clerkUserId, ine, nom, prénom, texteDocument } =
      (await req.json()) as {
        clerkUserId?: string;
        ine?: string;
        nom?: string;
        prénom?: string;
        texteDocument?: string;
      };
    if (!clerkUserId) { return NextResponse.json({ error: "Non autorisé" }, { status: 401 })}
    const eleves = await getElevesFromS3();
    if (ine && ine !== "non_trouvé") {
      const ineTrim = ine.trim().toUpperCase();
      const found = eleves.find(
        (e) => e.ine && e.ine.trim().toUpperCase() === ineTrim
      );
      if (found) {
        return NextResponse.json({ matchType: "ine", eleve: found });
      }
    }
    if (!nom || !prénom || nom === "non_trouvé" || prénom === "non_trouvé") {
      return NextResponse.json({ matchType: "none", eleve: null });
    }
    const scored = eleves.map((e) => ({
      eleve: e,
      score: nameSimilarity(nom, prénom, e.nom, e.prenom),
    }));
    const sorted = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    if (sorted.length === 0) { return NextResponse.json({ matchType: "none", eleve: null })}
    const shortlist = sorted.map((s) => s.eleve);
    if (!texteDocument) { return NextResponse.json({ matchType: "best_score", eleve: shortlist[0] })}
    const shortlistDescription = shortlist
      .map(
        (e, idx) =>
          `${idx + 1}. INE: ${e.ine}, Nom: ${e.nom}, Prénom: ${e.prenom}, Dossier: ${e.folderName}`
      )
      .join("\n");
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
    const selectionResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-medium",
          messages: [{ role: "user", content: selectionPrompt }],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      }
    );
    if (!selectionResponse.ok) {
      const err = await selectionResponse.text();
      return NextResponse.json(
        { error: `Erreur Mistral selection élève: ${err}` },
        { status: selectionResponse.status }
      );
    }
    const selectionData = await selectionResponse.json();
    let content = selectionData.choices?.[0]?.message?.content || "";
    content = content.trim();
    let selectedIndex = 0;
    try {
      const parsed = JSON.parse(content) as { index?: number };
      selectedIndex = parsed.index ?? 0;
    } catch {
      selectedIndex = 0;
    }
    if (!selectedIndex || selectedIndex < 1 || selectedIndex > shortlist.length) {
      return NextResponse.json({ matchType: "shortlist_none", eleve: null });
    }
    const selectedEleve = shortlist[selectedIndex - 1];
    return NextResponse.json({
      matchType: "shortlist_mistral",
      eleve: selectedEleve,
    });
  } catch (error) {
    console.error("Erreur POST /api/agentIAOCR/match-eleve:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
