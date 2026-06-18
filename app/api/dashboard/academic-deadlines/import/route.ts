import { NextResponse } from "next/server";
import { requireAcademicDeadlinesEditor } from "@/app/lib/intranet-auth";
import { extractPdfTextFromS3 } from "@/app/lib/dashboard-week-sheet-ocr";
import { ingestAcademicDeadlineText } from "@/app/lib/dashboard-academic-deadlines-import";

export const maxDuration = 120;

export async function POST(req: Request) {
  const gate = await requireAcademicDeadlinesEditor();
  if (!gate.ok) return gate.response;

  try {
    const { key, fileName, sourceUrl, sourceLabel } = await req.json();
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Clé S3 du PDF requise." }, { status: 400 });
    }
    if (!key.includes("dashboard/academic-deadlines/")) {
      return NextResponse.json({ error: "Fichier non autorisé." }, { status: 400 });
    }

    const ocrText = await extractPdfTextFromS3(key);
    const label =
      (typeof sourceLabel === "string" && sourceLabel.trim()) ||
      (typeof fileName === "string" ? fileName : "Circulaire PDF");

    const { added, payload } = await ingestAcademicDeadlineText(ocrText, {
      sourceLabel: label,
      sourceUrl: typeof sourceUrl === "string" ? sourceUrl.trim() || undefined : undefined,
      sourcePdfKey: key,
    });

    return NextResponse.json({ ok: true, added, payload });
  } catch (e) {
    console.error("[dashboard/academic-deadlines/import]", e);
    const message = e instanceof Error ? e.message : "Import impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
