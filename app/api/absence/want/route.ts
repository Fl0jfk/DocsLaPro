import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { addEntry, AbsenceEntry } from "@/app/utils/jsonStore";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const type = data.get("type") as "prof" | "salarie";
  const cible = data.get("cible") as "direction_ecole" | "direction_college" | "direction_lycee";
  const nom = data.get("nom") as string;
  const email = data.get("email") as string;
  const date_debut = data.get("date_debut") as string;
  const date_fin = data.get("date_fin") as string;
  const motif = data.get("motif") as string;
  const commentaire = data.get("commentaire") as string | undefined;
  const attachments: {
    filename: string;
    buffer: string;
    type: string;
  }[] = [];
  const files = data.getAll("attachments").filter(f => f instanceof File) as File[];
  if (files.length > 5) {
    return NextResponse.json({ error: "Pas plus de 5 fichiers." }, { status: 400 });
  }
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    attachments.push({
      filename: file.name,
      buffer: Buffer.from(arrayBuffer).toString("base64"),
      type: file.type,
    });
  }
  const absence: AbsenceEntry = {
    id: uuidv4(),
    type,
    cible,
    nom,
    email,
    date_debut,
    date_fin,
    motif,
    commentaire,
    justificatifs: attachments,
    etat: "en_attente",
    date_declaration: new Date().toISOString(),
  };
  await addEntry(absence);
  const lien = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/validationAbsences?id=${absence.id}`;
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
    method: "POST",
    body: JSON.stringify({
      target: cible,
      subject: `[Absence] Nouvelle demande (${motif})`,
      text:
        `Nouvelle demande d'absence de ${nom} (${email}) du ${date_debut} au ${date_fin}.\nMotif: ${motif}\n` +
        `Cliquez pour traiter: ${lien}`,
      replyTo: email,
    }),
    headers: { "Content-Type": "application/json" },
  });
  return NextResponse.json({ success: true, message: "Demande enregistrée et transmise à la direction." });
}
