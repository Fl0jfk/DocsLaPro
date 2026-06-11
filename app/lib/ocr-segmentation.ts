export type OcrDocumentSegment = {
  pageStart: number;
  pageEnd: number;
  type?: string;
  nom?: string;
  prenom?: string;
  ine?: string;
  label?: string;
};

const HEAD_CHARS = 500;
const TAIL_CHARS = 250;

/** Résumé court par page — suffisant pour repérer les frontières de bulletins. */
export function buildPageDigestForSegmentation(
  pageTexts: Record<string, string>,
  pageCount?: number,
): { digest: string; pageCount: number } {
  const pageNumbers = Object.keys(pageTexts)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const count =
    typeof pageCount === "number" && pageCount > 0
      ? pageCount
      : pageNumbers.length > 0
        ? pageNumbers[pageNumbers.length - 1]
        : 0;

  const pages =
    pageNumbers.length > 0
      ? pageNumbers
      : count > 0
        ? Array.from({ length: count }, (_, i) => i + 1)
        : [];

  const parts: string[] = [];
  for (const p of pages) {
    const raw = (pageTexts[String(p)] || "").replace(/\s+/g, " ").trim();
    if (!raw) {
      parts.push(`--- Page ${p} ---\n(vide)`);
      continue;
    }
    const head = raw.slice(0, HEAD_CHARS);
    const tail = raw.length > HEAD_CHARS + TAIL_CHARS ? raw.slice(-TAIL_CHARS) : "";
    parts.push(
      tail
        ? `--- Page ${p} ---\n${head}\n[…]\n${tail}`
        : `--- Page ${p} ---\n${head}`,
    );
  }

  return { digest: parts.join("\n\n"), pageCount: count || pages.length };
}

function pageFingerprint(pageText: string): string {
  const t = pageText.replace(/\s+/g, " ").trim();
  const ine = t.match(/\b(\d{10,11}[A-Z]?)\b/i)?.[1]?.toUpperCase();
  if (ine) return `ine:${ine}`;
  const head = t
    .slice(0, 700)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return `h:${head.slice(0, 120)}`;
}

/**
 * Repli si Mistral dépasse le timeout Amplify (~30 s).
 * Export Charlemagne : souvent 1 bulletin = 1 page, ou 2 pages si INE identique.
 */
export function heuristicClassSegments(
  pageTexts: Record<string, string>,
  pageCount: number,
): { mode: "single" | "multi"; segments: OcrDocumentSegment[] } {
  if (pageCount <= 1) {
    return {
      mode: "single",
      segments: [{ pageStart: 1, pageEnd: 1 }],
    };
  }

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const fingerprints = pages.map((p) => pageFingerprint(pageTexts[String(p)] || ""));

  const segments: OcrDocumentSegment[] = [];
  let segStart = 1;

  for (let i = 1; i < pages.length; i++) {
    const prev = fingerprints[i - 1];
    const curr = fingerprints[i];
    const sameStudent =
      prev.startsWith("ine:") && curr.startsWith("ine:") && prev === curr;
    if (sameStudent) continue;

    const boundary =
      (prev !== curr && prev !== "h:" && curr !== "h:") ||
      (prev.startsWith("ine:") && curr.startsWith("ine:") && prev !== curr);

    if (boundary) {
      segments.push({ pageStart: segStart, pageEnd: pages[i - 1] });
      segStart = pages[i];
    }
  }
  segments.push({ pageStart: segStart, pageEnd: pages[pages.length - 1] });

  if (segments.length <= 1) {
    const onePerPage = pages.map((p) => ({
      pageStart: p,
      pageEnd: p,
      label: `Page ${p}`,
    }));
    return { mode: "multi", segments: onePerPage };
  }

  return { mode: "multi", segments };
}
