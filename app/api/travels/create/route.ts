import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { addVoyage, VoyageEntry } from "@/app/utils/voyageStore";

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole: ["flojfk+direction.ecole@gmail.com"],
  direction_college: ["flojfk+direction.college@gmail.com"],
  direction_lycee: ["flojfk+direction.lycee@gmail.com"],
  default: ["secretariat@domaine.fr"],
};

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const direction_cible = form.get("direction_cible") as keyof typeof RECIPIENTS;
  const files = form.getAll("pj").filter(f => f instanceof File) as File[];
  if (files.length > 5) return NextResponse.json({ error: "Pas plus de 5 fichiers" }, { status: 400 });
  const pieces_jointes = [];
  for (const file of files) {
    const buf = await file.arrayBuffer();
    pieces_jointes.push({
      filename: file.name,
      buffer: Buffer.from(buf).toString("base64"),
      type: file.type,
    });
  }
  const programmeFile = (form.get("programme") instanceof File) ? form.get("programme") as File : null;
  let programme = null;
  if (programmeFile) {
    const progBuf = await programmeFile.arrayBuffer();
    programme = {
      filename: programmeFile.name,
      buffer: Buffer.from(progBuf).toString("base64"),
      type: programmeFile.type,
    };
  }
  const voyage: VoyageEntry = {
    id: uuidv4(),
    prenom: form.get("prenom") as string,
    nom: form.get("nom") as string,
    email: form.get("email") as string,
    direction_cible: direction_cible,
    date_depart: form.get("date_depart") as string,
    date_retour: form.get("date_retour") as string,
    lieu: form.get("lieu") as string,
    activite: form.get("activite") as string,
    classes: form.get("classes") as string,
    effectif_eleves: Number(form.get("effectif_eleves") || 0),
    effectif_accompagnateurs: Number(form.get("effectif_accompagnateurs") || 0),
    commentaire: form.get("commentaire") as string,
    pieces_jointes,
    programme,
    etat: "en_attente",
    date_declaration: new Date().toISOString(),
  };
  await addVoyage(voyage);
  const attachments = [
    ...(programme ? [{ filename: programme.filename, content: Buffer.from(programme.buffer, "base64"), contentType: programme.type }] : []),
    ...pieces_jointes.map(f => ({
      filename: f.filename,
      content: Buffer.from(f.buffer, "base64"),
      contentType: f.type,
    }))
  ];
  const to = RECIPIENTS[direction_cible] || RECIPIENTS.default;
  const subject = `[Voyage scolaire] Nouvelle demande à valider - ${voyage.lieu}`;
  const text =
    `Nouvelle demande de voyage scolaire:\n\n` +
    `Établissement : ${direction_cible}\n` +
    `Demandeur : ${voyage.prenom} ${voyage.nom} (${voyage.email})\n` +
    `Dates : du ${voyage.date_depart} au ${voyage.date_retour}\n` +
    `Lieu/activité : ${voyage.lieu} | ${voyage.activite}\n` +
    `Classes concernées : ${voyage.classes}\n` +
    `Élèves : ${voyage.effectif_eleves} | Accompagnateurs : ${voyage.effectif_accompagnateurs}\n` +
    (voyage.commentaire ? `Programme : ${voyage.commentaire}\n` : "") +
    `\nLien de validation : ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/travels/validate?id=${voyage.id}`;
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
    method: "POST",
    body: JSON.stringify({ to, subject, text, attachments }),
    headers: { "Content-Type": "application/json" },
  });
  return NextResponse.json({ success: true, message: "Demande enregistrée et transmise à la direction." });
}

