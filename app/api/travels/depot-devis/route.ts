import { NextRequest, NextResponse } from "next/server";
import { readVoyages, writeVoyages } from "@/app/utils/voyageStore";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = form.get("id") as string;
  const nom_transporteur = form.get("transporteur") as string | undefined;
  const message = form.get("message") as string | undefined;
  const devisFile = form.get("devis") as File | null;
  if (!devisFile)
    return NextResponse.json({ error: "Aucune pièce jointe reçue." }, { status: 400 });
  const voyages = await readVoyages();
  const voyageIdx = voyages.findIndex(v => v.id === id);
  if (voyageIdx === -1)
    return NextResponse.json({ error: "Voyage inexistant." }, { status: 404 });
  const buf = await devisFile.arrayBuffer();
  const newDevis = {
    filename: devisFile.name,
    buffer: Buffer.from(buf).toString("base64"),
    type: devisFile.type,
    date: new Date().toISOString(),
    transporteur: nom_transporteur,
    message
  };
  const voyage = voyages[voyageIdx];
  voyages[voyageIdx] = {
    ...voyage,
    devis: [...(voyage.devis || []), newDevis]
  };
  await writeVoyages(voyages);
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
    method: "POST",
    body: JSON.stringify({
      to: voyage.email,
      subject: "[Voyage scolaire] Un devis a été déposé pour votre voyage scolaire",
      text: `Un transporteur (${nom_transporteur || "inconnu"}) a déposé un devis pour votre voyage "${voyage.lieu}" du ${voyage.date_depart} au ${voyage.date_retour}.\n\nMessage éventuel du transporteur :\n${message || "(aucun)"}\n\nConnectez-vous à l'espace prof pour voir et télécharger cette pièce jointe.`
    }),
    headers: { "Content-Type": "application/json" },
  });
  return NextResponse.json({ success: true, message: "Devis transmis. Merci !" });
}
