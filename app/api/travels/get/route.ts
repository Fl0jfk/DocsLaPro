import { NextResponse } from 'next/server';
import { getJson } from "@/app/lib/s3-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import { normalizeTripImageFields } from "@/app/lib/travels-image-url";
import type { TravelsTrip } from "@/app/lib/travels-types";

export async function GET(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse("ID manquant", { status: 400 });
  try {
    const hit = await getJson<unknown>( `travels/${id}.json`);
    if (!hit?.data) return NextResponse.json({ error: "Impossible de récupérer le dossier" }, { status: 404 });
    return NextResponse.json(normalizeTripImageFields(hit.data as TravelsTrip));
  } catch (error) {
    console.error("Erreur S3 Get:", error);
    return NextResponse.json({ error: "Impossible de récupérer le dossier" }, { status: 500 });
  }
}
