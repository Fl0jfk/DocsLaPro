import { NextResponse } from "next/server";
import { requireAcademicDeadlinesEditor } from "@/app/lib/intranet-auth";
import { ingestAcademicDeadlineText } from "@/app/lib/dashboard-academic-deadlines-import";

export const maxDuration = 120;

export async function POST(req: Request) {
  const gate = await requireAcademicDeadlinesEditor();
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text : "";
    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    const sourceLabel = typeof body.sourceLabel === "string" ? body.sourceLabel.trim() : "";

    const { added, payload } = await ingestAcademicDeadlineText(text, {
      sourceUrl: sourceUrl || undefined,
      sourceLabel: sourceLabel || undefined,
    });

    return NextResponse.json({ ok: true, added, payload });
  } catch (e) {
    console.error("[dashboard/academic-deadlines/analyze-text]", e);
    const message = e instanceof Error ? e.message : "Analyse impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
