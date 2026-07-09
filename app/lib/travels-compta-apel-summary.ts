import { pdfFormatDateFr } from "@/app/lib/pdf-format-numbers";
import { computeComptaSheetDerived, readComptaSheetFromTrip } from "@/app/lib/travels-compta-sheet";
import { tripTravelStartMs } from "@/app/lib/travels-trip-helpers";
import type { TravelsTrip } from "@/app/lib/travels-types";

/** Année scolaire APEL : 1er septembre → 15 juillet inclus. */
export function comptaApelSchoolYearBounds(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (m >= 8) {
    return {
      start: new Date(y, 8, 1),
      end: new Date(y + 1, 6, 15, 23, 59, 59, 999),
      label: `${y}-${y + 1}`,
      startIso: `${y}-09-01`,
      endIso: `${y + 1}-07-15`,
    };
  }
  return {
    start: new Date(y - 1, 8, 1),
    end: new Date(y, 6, 15, 23, 59, 59, 999),
    label: `${y - 1}-${y}`,
    startIso: `${y - 1}-09-01`,
    endIso: `${y}-07-15`,
  };
}

export type ComptaApelTripCommitment = {
  tripId: string;
  title: string;
  etablissement: string;
  travelDate: string | null;
  travelDateLabel: string;
  apelCollective: number;
  aidesIndividuelles: number;
  totalApel: number;
  hasComptaSheet: boolean;
};

export type ComptaApelSummary = {
  schoolYear: {
    label: string;
    startIso: string;
    endIso: string;
  };
  currentTripId: string | null;
  currentTrip: ComptaApelTripCommitment | null;
  trips: ComptaApelTripCommitment[];
  totals: {
    apelCollective: number;
    aidesIndividuelles: number;
    totalApel: number;
    tripCount: number;
    tripsWithApel: number;
  };
};

export function apelCommitmentFromSheet(sheet: TravelsComptaSheet | null | undefined): {
  apelCollective: number;
  aidesIndividuelles: number;
  totalApel: number;
} {
  if (!sheet) {
    return { apelCollective: 0, aidesIndividuelles: 0, totalApel: 0 };
  }
  const apelCollective = sheet.recettesLignes?.[0]?.amount ?? 0;
  const aidesIndividuelles =
    sheet.totalAidesIndividuelles ??
    (sheet.aidesIndividuelles ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const collective = Number.isFinite(apelCollective) ? apelCollective : 0;
  const individuelles = Number.isFinite(aidesIndividuelles) ? aidesIndividuelles : 0;
  return {
    apelCollective: collective,
    aidesIndividuelles: individuelles,
    totalApel: Math.round((collective + individuelles) * 100) / 100,
  };
}

function formatTravelDateLabel(trip: TravelsTrip): string {
  const raw = trip.data?.startDate || trip.data?.date;
  if (!raw) return "Date à préciser";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "Date à préciser";
  if (trip.type === "COMPLEX" && trip.data?.endDate) {
    const end = new Date(trip.data.endDate);
    if (!Number.isNaN(end.getTime())) {
      return `${pdfFormatDateFr(d)} au ${pdfFormatDateFr(end)}`;
    }
  }
  return pdfFormatDateFr(d);
}

function tripInApelSchoolYear(trip: TravelsTrip, start: Date, end: Date): boolean {
  let ms = tripTravelStartMs(trip);
  if (ms == null && trip.createdAt) {
    const created = new Date(trip.createdAt);
    if (!Number.isNaN(created.getTime())) ms = created.getTime();
  }
  if (ms == null) return true;
  return ms >= start.getTime() && ms <= end.getTime();
}

export function comptaApelCommitmentForTrip(
  trip: TravelsTrip,
  sheetOverride?: TravelsComptaSheet | null,
): ComptaApelTripCommitment {
  const sheet = sheetOverride
    ? computeComptaSheetDerived(sheetOverride)
    : readComptaSheetFromTrip(trip);
  const { apelCollective, aidesIndividuelles, totalApel } = apelCommitmentFromSheet(sheet);
  const travelRaw = trip.data?.startDate || trip.data?.date || null;
  return {
    tripId: trip.id,
    title: String(trip.data?.title || "Sortie sans titre"),
    etablissement: String(trip.data?.etablissement || "—"),
    travelDate: travelRaw ? String(travelRaw) : null,
    travelDateLabel: formatTravelDateLabel(trip),
    apelCollective,
    aidesIndividuelles,
    totalApel,
    hasComptaSheet: sheet != null,
  };
}

export function buildComptaApelSummary(
  trips: TravelsTrip[],
  options?: { currentTripId?: string | null; currentSheet?: TravelsComptaSheet | null; now?: Date },
): ComptaApelSummary {
  const bounds = comptaApelSchoolYearBounds(options?.now);
  const currentTripId = options?.currentTripId ?? null;
  const rows: ComptaApelTripCommitment[] = [];
  const rowById = new Map<string, ComptaApelTripCommitment>();

  for (const trip of trips) {
    if (!tripInApelSchoolYear(trip, bounds.start, bounds.end)) continue;
    const sheetOverride = trip.id === currentTripId ? options?.currentSheet : undefined;
    const row = comptaApelCommitmentForTrip(trip, sheetOverride);
    if (row.totalApel > 0 || row.hasComptaSheet) {
      rowById.set(trip.id, row);
    }
  }

  if (currentTripId) {
    const current = trips.find((t) => t.id === currentTripId);
    if (current) {
      const row = comptaApelCommitmentForTrip(current, options?.currentSheet);
      rowById.set(currentTripId, row);
    }
  }

  rows.push(
    ...Array.from(rowById.values()).sort((a, b) => {
      const da = a.travelDate ? new Date(a.travelDate).getTime() : 0;
      const db = b.travelDate ? new Date(b.travelDate).getTime() : 0;
      return da - db;
    }),
  );

  const totals = rows
    .filter((row) => {
      const trip = trips.find((t) => t.id === row.tripId);
      return trip ? tripInApelSchoolYear(trip, bounds.start, bounds.end) : false;
    })
    .reduce(
      (acc, row) => ({
        apelCollective: acc.apelCollective + row.apelCollective,
        aidesIndividuelles: acc.aidesIndividuelles + row.aidesIndividuelles,
        totalApel: acc.totalApel + row.totalApel,
        tripCount: acc.tripCount + 1,
        tripsWithApel: acc.tripsWithApel + (row.totalApel > 0 ? 1 : 0),
      }),
      { apelCollective: 0, aidesIndividuelles: 0, totalApel: 0, tripCount: 0, tripsWithApel: 0 },
    );

  totals.apelCollective = Math.round(totals.apelCollective * 100) / 100;
  totals.aidesIndividuelles = Math.round(totals.aidesIndividuelles * 100) / 100;
  totals.totalApel = Math.round(totals.totalApel * 100) / 100;

  const currentTrip = currentTripId ? rows.find((r) => r.tripId === currentTripId) ?? null : null;

  return {
    schoolYear: {
      label: bounds.label,
      startIso: bounds.startIso,
      endIso: bounds.endIso,
    },
    currentTripId,
    currentTrip,
    trips: rows,
    totals,
  };
}
