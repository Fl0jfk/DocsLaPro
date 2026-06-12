import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { getJson } from "@/app/lib/s3-storage";
import { computeTripReminders } from "@/app/lib/travels-trip-helpers";
import type { TravelsTrip } from "@/app/lib/travels-types";
import {
  createTenantTransporter,
  getTenantSmtpConfig,
} from "@/app/lib/tenant-mail";

/** GET : rappels calculés pour tous les dossiers ou un tripId. */
export async function GET(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const url = new URL(req.url);
  const tripId = url.searchParams.get("tripId");

  const indexHit = await getJson<TravelsTrip[]>("travels/index.json");
  const index = Array.isArray(indexHit?.data) ? indexHit.data : [];

  if (tripId) {
    const hit = await getJson<TravelsTrip>(`travels/${tripId}.json`);
    const trip = hit?.data;
    if (!trip) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ reminders: computeTripReminders(trip) });
  }

  const reminders: ReturnType<typeof computeTripReminders> = [];
  for (const summary of index.slice(0, 200)) {
    if (!summary?.id) continue;
    const hit = await getJson<TravelsTrip>(`travels/${summary.id}.json`);
    if (hit?.data) reminders.push(...computeTripReminders(hit.data));
  }

  return NextResponse.json({ reminders, count: reminders.length });
}

/** POST : envoie un e-mail de rappel interne (créateur) pour un dossier. */
export async function POST(req: Request) {
  const cronSecret = process.env.TRAVELS_CRON_SECRET;
  const body = await req.json();
  const isCron = cronSecret && body.cronSecret === cronSecret;

  if (!isCron) {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;
  } else {
    const { userId } = await auth();
    if (!userId && !isCron) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const tripId = String(body.tripId || "");
    const reminderId = String(body.reminderId || "");
    if (!tripId) return NextResponse.json({ error: "tripId requis" }, { status: 400 });

    const hit = await getJson<TravelsTrip>(`travels/${tripId}.json`);
    const trip = hit?.data;
    if (!trip?.ownerEmail) {
      return NextResponse.json({ error: "Dossier ou email créateur introuvable" }, { status: 404 });
    }

    const reminders = computeTripReminders(trip);
    const reminder = reminderId ? reminders.find((r) => r.id === reminderId) : reminders[0];
    if (!reminder) return NextResponse.json({ error: "Aucun rappel applicable" }, { status: 400 });

    const smtp = await getTenantSmtpConfig();
    if (!smtp) {
      return NextResponse.json({ error: "SMTP non configuré" }, { status: 503 });
    }
    const transporter = await createTenantTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "SMTP non configuré" }, { status: 503 });
    }

    await transporter.sendMail({
      from: `"Plateforme Voyages" <${smtp.user}>`,
      to: trip.ownerEmail,
      subject: `Rappel sortie — ${trip.data.title || tripId}`,
      text: [
        `Bonjour ${trip.ownerName || ""},`,
        "",
        reminder.label,
        "",
        `Dossier : ${trip.data.title}`,
        `Destination : ${trip.data.destination}`,
        `Statut actuel : ${trip.status}`,
        "",
        "Consultez le sas voyage sur DocsLapro pour mettre à jour le dossier.",
        "",
        "Cordialement,",
        "Plateforme Voyages",
      ].join("\n"),
    });

    return NextResponse.json({ success: true, reminder });
  } catch (e) {
    console.error("[reminders]", e);
    return NextResponse.json({ error: "Envoi rappel impossible" }, { status: 500 });
  }
}
