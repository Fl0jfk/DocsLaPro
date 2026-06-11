import { NextResponse } from "next/server";
import { deleteObject, getJson, putJson } from "@/app/lib/s3-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import {
  compareTripsByTravelDate,
  isTripEligibleForPurge,
} from "@/app/lib/travels-trip-helpers";
import type { TravelsTrip } from "@/app/lib/travels-types";

async function purgeOldTrips(trips: TravelsTrip[]): Promise<TravelsTrip[]> {
  const expired = trips.filter(isTripEligibleForPurge);
  if (expired.length === 0) return trips;

  const expiredIds = new Set(expired.map((t) => String(t.id)));
  await Promise.all(
    expired.map((t) =>
      deleteObject(`travels/${t.id}.json`).catch((err) => {
        console.error(`[travels/list] purge ${t.id}:`, err);
      }),
    ),
  );

  const remaining = trips.filter((t) => !expiredIds.has(String(t.id)));
  await putJson("travels/index.json", remaining);
  return remaining;
}

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  try {
    const hit = await getJson<TravelsTrip[]>("travels/index.json");
    const trips = Array.isArray(hit?.data) ? hit.data : [];
    const afterPurge = await purgeOldTrips(trips);
    const sortedTrips = [...afterPurge].sort(compareTripsByTravelDate);
    return NextResponse.json(sortedTrips);
  } catch (error) {
    console.error("Erreur S3 List:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de l'index" }, { status: 500 });
  }
}
