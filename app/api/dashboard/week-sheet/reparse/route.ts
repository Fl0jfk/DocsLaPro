import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { pickActiveWeekSheet } from "@/app/lib/dashboard-week-sheet-active";
import { extractPdfTextFromS3 } from "@/app/lib/dashboard-week-sheet-ocr";
import { parseWeekSheetWithMistral } from "@/app/lib/dashboard-week-sheet-parse";
import { loadWeekSheetData, saveWeekSheetData } from "@/app/lib/dashboard-week-sheet-storage";

export const maxDuration = 120;

/** Re-analyse le PDF source pour extraire toutes les semaines (migration automatique). */
export async function POST() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const stored = await loadWeekSheetData();
    if (!stored?.sourcePdfKey) {
      return NextResponse.json({ error: "Aucun PDF source enregistré." }, { status: 400 });
    }
    if (stored.multiWeekParsed && (stored.weeks?.length ?? 0) > 1) {
      return NextResponse.json({ data: pickActiveWeekSheet(stored), skipped: true });
    }

    const ocrText = await extractPdfTextFromS3(stored.sourcePdfKey);
    const parsed = await parseWeekSheetWithMistral(ocrText);

    const payload = {
      ...parsed,
      sourcePdfKey: stored.sourcePdfKey,
      uploadedAt: stored.uploadedAt,
      uploadedBy: stored.uploadedBy,
      multiWeekParsed: true,
    };

    await saveWeekSheetData(payload);
    return NextResponse.json({ data: pickActiveWeekSheet(payload), weekCount: payload.weeks?.length ?? 1 });
  } catch (e) {
    console.error("[dashboard/week-sheet/reparse]", e);
    const message = e instanceof Error ? e.message : "Re-analyse impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
