import { NextResponse } from "next/server";
import { getJson } from "@/app/lib/s3-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import { assertComptaSheetViewAccess } from "@/app/lib/travels-rbac-server";
import {
  computeComptaSheetDerived,
  readComptaSheetFromTrip,
  type TravelsComptaSheet,
} from "@/app/lib/travels-compta-sheet";
import {
  buildComptaSheetPdfBase64,
  comptaSheetPdfFilename,
} from "@/app/lib/travels-compta-sheet-pdf";
import type { TravelsTrip } from "@/app/lib/travels-types";

async function loadTrip(tripId: string): Promise<TravelsTrip | null> {
  const hit = await getJson<TravelsTrip>(`travels/${tripId}.json`);
  return hit?.data ?? null;
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  let body: { tripId?: string; sheet?: TravelsComptaSheet };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const tripId = String(body.tripId || "").trim();
  if (!tripId) return NextResponse.json({ error: "tripId requis." }, { status: 400 });

  const trip = await loadTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const access = await assertComptaSheetViewAccess(trip);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const sheet = body.sheet
    ? computeComptaSheetDerived(body.sheet)
    : readComptaSheetFromTrip(trip);
  if (!sheet) {
    return NextResponse.json({ error: "Aucune fiche compta à exporter." }, { status: 400 });
  }

  try {
    const pdf = await buildComptaSheetPdfBase64({
      tripTitle: String(trip.data?.title || "Sortie scolaire"),
      destination: trip.data?.destination ? String(trip.data.destination) : undefined,
      etablissement: trip.data?.etablissement ? String(trip.data.etablissement) : undefined,
      sheet,
    });
    const filename = comptaSheetPdfFilename(String(trip.data?.title || "sortie"));
    return NextResponse.json({ pdf, filename });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur génération PDF.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
