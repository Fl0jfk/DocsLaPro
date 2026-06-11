import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { canSignTravelsDirectionForEtab } from "@/app/lib/establishments";
import { getJson, putJson } from "@/app/lib/s3-storage";

type BusQuote = {
  id?: string;
  providerName?: string;
  fileUrl?: string;
};

type TripRecord = {
  id?: string;
  status?: string;
  updatedAt?: string;
  data?: {
    etablissement?: string;
    selectedBusQuote?: BusQuote | null;
  };
  receivedDevis?: BusQuote[];
  history?: Array<{ date: string; user?: string; action: string; note?: string }>;
};

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const tripId = String(body?.tripId || "").trim();
    const quoteId = String(body?.quoteId || "").trim();
    if (!tripId || !quoteId) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const user = await currentUser();
    const tripHit = await getJson<TripRecord>(`travels/${tripId}.json`);
    const trip = tripHit?.data;
    if (!trip) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

    const etab = trip.data?.etablissement || null;
    if (!(await canSignTravelsDirectionForEtab(user, etab))) {
      return NextResponse.json(
        { error: "Seule la direction de l'établissement concerné peut supprimer un devis bus." },
        { status: 403 },
      );
    }

    const received = Array.isArray(trip.receivedDevis) ? trip.receivedDevis : [];
    const target = received.find((q) => String(q.id) === quoteId);
    if (!target) {
      return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    }

    const updatedDevis = received.filter((q) => String(q.id) !== quoteId);
    const selected = trip.data?.selectedBusQuote;
    const wasSelected =
      selected &&
      (String(selected.id) === quoteId ||
        (selected.fileUrl && target.fileUrl && selected.fileUrl === target.fileUrl));

    const now = new Date().toISOString();
    const updatedTrip: TripRecord = {
      ...trip,
      updatedAt: now,
      receivedDevis: updatedDevis,
      data: {
        ...trip.data,
        selectedBusQuote: wasSelected ? null : trip.data?.selectedBusQuote,
      },
      history: [
        ...(trip.history || []),
        {
          date: new Date().toISOString(),
          user: user?.fullName || user?.firstName || "Direction",
          action: "DEVIS_BUS_SUPPRIME",
          note: `Devis supprimé : ${target.providerName || "Transporteur"}`,
        },
      ],
    };

    if (wasSelected && updatedTrip.status === "EN_ATTENTE_BUS_SIGNATURE") {
      updatedTrip.status = "PROF_LOGISTICS";
    }

    await putJson(`travels/${tripId}.json`, updatedTrip);

    return NextResponse.json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error("[delete-bus-quote]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression du devis." }, { status: 500 });
  }
}
