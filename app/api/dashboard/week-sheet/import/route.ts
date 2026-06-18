import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/intranet-auth";
import { pickActiveWeekSheet } from "@/app/lib/dashboard-week-sheet-active";
import { extractPdfTextFromS3 } from "@/app/lib/dashboard-week-sheet-ocr";
import { parseWeekSheetWithMistral } from "@/app/lib/dashboard-week-sheet-parse";
import { loadWeekSheetData, saveWeekSheetData } from "@/app/lib/dashboard-week-sheet-storage";

export const maxDuration = 120;

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const { key } = await req.json();
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Clé S3 du PDF requise." }, { status: 400 });
    }
    if (!key.includes("dashboard/week-sheet/")) {
      return NextResponse.json({ error: "Fichier non autorisé." }, { status: 400 });
    }

    const ocrText = await extractPdfTextFromS3(key);
    const parsed = await parseWeekSheetWithMistral(ocrText);

    const payload = {
      ...parsed,
      sourcePdfKey: key,
      uploadedAt: new Date().toISOString(),
      uploadedBy: gate.ctx.userId,
      multiWeekParsed: true,
    };

    await saveWeekSheetData(payload);
    const stored = await loadWeekSheetData();
    const data = stored ? pickActiveWeekSheet(stored) : null;

    return NextResponse.json({
      ok: true,
      eventCount: data?.events.length ?? 0,
      weekCount: stored?.weeks?.length ?? 1,
      data,
    });
  } catch (e) {
    console.error("[dashboard/week-sheet/import]", e);
    const message = e instanceof Error ? e.message : "Import impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
