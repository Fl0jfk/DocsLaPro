import "server-only";

import {
  buildPageDigestForSegmentation,
  buildSafeMistralChunks,
  ensureFullPageCoverage,
  findDocumentBoundaryAfterPages,
  heuristicClassSegments,
  mergeAdjacentSegments,
  slicePageTexts,
  type OcrDocumentSegment,
} from "@/app/lib/ocr-segmentation";
import { getMistralApiKey } from "@/app/lib/tenant-config";

const MISTRAL_TIMEOUT_MS = 22_000;
const SEGMENTATION_MODEL = "mistral-small-latest";
const DIGEST_PROMPT_LIMIT = 32_000;
/** Appel Mistral unique si le PDF tient dans une requête. */
export const MISTRAL_SINGLE_CALL_MAX_PAGES = 30;
/** Taille max d'un bloc Mistral (coupures uniquement entre documents). */
export const MISTRAL_CHUNK_MAX_PAGES = 30;

export type SegmentationEngine = "mistral" | "mistral_chunked" | "heuristic";

export function resolveSegmentationEngine(pageCount: number): SegmentationEngine {
  return pageCount > MISTRAL_SINGLE_CALL_MAX_PAGES ? "mistral_chunked" : "mistral";
}

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
  opts?: { absoluteStart?: number; absoluteEnd?: number },
): Promise<{ mode: "single" | "multi"; segments: DocumentSegment[] } | null> {
  const apiKey = await getMistralApiKey();
  if (!apiKey) return null;

  const absStart = opts?.absoluteStart;
  const absEnd = opts?.absoluteEnd;
  const pagesHint =
    absStart && absEnd
      ? `Ce bloc couvre les pages ${absStart} à ${absEnd} du PDF complet. Utilise OBLIGATOIREMENT ces numéros absolus dans pageStart/pageEnd (ceux indiqués après "--- Page N ---").`
      : pageCount > 0
        ? `Le PDF contient ${pageCount} page(s). Chaque bloc commence par "--- Page N ---".`
        : "Les pages sont marquées par --- Page N ---.";

  const prompt = `
Tu analyses un export PDF scolaire (souvent Charlemagne : bulletins de toute une classe).

${pagesHint}

Détermine les DOCUMENTS LOGIQUES DISTINCTS (souvent un document par élève).

Règles :
- Un élève = un segment (1 ou plusieurs pages consécutives).
- Segments sans chevauchement, couvrant toutes les pages du bloc.
- Ne devine pas : nom/prénom/ine seulement si visibles dans le résumé de page.
- En cas de doute, préfère couper entre deux pages plutôt qu'au milieu d'un document.

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

async function segmentChunkWithMistral(
  pageTexts: Record<string, string>,
  start: number,
  end: number,
): Promise<DocumentSegment[] | null> {
  const chunkTexts = slicePageTexts(pageTexts, start, end);
  const built = buildPageDigestForSegmentation(chunkTexts, end - start + 1);
  if (!built.digest.trim()) return null;

  const result = await callMistralSegmentation(built.digest, end - start + 1, {
    absoluteStart: start,
    absoluteEnd: end,
  });
  if (!result?.segments.length) return null;

  const clamped = result.segments
    .map((s) => ({
      ...s,
      pageStart: Math.max(start, Math.min(s.pageStart, end)),
      pageEnd: Math.max(start, Math.min(s.pageEnd, end)),
    }))
    .filter((s) => s.pageStart <= s.pageEnd);

  return clamped.length > 0 ? clamped : null;
}

async function segmentWithMistralChunks(
  pageTexts: Record<string, string>,
  pageCount: number,
): Promise<{ mode: "single" | "multi"; segments: DocumentSegment[] } | null> {
  const boundaries = findDocumentBoundaryAfterPages(pageTexts, pageCount);
  const chunks = buildSafeMistralChunks(pageCount, boundaries, MISTRAL_CHUNK_MAX_PAGES);
  if (chunks.length === 0) return null;

  const allSegments: DocumentSegment[] = [];

  for (const chunk of chunks) {
    const segs =
      (await segmentChunkWithMistral(pageTexts, chunk.start, chunk.end)) ??
      heuristicClassSegments(slicePageTexts(pageTexts, chunk.start, chunk.end), chunk.end - chunk.start + 1)
        .segments;
    allSegments.push(...segs);
  }

  const merged = mergeAdjacentSegments(allSegments);
  const fixed = ensureFullPageCoverage(merged, pageCount);
  return {
    mode: fixed.segments.length > 1 ? "multi" : "single",
    segments: fixed.segments,
  };
}

export async function runDocumentSegmentation(input: {
  pageTexts?: Record<string, string> | null;
  pageCount?: number;
  text?: string;
}) {
  const pageTexts = input.pageTexts && typeof input.pageTexts === "object" ? input.pageTexts : null;
  const pageCount = typeof input.pageCount === "number" && input.pageCount > 0 ? input.pageCount : 0;
  const text = typeof input.text === "string" ? input.text : "";

  let resolvedPageCount =
    pageCount > 0
      ? pageCount
      : pageTexts
        ? Object.keys(pageTexts).length
        : 0;

  if (pageTexts && resolvedPageCount > MISTRAL_SINGLE_CALL_MAX_PAGES) {
    const chunked = await segmentWithMistralChunks(pageTexts, resolvedPageCount);
    if (chunked) {
      return {
        ...finalizeSegments(chunked.mode, chunked.segments, resolvedPageCount),
        pageCount: resolvedPageCount,
        engine: "mistral_chunked" as const,
      };
    }
  }

  let digest = "";
  if (pageTexts && Object.keys(pageTexts).length > 0) {
    const built = buildPageDigestForSegmentation(pageTexts, resolvedPageCount);
    digest = built.digest;
    resolvedPageCount = built.pageCount || resolvedPageCount;
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

  let result: { mode: "single" | "multi"; segments: DocumentSegment[] } | null = null;
  let engine: SegmentationEngine = "mistral";

  if (pageTexts && resolvedPageCount > 0 && digestTooLongForMistral) {
    const chunked = await segmentWithMistralChunks(pageTexts, resolvedPageCount);
    if (chunked) {
      result = chunked;
      engine = "mistral_chunked";
    } else {
      result = heuristicClassSegments(pageTexts, resolvedPageCount);
      engine = "heuristic";
    }
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
      engine = "heuristic";
    }
  }

  if (!result) throw new Error("Segmentation impossible");

  return {
    ...finalizeSegments(result.mode, result.segments, resolvedPageCount),
    pageCount: resolvedPageCount,
    engine,
  };
}
