import { NextRequest, NextResponse } from "next/server";
import { readStore, removeEntry } from "@/app/utils/jsonStore";

// Simpli pour POST {id, statut: "validee"|"refusee"} pour traiter la demande
export async function POST(req: NextRequest) {
  const { id, statut } = await req.json();
  const absences = await readStore();
  const demande = absences.find(a => a.id === id);
  if (!demande)
    return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
  
  // Notif selon demande
  let destinataire: string;
  let mailSujet: string;
  let mailTexte: string;

  if (demande.type === "prof" && statut === "validee") {
    destinataire = "rectorat@ac-academie.fr"; // adapte valeur cible
    mailSujet = "Déclaration d'absence professeur validée";
    mailTexte = `Absence validée de ${demande.nom} (${demande.email})\nDu ${demande.date_debut} au ${demande.date_fin}\nMotif: ${demande.motif}`;
    // Optionnel : joint le justificatif comme attachement base64 décodé
  } else if (demande.type === "salarie" && statut === "validee") {
    destinataire = "compta@ecole.com";
    mailSujet = "Déclaration d'absence salarié validée";
    mailTexte = `Absence salariée validée de ${demande.nom} (${demande.email})\nDu ${demande.date_debut} au ${demande.date_fin}\nMotif: ${demande.motif}`;
  } else {
    destinataire = demande.email;
    mailSujet = "Votre demande a été refusée";
    mailTexte = "Malheureusement, votre demande d'absence a été refusée par la direction.";
  }

  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
  method: "POST",
  body: JSON.stringify({
    to: [destinataire],
    subject: mailSujet,
    text: mailTexte,
    attachments:
      demande.justificatif_filename && demande.justificatif_buffer && demande.justificatif_type
        ? [{
            filename: demande.justificatif_filename,
            content: Buffer.from(demande.justificatif_buffer, "base64"),
            contentType: demande.justificatif_type,
          }]
        : undefined
  }),
  headers: { "Content-Type": "application/json" },
});

  await removeEntry(id);

  return NextResponse.json({ success: true, message: "Traitement effectué et notification transmise." });
}
