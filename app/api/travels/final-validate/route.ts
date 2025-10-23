import { NextRequest, NextResponse } from "next/server";
import { readVoyages, writeVoyages } from "@/app/utils/voyageStore";

const MAIL_COMPTA = ["flojfk+compta@gmail.com"];
const MAIL_ADMIN = ["flojfk+admin@gmail.com"];
const MAIL_CANTINE_DEDUCTION = ["flojfk+deducrepas@gmail.com"];

export async function POST(req: NextRequest) {
  const { id, statut } = await req.json();
  const voyages = await readVoyages();
  const voyageIdx = voyages.findIndex(v => v.id === id);
  if (voyageIdx === -1) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
  if (statut === "refusee") {
    voyages[voyageIdx].etat = "refusee";
    await writeVoyages(voyages);
    return NextResponse.json({ success: true, message: "Voyage refusé et notif envoyée" });
  }
  voyages[voyageIdx].etat = "validee_definitive";
  await writeVoyages(voyages);
  const voyage = voyages[voyageIdx];
  const mails = [...MAIL_COMPTA, ...MAIL_ADMIN, ...MAIL_CANTINE_DEDUCTION];
  const subject = `Voyage validé définitivement : ${voyage.lieu} (${voyage.date_depart})`;
  const text = `Le voyage "${voyage.lieu}" a été validé par la direction.
                Consultez tous les documents et justificatifs dans le dashboard admin.
                Id voyage: ${voyage.id}\n
                Lien admin : ${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}/voyages/admin-dashboard
                `;
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
    method: "POST",
    body: JSON.stringify({ to: mails, subject, text }),
    headers: { "Content-Type": "application/json" }
  });

  return NextResponse.json({ success: true, message: "Voyage validé définitivement et notification envoyée" });
}