import { NextResponse } from "next/server";
import {
  ACADEMIC_DEADLINES_SEED,
  buildAcademicDeadlinesPayload,
} from "@/app/lib/academic-deadlines";
import { loadAllAcademicDeadlines } from "@/app/lib/dashboard-academic-deadlines-storage";
import { requireAcademicDeadlinesViewer } from "@/app/lib/intranet-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAcademicDeadlinesViewer();
  if (!gate.ok) return gate.response;

  try {
    const all = await loadAllAcademicDeadlines(ACADEMIC_DEADLINES_SEED);
    const payload = buildAcademicDeadlinesPayload(all);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[academic-deadlines]", e);
    return NextResponse.json({ error: "Échéances indisponibles." }, { status: 500 });
  }
}
