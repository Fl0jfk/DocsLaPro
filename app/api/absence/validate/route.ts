import { NextRequest, NextResponse } from "next/server";
import { readStore, removeEntry } from "@/app/utils/jsonStore";
import { PDFDocument, rgb } from "pdf-lib";

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole: ["flojfk+directionecole@gmail.com"],
  direction_college: ["flojfk+directioncollege@gmail.com"],
  direction_lycee: ["flojfk+directionlycee@gmail.com"],
  rh: ["flojfk+rh@gmail.com"],
  default: ["secretariat@ecole.com"],
  secretariat: ["florian.hacquevil"],
};

export async function GET() {
  try {
    const absences = await readStore();
    return NextResponse.json(absences);
  } catch (e) {
    console.error("Erreur lors de la lecture des absences :", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const { id, statut } = await req.json();
  const absences = await readStore();
  const demande = absences.find(a => a.id === id);
  if (!demande)
    return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
  let destinataire: string | string[];
  let mailSujet: string;
  let mailTexte: string;
  if (demande.type === "prof" && statut === "validee") {
    destinataire = RECIPIENTS.rh;
    mailSujet = "Déclaration d'absence professeur validée";
    mailTexte = `Absence validée de ${demande.nom} (${demande.email})\nDu ${demande.date_debut} au ${demande.date_fin}\nMotif: ${demande.motif}`;
  } else if (demande.type === "salarie" && statut === "validee") {
    destinataire = RECIPIENTS.rh;
    mailSujet = "Déclaration d'absence salarié validée";
    mailTexte = `Absence salariée validée de ${demande.nom} (${demande.email})\nDu ${demande.date_debut} au ${demande.date_fin}\nMotif: ${demande.motif}`;
  } else {
    destinataire = demande.email;
    mailSujet = "Votre demande a été refusée";
    mailTexte = "Malheureusement, votre demande d'absence a été refusée par la direction.";
  }
  let pdfBuffer: Buffer | undefined = undefined;
  if (statut === "validee") {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    page.drawText("Déclaration d'absence validée", { x: 50, y: 800, size: 18, color: rgb(0, 0, 0) });
    page.drawText(`Etablissement : ${demande.cible}`, { x: 50, y: 770 });
    page.drawText(`Nom : ${demande.nom}`, { x: 50, y: 740 });
    page.drawText(`Email : ${demande.email}`, { x: 50, y: 720 });
    page.drawText(`Type : ${demande.type}`, { x: 50, y: 700 });
    page.drawText(`Période : ${demande.date_debut} au ${demande.date_fin}`, { x: 50, y: 680 });
    page.drawText(`Motif : ${demande.motif}`, { x: 50, y: 660 });
    if (demande.commentaire)
      page.drawText(`Commentaire : ${demande.commentaire}`, { x: 50, y: 640 });
    page.drawText(
      `Absence validée par la direction le ${new Date().toLocaleDateString()}`,
      { x: 50, y: 600, size: 12, color: rgb(0, 0, 1) }
    );
    const pdfBytes = await pdfDoc.save();
    pdfBuffer = Buffer.from(pdfBytes);
  }
  const pjJustificatifs =
    (demande.justificatifs || [])
      .slice(0, 5)
      .map(f => ({
        filename: f.filename,
        content: Buffer.from(f.buffer, "base64"),
        contentType: f.type,
      }));
  const attachments = [
    ...(pdfBuffer
      ? [{ filename: "attestation-validation.pdf", content: pdfBuffer, contentType: "application/pdf" }]
      : []),
    ...pjJustificatifs,
  ];
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
    method: "POST",
    body: JSON.stringify({
      to: Array.isArray(destinataire) ? destinataire : [destinataire],
      subject: mailSujet,
      text: mailTexte,
      attachments,
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (
    statut === "validee" &&
    demande.email &&
    demande.email !== "" &&
    typeof demande.email === "string"
  ) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
      method: "POST",
      body: JSON.stringify({
        to: demande.email,
        subject: "Votre déclaration d'absence a bien été validée",
        text: "Votre demande d'absence a été traitée et validée par la direction.\n\nVous trouverez en pièce jointe l'attestation PDF.",
        attachments: pdfBuffer
          ? [{ filename: "attestation-validation.pdf", content: pdfBuffer, contentType: "application/pdf" }]
          : undefined,
      }),
      headers: { "Content-Type": "application/json" },
    });
  }
  if (demande.type === "prof" && statut === "validee") {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
      method: "POST",
      body: JSON.stringify({
        to: RECIPIENTS.secretariat,
        subject: "Archivage absence papier : professeur validé",
        text:
          `Archivage pour impression : absence validée de ${demande.nom} (${demande.email})\n` +
          `Du ${demande.date_debut} au ${demande.date_fin}\nMotif: ${demande.motif}\n\n` +
          `Voir PJ pour impression (PDF attestation + justificatifs)`,
        attachments,
      }),
      headers: { "Content-Type": "application/json" },
    });
  }
  await removeEntry(id);
  return NextResponse.json({ success: true, message: "Traitement effectué et notification(s) transmise(s)." });
}
