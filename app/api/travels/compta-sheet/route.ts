import { NextResponse } from "next/server";
import { getJson, putJson } from "@/app/lib/s3-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import { assertTravelsTripAccess, userHasComptaRole } from "@/app/lib/travels-rbac-server";
import { syncComptaSheetWithDocuments } from "@/app/lib/travels-compta-sheet-server";
import {
  comptaSheetFromTrip,
  computeComptaSheetDerived,
  documentsNeedComptaSync,
  patchDocumentScansFromDepenses,
  readComptaSheetFromTrip,
  type TravelsComptaSheet,
} from "@/app/lib/travels-compta-sheet";
import type { TravelsTrip } from "@/app/lib/travels-types";

async function loadTrip(tripId: string): Promise<TravelsTrip | null> {
  const hit = await getJson<TravelsTrip>(`travels/${tripId}.json`);
  return hit?.data ?? null;
}

async function persistComptaSheet(tripId: string, trip: TravelsTrip, sheet: TravelsComptaSheet) {
  const updated: TravelsTrip = {
    ...trip,
    data: { ...trip.data, comptaSheet: sheet },
    updatedAt: new Date().toISOString(),
  };
  await putJson(`travels/${tripId}.json`, updated);
}

export async function GET(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId")?.trim();
  if (!tripId) return NextResponse.json({ error: "tripId requis." }, { status: 400 });

  const trip = await loadTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const access = await assertTravelsTripAccess(trip);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const existing = readComptaSheetFromTrip(trip);
  let sheet = existing ?? comptaSheetFromTrip(trip);
  let syncNotes: string | null = null;
  let ocrNewCount = 0;
  let removedCount = 0;
  let synced = false;

  if (userHasComptaRole(access.user) && documentsNeedComptaSync(trip, existing)) {
    const result = await syncComptaSheetWithDocuments(trip, existing);
    sheet = result.sheet;
    syncNotes = result.notes;
    ocrNewCount = result.ocrNewCount;
    removedCount = result.removedCount;
    synced = true;
    await persistComptaSheet(tripId, trip, sheet);
  } else if (userHasComptaRole(access.user) && existing) {
    const raw = trip.data?.comptaSheet as TravelsComptaSheet | undefined;
    if (
      raw &&
      (JSON.stringify(raw.depenses) !== JSON.stringify(existing.depenses) ||
        JSON.stringify(raw.documentScans || []) !== JSON.stringify(existing.documentScans || []))
    ) {
      sheet = existing;
      synced = true;
      syncNotes = "Dossier nettoyé";
      await persistComptaSheet(tripId, trip, sheet);
    }
  }

  return NextResponse.json({
    sheet,
    tripStatus: trip.status,
    synced,
    syncNotes,
    ocrNewCount,
    removedCount,
    hasSignedQuote: Boolean(trip.data?.signedQuoteUrl),
  });
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  let body: { tripId?: string; action?: string; sheet?: TravelsComptaSheet };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const tripId = String(body.tripId || "").trim();
  const action = String(body.action || "analyze").trim();
  if (!tripId) return NextResponse.json({ error: "tripId requis." }, { status: 400 });

  const trip = await loadTrip(tripId);
  if (!trip) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const access = await assertTravelsTripAccess(trip);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  if (!userHasComptaRole(access.user)) {
    return NextResponse.json({ error: "Réservé à la comptabilité." }, { status: 403 });
  }

  if (action === "save") {
    if (!body.sheet) return NextResponse.json({ error: "sheet requis." }, { status: 400 });
    const sheet = computeComptaSheetDerived(patchDocumentScansFromDepenses(body.sheet));
    await persistComptaSheet(tripId, trip, sheet);
    return NextResponse.json({ ok: true, sheet });
  }

  if (action === "analyze") {
    const existing = readComptaSheetFromTrip(trip);
    const result = await syncComptaSheetWithDocuments(trip, existing);
    await persistComptaSheet(tripId, trip, result.sheet);

    return NextResponse.json({
      ok: true,
      sheet: result.sheet,
      ocrDocuments: result.ocrNewCount,
      hasSignedQuote: Boolean(trip.data?.signedQuoteUrl),
      syncNotes: result.notes,
    });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
