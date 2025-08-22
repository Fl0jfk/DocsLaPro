import { NextRequest, NextResponse } from "next/server";
import { readVoyages, writeVoyages } from "@/app/utils/voyageStore";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const CANTINE_EMAILS = ["flojfk+cantine@gmail.com"];
const TRANSPORTEURS = [
  { email: "flojfk+transporteur1@gmail.com", nom: "Transporteur 1" },
  { email: "flojfk+transporteur1@gmail.com", nom: "Transporteur 2" },
  { email: "flojfk+transporteur1@gmail.com", nom: "Transporteur 3" }
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    id, panier_repas, nb_repas, nb_vegetariens,
    lieu_repas, details_panier_repas,
    devis_transporteur, details_devis_transporteur,
    commentaire
  } = body;
  const voyages = await readVoyages();
  const voyageIdx = voyages.findIndex(v => v.id === id);
  if (voyageIdx === -1)
    return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
  const voyage = voyages[voyageIdx];
  voyages[voyageIdx] = {
    ...voyage,
    etape_2: {
      panier_repas: !!panier_repas,
      nb_repas: Number(nb_repas) || 0,
      nb_vegetariens: Number(nb_vegetariens) || 0,
      lieu_repas: lieu_repas || "",
      details_panier_repas: details_panier_repas || "",
      devis_transporteur: !!devis_transporteur,
      details_devis_transporteur: details_devis_transporteur || "",
      commentaire: commentaire || "",
      date: new Date().toISOString(),
    },
    etat: !!devis_transporteur ? "etape_3_en_attente" : "validee"
  };
  await writeVoyages(voyages);
  if (panier_repas) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    page.drawText("Demande de paniers repas (voyage scolaire)", { x: 50, y: 800, size: 17, color: rgb(0,0,0) });
    page.drawText(`Établissement : ${voyage.direction_cible}`, { x: 50, y: 770, size: 12 });
    page.drawText(`Organisateur: ${voyage.prenom} ${voyage.nom} (${voyage.email})`, { x: 50, y: 750, size: 12 });
    page.drawText(`Voyage : du ${voyage.date_depart} au ${voyage.date_retour} / ${voyage.lieu}`, { x: 50, y: 728, size: 12 });
    page.drawText(`Classes: ${voyage.classes}`, { x: 50, y: 710, size: 12 });
    page.drawText(`Repas demandés: ${nb_repas}, dont végétariens: ${nb_vegetariens}`, { x: 50, y: 690, size: 12 });
    page.drawText(`Lieu de récupération/service des repas: ${lieu_repas || ""}`, { x: 50, y: 672, size: 12 });
    page.drawText(`Particularités/allergies: ${details_panier_repas || ""}`, { x: 50, y: 650, size: 12 });
    page.drawText(`Commentaires: ${commentaire || ""}`, { x: 50, y: 632, size: 12 });
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const subject = `[Cantine] Demande paniers repas – voyage ${voyage.lieu} (${voyage.date_depart})`;
    const text = `Demande autom. de paniers repas pour le voyage scolaire organisé par ${voyage.prenom} ${voyage.nom}.\nProgramme et documents joints inclus.\nMerci de préparer la livraison pour les dates et lieux indiqués.`;
    const attachments = [
      { filename: "demande-paniers-repas.pdf", content: pdfBuffer, contentType: "application/pdf" },
      ...(voyage.programme ? [
        { filename: voyage.programme.filename, content: Buffer.from(voyage.programme.buffer, "base64"), contentType: voyage.programme.type }
      ] : []),
      ...(voyage.pieces_jointes?.map(f => ({
        filename: f.filename, content: Buffer.from(f.buffer, "base64"), contentType: f.type
      })) ?? [])
    ];
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
      method: "POST",
      body: JSON.stringify({
        to: CANTINE_EMAILS,
        subject,
        text,
        attachments
      }),
      headers: { "Content-Type": "application/json" }
    });
  }
  if (devis_transporteur) {
    for (const { email, nom } of TRANSPORTEURS) {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const size = 13;
      let y = 800;
      page.drawText("Demande de devis transporteur (voyage scolaire)", { x: 50, y, size: 17, font });
      y = y - 32; page.drawText(`Organisateur: ${voyage.prenom} ${voyage.nom} (${voyage.email})`, { x: 50, y, size, font });
      y -= 20; page.drawText(`Établissement: ${voyage.direction_cible}`, { x: 50, y, size, font });
      y -= 20; page.drawText(`Du ${voyage.date_depart} au ${voyage.date_retour} – ${voyage.lieu}`, { x: 50, y, size, font });
      y -= 20; page.drawText(`Classes: ${voyage.classes}`, { x: 50, y, size, font });
      y -= 20; page.drawText(`Élèves: ${voyage.effectif_eleves}, Accompagnateurs: ${voyage.effectif_accompagnateurs}`, { x: 50, y, size, font });
      y -= 20; page.drawText(`Détails demande :`, { x: 50, y, size, font });
      y -= 18; page.drawText(details_devis_transporteur || "A compléter", { x: 60, y, size: 11, font });
      y -= 32; page.drawText(`Commentaire prof : ${commentaire || ""}`, { x: 50, y, size: 11, font });
      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);
      const deposeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/travels/depot-devis?id=${voyage.id}&transporteur=${encodeURIComponent(nom)}`;
      const subject = `[Voyage scolaire] Demande de devis transporteur - ${voyage.lieu}`;
      const text = `Demande de devis transporteur pour le voyage scolaire :
                    - Organisateur : ${voyage.prenom} ${voyage.nom} (${voyage.email})
                    - Date : du ${voyage.date_depart} au ${voyage.date_retour}
                    - Classes : ${voyage.classes}
                    - Détails dans le PDF joint et dans le programme le cas échéant.
                    Vous pouvez déposer votre devis directement ici :
                    ${deposeUrl}
                    Merci de ne pas répondre à ce mail automatique, utilisez le lien pour déposer votre devis PDF.`;
      const attachments = [
        { filename: "demande-devis-transporteur.pdf", content: pdfBuffer, contentType: "application/pdf" },
        ...(voyage.programme ? [
          { filename: voyage.programme.filename, content: Buffer.from(voyage.programme.buffer, "base64"), contentType: voyage.programme.type }
        ] : []),
        ...(voyage.pieces_jointes?.map(f => ({
          filename: f.filename, content: Buffer.from(f.buffer, "base64"), contentType: f.type
        })) ?? [])
      ];
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email`, {
        method: "POST",
        body: JSON.stringify({
          to: [email],
          subject,
          text,
          attachments
        }),
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  return NextResponse.json({
    success: true,
    message: "Étape 2 enregistrée. Les mails ont été envoyés aux services concernés."
  });
}