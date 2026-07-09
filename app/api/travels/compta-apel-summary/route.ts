import { NextResponse } from "next/server";
import { getJson } from "@/app/lib/s3-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import { assertComptaSheetViewAccess } from "@/app/lib/travels-rbac-server";
import { buildComptaApelSummary } from "@/app/lib/travels-compta-apel-summary";
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

async function handleSummaryRequest(tripId: string | null, currentSheet?: TravelsComptaSheet | null) {
  if (tripId) {
    const tripHit = await getJson<TravelsTrip>(`travels/${tripId}.json`);
    const trip = tripHit?.data;
    if (!trip) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
    const access = await assertComptaSheetViewAccess(trip);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const trips = await loadAllTrips();
  const summary = buildComptaApelSummary(trips, { currentTripId: tripId, currentSheet });
  return NextResponse.json(summary);
}

export async function GET(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId")?.trim() || null;

  try {
    return await handleSummaryRequest(tripId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Impossible de charger le récapitulatif APEL." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const tripId = typeof body?.tripId === "string" ? body.tripId.trim() || null : null;
    const currentSheet =
      body?.currentSheet && typeof body.currentSheet === "object"
        ? (body.currentSheet as TravelsComptaSheet)
        : null;
    return await handleSummaryRequest(tripId, currentSheet);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Impossible de charger le récapitulatif APEL." },
      { status: 500 },
    );
  }
}
