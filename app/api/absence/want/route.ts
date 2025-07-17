import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { addEntry, AbsenceEntry } from "@/app/utils/jsonStore";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const type = data.get("type") as "prof" | "salarie";
  const cible = data.get("cible") as "ecole" | "college" | "lycee";
  const nom = data.get("nom") as string;
  const email = data.get("email") as string;
  const date_debut = data.get("date_debut") as string;
  const date_fin = data.get("date_fin") as string;
  const motif = data.get("motif") as string;
  const commentaire = data.get("commentaire") as string | undefined;
  const justificatif = data.get("attachment") as File | undefined;

  let justificatif_filename: string | undefined = undefined;
  let justificatif_buffer: string | undefined = undefined;
  let justificatif_type: string | undefined = undefined;

  if (justificatif && typeof justificatif === "object" && "arrayBuffer" in justificatif) {
    justificatif_filename = justificatif.name;
    justificatif_type = justificatif.type;
    const buf = await justificatif.arrayBuffer();
    justificatif_buffer = Buffer.from(buf).toString("base64");
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
    justificatif_filename,
    justificatif_buffer,
    justificatif_type,
    etat: "en_attente",
    date_declaration: new Date().toISOString(),
  };

  await addEntry(absence);

  // Envoie un mail à la direction avec lien validation (à adapter à ta config)
  const lien = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/validation/absence?id=${absence.id}`;
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