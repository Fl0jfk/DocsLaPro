import "server-only";

import {
  buildPageDigestForSegmentation,
  ensureFullPageCoverage,
  heuristicClassSegments,
  type OcrDocumentSegment,
} from "@/app/lib/ocr-segmentation";
import { getMistralApiKey } from "@/app/lib/tenant-config";

const MISTRAL_TIMEOUT_MS = 22_000;
const SEGMENTATION_MODEL = "mistral-small-latest";
const DIGEST_PROMPT_LIMIT = 32_000;
const MISTRAL_MAX_RELIABLE_PAGES = 42;

export type DocumentSegment = OcrDocumentSegment;

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
      .map((s) => (s.pageEnd < s.pageStart ? { ...s, pageEnd: s.pageStart } : s));
    if (cleaned.length === 0 && mode === "single") {
      return { mode: "single", segments: [{ pageStart: 1, pageEnd: 1 }] };
    }
    return { mode, segments: cleaned };
  } catch {
    return null;
  }
}

function finalizeSegments(mode: "single" | "multi", segments: DocumentSegment[], pageCount: number) {
  let m = mode;
  let segs = segments;
  if (segs.length === 0) {
    m = "single";
    segs = [{ pageStart: 1, pageEnd: pageCount > 0 ? pageCount : 1 }];
  }
  if (segs.length === 1) m = "single";
  return { mode: m, segments: segs, segmentCount: segs.length };
}

async function callMistralSegmentation(
  digest: string,
  pageCount: number,
): Promise<{ mode: "single" | "multi"; segments: DocumentSegment[] } | null> {
  const apiKey = await getMistralApiKey();
  if (!apiKey) return null;

  const pagesHint =
    pageCount > 0
      ? `Le PDF contient ${pageCount} page(s). Chaque bloc commence par "--- Page N ---".`
      : "Les pages sont marquées par --- Page N ---.";

  const prompt = `
Tu analyses un export PDF scolaire (souvent Charlemagne : bulletins de toute une classe).

${pagesHint}

Détermine les DOCUMENTS LOGIQUES DISTINCTS (souvent un bulletin par élève).

Règles :
- Un bulletin par élève = un segment (1 ou plusieurs pages consécutives).
- Pages 1-indexées. Segments sans chevauchement, couvrant toutes les pages.
- Ne devine pas : nom/prénom/ine seulement si visibles dans le résumé de page.
- En cas de doute, préfère couper entre deux pages plutôt qu'au milieu d'un bulletin.

JSON uniquement :
{"mode":"single"|"multi","segments":[{"pageStart":1,"pageEnd":1,"nom":null,"prenom":null,"ine":null,"label":"..."}]}

Résumé OCR par page :
---
${digest.slice(0, DIGEST_PROMPT_LIMIT)}
---
`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MISTRAL_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SEGMENTATION_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    return parseSegmentationJson(raw);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function runDocumentSegmentation(input: {
  pageTexts?: Record<string, string> | null;
  pageCount?: number;
  text?: string;
}) {
  const pageTexts = input.pageTexts && typeof input.pageTexts === "object" ? input.pageTexts : null;
  const pageCount = typeof input.pageCount === "number" && input.pageCount > 0 ? input.pageCount : 0;
  const text = typeof input.text === "string" ? input.text : "";

  let digest = "";
  let resolvedPageCount = pageCount;

  if (pageTexts && Object.keys(pageTexts).length > 0) {
    const built = buildPageDigestForSegmentation(pageTexts, pageCount);
    digest = built.digest;
    resolvedPageCount = built.pageCount || pageCount;
  } else if (text) {
    digest = text.slice(0, DIGEST_PROMPT_LIMIT);
    if (!resolvedPageCount) {
      const matches = text.match(/--- Page (\d+) ---/g) || [];
      resolvedPageCount = matches.length;
    }
  } else {
    throw new Error("pageTexts ou text requis");
  }

  if (!digest.trim()) throw new Error("Texte OCR vide");

  const digestTooLongForMistral = digest.length > DIGEST_PROMPT_LIMIT;
  const tooManyPagesForMistral = resolvedPageCount > MISTRAL_MAX_RELIABLE_PAGES;

  let result: { mode: "single" | "multi"; segments: DocumentSegment[] } | null = null;

  if (pageTexts && resolvedPageCount > 0 && (digestTooLongForMistral || tooManyPagesForMistral)) {
    result = heuristicClassSegments(pageTexts, resolvedPageCount);
  } else {
    result = (await callMistralSegmentation(digest, resolvedPageCount)) ?? null;
    if (result && resolvedPageCount > 0) {
      const fixed = ensureFullPageCoverage(result.segments, resolvedPageCount);
      result = {
        ...result,
        mode: fixed.segments.length > 1 ? "multi" : result.mode,
        segments: fixed.segments,
      };
    }
    if (!result && pageTexts && resolvedPageCount > 0) {
      result = heuristicClassSegments(pageTexts, resolvedPageCount);
    }
  }

  if (!result) throw new Error("Segmentation impossible");

  return {
    ...finalizeSegments(result.mode, result.segments, resolvedPageCount),
    pageCount: resolvedPageCount,
  };
}
