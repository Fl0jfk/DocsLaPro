import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export type DocumentSegment = {
  pageStart: number;
  pageEnd: number;
  type?: string;
  nom?: string;
  prenom?: string;
  ine?: string;
  label?: string;
};

function parseSegmentationJson(raw: string): {
  mode: "single" | "multi";
  segments: DocumentSegment[];
} | null {
  let content = raw.trim();
  content = content.replace(/`{3}json/gi, "").replace(/`{3}/g, "");
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(content.slice(start, end + 1)) as {
      mode?: string;
      segments?: DocumentSegment[];
    };
    const mode = parsed.mode === "multi" ? "multi" : "single";
    const segments = Array.isArray(parsed.segments) ? parsed.segments : [];
    const cleaned = segments
      .map((s) => ({
        pageStart: Math.max(1, Number(s.pageStart) || 1),
        pageEnd: Math.max(1, Number(s.pageEnd) || 1),
        type: s.type,
        nom: s.nom,
        prenom: s.prenom,
        ine: s.ine,
        label: s.label,
      }))
      .map((s) =>
        s.pageEnd < s.pageStart ? { ...s, pageEnd: s.pageStart } : s
      );
    if (cleaned.length === 0 && mode === "single") {
      return { mode: "single", segments: [{ pageStart: 1, pageEnd: 1 }] };
    }
    return { mode, segments: cleaned };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { text, pageCount } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text requis" }, { status: 400 });
    }

    const pagesHint =
      typeof pageCount === "number" && pageCount > 0
        ? `Le PDF contient ${pageCount} page(s) numérotée(s) dans le texte (marqueurs "--- Page N ---").`
        : "Les pages sont marquées par --- Page N --- dans le texte.";

    const prompt = `
Tu analyses un document PDF scolaire (souvent export Charlemagne : bulletins de toute une classe sur un seul fichier).

${pagesHint}

Détermine combien de DOCUMENTS LOGIQUES DISTINCTS le PDF contient (ex. un bulletin par élève, ou un seul certificat sur plusieurs pages).

Règles :
- Un bulletin par élève = un segment (même si plusieurs pages).
- Un seul élève / un seul document sur toutes les pages = mode "single", un seul segment couvrant toutes les pages concernées.
- Les pages sont 1-indexées (première page = 1).
- Chaque segment doit avoir pageStart <= pageEnd, sans chevauchement, couvrant tout le document utile.
- Ne devine pas d'élève : extrais nom/prénom/ine seulement s'ils sont clairement visibles sur les pages du segment.
- Si incertain sur les frontières, préfère un segment plus large plutôt que couper au milieu d'un bulletin.

Réponds UNIQUEMENT en JSON valide :
{
  "mode": "single" ou "multi",
  "segments": [
    {
      "pageStart": 1,
      "pageEnd": 2,
      "type": "bulletin ou null",
      "nom": "string ou null",
      "prenom": "string ou null",
      "ine": "string ou null",
      "label": "court résumé du segment"
    }
  ]
}

Texte OCR :
---
${text.slice(0, 120000)}
---
`;

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Erreur Mistral segmentation: ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const parsed = parseSegmentationJson(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "Segmentation JSON invalide", brut: raw },
        { status: 500 }
      );
    }

    let { mode, segments } = parsed;
    if (segments.length === 0) {
      mode = "single";
      segments = [
        {
          pageStart: 1,
          pageEnd: typeof pageCount === "number" && pageCount > 0 ? pageCount : 1,
        },
      ];
    }
    if (segments.length === 1) {
      mode = "single";
    }

    return NextResponse.json({ mode, segments, segmentCount: segments.length });
  } catch (error) {
    console.error("[segment-document]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
