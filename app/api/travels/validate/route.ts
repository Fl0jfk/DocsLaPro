import { NextRequest, NextResponse } from "next/server";
import { readVoyages, writeVoyages, removeVoyage } from "@/app/utils/voyageStore";

export async function GET() {
  try {
    const voyages = await readVoyages();
    return NextResponse.json(voyages);
  } catch (e) {
    console.error("Erreur lors de la récupération des voyages :", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const { id, statut } = await req.json();
  const voyages = await readVoyages();
  const voyageIdx = voyages.findIndex(v => v.id === id);
  if (voyageIdx === -1)
    return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
  const voyage = voyages[voyageIdx];
  if (statut === "refusee") {
    await removeVoyage(id);
    return NextResponse.json({ success: true, message: "Voyage refusé et supprimé." });
  }
  voyages[voyageIdx] = {
    ...voyage,
    etat: "etape_2_en_attente"
  };
  await writeVoyages(voyages);
  const lien_etape2 = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/travels/steptwo?id=${voyage.id}`;
  const subject = "Votre voyage scolaire a été validé : prochaine étape à compléter";
  const text =
    `Bonjour ${voyage.prenom} ${voyage.nom},\n\n` +
    `Votre demande de voyage a été validée par la direction (${voyage.direction_cible}).\n\n` +
    `Merci de compléter les informations nécessaires pour la deuxième étape: besoins en paniers repas, demandes de devis transporteurs, etc.\n` +
    `Accédez au formulaire ici : ${lien_etape2}\n\n` +
    `Résumé :\n` +
    `Dates : du ${voyage.date_depart} au ${voyage.date_retour}\n` +
    `Lieu/activité : ${voyage.lieu} | ${voyage.activite}\n` +
    `Classes : ${voyage.classes}\n\n` +
    `Merci !\nLa direction.`;
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
    method: "POST",
    body: JSON.stringify({
      to: voyage.email,
      subject,
      text,
    }),
    headers: { "Content-Type": "application/json" },
  });
  return NextResponse.json({ success: true, message: "Voyage validé : le prof a été notifié pour l'étape 2." });
}