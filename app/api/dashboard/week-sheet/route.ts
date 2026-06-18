import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { loadWeekSheetData } from "@/app/lib/dashboard-week-sheet-storage";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const data = await loadWeekSheetData();
    return NextResponse.json({ data });
  } catch (e) {
    console.error("[dashboard/week-sheet GET]", e);
    return NextResponse.json({ error: "Impossible de charger la feuille." }, { status: 500 });
  }
}
