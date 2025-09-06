import { NextRequest, NextResponse } from "next/server";
import { readStore, AbsenceEntry } from "@/app/utils/jsonStore";

export async function GET(req: NextRequest) {
  try {
    const absences: AbsenceEntry[] = await readStore();
    return NextResponse.json(absences);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur", details: (err as Error).message }, { status: 500 });
  }
}
