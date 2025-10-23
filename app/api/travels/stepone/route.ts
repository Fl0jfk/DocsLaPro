import { NextRequest, NextResponse } from "next/server";
import { readVoyages } from "@/app/utils/voyageStore";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const voyages = await readVoyages();
  const voyage = voyages.find(v => v.id === id);
  if (!voyage) return NextResponse.json({ error: "voyage non trouvé" }, { status: 404 });
  return NextResponse.json(voyage);
}