import { NextResponse } from "next/server";
import { getJson } from "@/app/lib/s3-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import { assertComptaSheetViewAccess } from "@/app/lib/travels-rbac-server";
import { buildComptaApelSummary } from "@/app/lib/travels-compta-apel-summary";
import {
  buildComptaApelSummaryPdfBase64,
  comptaApelSummaryPdfFilename,
} from "@/app/lib/travels-compta-apel-summary-pdf";
import type { TravelsComptaSheet } from "@/app/lib/travels-compta-sheet";
import type { TravelsTrip } from "@/app/lib/travels-types";

async function loadAllTrips(): Promise<TravelsTrip[]> {
  const indexHit = await getJson<TravelsTrip[]>("travels/index.json");
  const index = Array.isArray(indexHit?.data) ? indexHit.data : [];
  const trips = await Promise.all(
    index.map(async (summary) => {
      const hit = await getJson<TravelsTrip>(`travels/${summary.id}.json`);
      return hit?.data ?? null;
    }),
  );
  return trips.filter((t): t is TravelsTrip => t != null);
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  let tripId: string | null = null;
  let currentSheet: TravelsComptaSheet | null = null;
  try {
    const body = await req.json();
    tripId = typeof body?.tripId === "string" ? body.tripId.trim() || null : null;
    currentSheet =
      body?.currentSheet && typeof body.currentSheet === "object"
        ? (body.currentSheet as TravelsComptaSheet)
        : null;
  } catch {
    tripId = null;
  }

  if (tripId) {
    const tripHit = await getJson<TravelsTrip>(`travels/${tripId}.json`);
    const trip = tripHit?.data;
    if (!trip) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
    const access = await assertComptaSheetViewAccess(trip);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const trips = await loadAllTrips();
    const summary = buildComptaApelSummary(trips, { currentTripId: tripId, currentSheet });
    const pdf = await buildComptaApelSummaryPdfBase64(summary);
    return NextResponse.json({
      pdf,
      filename: comptaApelSummaryPdfFilename(summary.schoolYear.label),
      summary,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Impossible de générer le PDF APEL." },
      { status: 500 },
    );
  }
}
