import { parseAcademicDeadlinesWithMistral } from "@/app/lib/dashboard-academic-deadlines-parse";
import {
  appendCustomAcademicDeadlines,
  loadAllAcademicDeadlines,
} from "@/app/lib/dashboard-academic-deadlines-storage";
import {
  ACADEMIC_DEADLINES_SEED,
  buildAcademicDeadlinesPayload,
  type AcademicDeadlinesPayload,
} from "@/app/lib/academic-deadlines";

export type AcademicDeadlineImportMeta = {
  sourceLabel?: string;
  sourceUrl?: string;
  sourcePdfKey?: string;
};

export async function ingestAcademicDeadlineText(
  text: string,
  meta: AcademicDeadlineImportMeta = {},
): Promise<{ added: number; payload: AcademicDeadlinesPayload }> {
  const trimmed = text.trim();
  if (trimmed.length < 40) {
    throw new Error("Texte trop court — collez au moins un paragraphe avec des dates.");
  }

  const extracted = await parseAcademicDeadlinesWithMistral(trimmed, {
    sourceLabel: meta.sourceLabel,
    defaultSourceUrl: meta.sourceUrl,
  });

  const stamped = extracted.map((item, i) => ({
    ...item,
    id: `custom-${Date.now()}-${i}`,
    sourcePdfKey: meta.sourcePdfKey,
    sourceLabel: item.sourceLabel || meta.sourceLabel,
    sourceUrl: item.sourceUrl || meta.sourceUrl,
  }));

  await appendCustomAcademicDeadlines(stamped);
  const all = await loadAllAcademicDeadlines(ACADEMIC_DEADLINES_SEED);
  const payload = buildAcademicDeadlinesPayload(all);

  return { added: stamped.length, payload };
}
