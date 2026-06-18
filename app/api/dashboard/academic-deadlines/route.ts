import { NextResponse } from "next/server";
import { requireAcademicDeadlinesEditor } from "@/app/lib/intranet-auth";
import type { AcademicDeadline, AcademicDeadlineCategory, AcademicDeadlineKind } from "@/app/lib/academic-deadlines";
import {
  ACADEMIC_DEADLINES_SEED,
  buildAcademicDeadlinesPayload,
} from "@/app/lib/academic-deadlines";
import {
  appendCustomAcademicDeadlines,
  loadAllAcademicDeadlines,
} from "@/app/lib/dashboard-academic-deadlines-storage";

const CATEGORIES: AcademicDeadlineCategory[] = [
  "mutation_intra",
  "mutation_inter",
  "examens",
  "parcoursup",
  "affectation",
  "rentree",
  "autre",
];

function parseBody(body: unknown): AcademicDeadline | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const date = typeof b.date === "string" ? b.date.trim() : "";
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const category = CATEGORIES.includes(b.category as AcademicDeadlineCategory)
    ? (b.category as AcademicDeadlineCategory)
    : "autre";
  const kind = (["deadline", "ongoing", "window_start", "window_end"] as AcademicDeadlineKind[]).includes(
    b.kind as AcademicDeadlineKind,
  )
    ? (b.kind as AcademicDeadlineKind)
    : "deadline";

  const endDate =
    typeof b.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.endDate.trim())
      ? b.endDate.trim()
      : undefined;

  return {
    id: `custom-${Date.now()}`,
    title,
    detail: typeof b.detail === "string" ? b.detail.trim() || undefined : undefined,
    category,
    kind,
    date,
    endDate,
    platform: typeof b.platform === "string" ? b.platform.trim() || undefined : undefined,
    sourceUrl: typeof b.sourceUrl === "string" ? b.sourceUrl.trim() || undefined : undefined,
    sourceLabel: typeof b.sourceLabel === "string" ? b.sourceLabel.trim() || undefined : undefined,
    schoolYear: "2025-2026",
  };
}

export async function POST(req: Request) {
  const gate = await requireAcademicDeadlinesEditor();
  if (!gate.ok) return gate.response;

  try {
    const item = parseBody(await req.json());
    if (!item) {
      return NextResponse.json({ error: "Titre et date (AAAA-MM-JJ) requis." }, { status: 400 });
    }

    await appendCustomAcademicDeadlines([item]);
    const all = await loadAllAcademicDeadlines(ACADEMIC_DEADLINES_SEED);
    const payload = buildAcademicDeadlinesPayload(all);

    return NextResponse.json({ ok: true, item, payload });
  } catch (e) {
    console.error("[dashboard/academic-deadlines POST]", e);
    return NextResponse.json({ error: "Ajout impossible." }, { status: 500 });
  }
}
