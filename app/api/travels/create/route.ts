import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { saveVoyage, VoyageEntry } from "@/app/utils/voyageStore";
import { currentUser } from "@clerk/nextjs/server";

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole: ["flojfk+direction.ecole@gmail.com"],
  direction_college: ["flojfk+direction.college@gmail.com"],
  direction_lycee: ["flojfk+direction.lycee@gmail.com"],
};

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const body = await req.json();
  const voyageId = uuidv4();
  const voyage: VoyageEntry = {
    id: voyageId,
    prenom: body.prenom,
    nom: body.nom,
    email: body.email,
    direction_cible: body.direction_cible,
    date_depart: body.date_depart,
    date_retour: body.date_retour,
    lieu: body.lieu,
    activite: body.activite,
    classes: body.classes,
    effectif_eleves: body.effectif_eleves,
    effectif_accompagnateurs: body.effectif_accompagnateurs,
    commentaire: body.commentaire,
    pieces_jointes: body.pieces_jointes || [],
    status: body.status,
    date_declaration: new Date().toISOString(),
  };
  await saveVoyage(user.id, voyage);
  const to = RECIPIENTS[body.direction_cible] || [];
  const subject = `[Voyage scolaire] Nouvelle demande - ${voyage.lieu}`;
  const text = `
Nouvelle demande de voyage scolaire déposée sur la plateforme.

Établissement : ${voyage.direction_cible}
Demandeur : ${voyage.prenom} ${voyage.nom} (${voyage.email})
Dates : du ${voyage.date_depart} au ${voyage.date_retour}
Lieu / activité : ${voyage.lieu} | ${voyage.activite}
Classes concernées : ${voyage.classes}
Élèves : ${voyage.effectif_eleves} | Accompagnateurs : ${voyage.effectif_accompagnateurs}

${voyage.commentaire ? `Commentaire : ${voyage.commentaire}` : ""}

➡️ Connectez-vous sur la plateforme pour consulter et valider cette demande.
`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: `"Voyages scolaires" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
  return NextResponse.json({
    success: true,
    message: "Demande enregistrée et notification envoyée à la direction.",
  });
}
