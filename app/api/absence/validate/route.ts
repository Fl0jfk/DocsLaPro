import { NextRequest, NextResponse } from "next/server";
import { readStore, removeEntry, AbsenceEntry } from "@/app/utils/jsonStore";
import { PDFDocument, rgb } from "pdf-lib";
import nodemailer from "nodemailer";

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole:   ["flojfk+direction_ecole@gmail.com"],
  direction_college: ["flojfk+direction_college@gmail.com"],
  direction_lycee:   ["flojfk+direction_lycee@gmail.com"],
  rh:                ["flojfk+rh@gmail.com"],
  secretariat:       ["flojfk+secretariat@gmail.com"],
  secretariat_ecole: ["flojfk+secretariat@gmail.com"],
  secretariat_college_lycee: ["flojfk+secretariat@gmail.com"]
};

const SIGNATURES: Record<string, string> = {
  directrice_ecole: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
  directrice_college: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
  directrice_lycee: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
};

const DEFAULT_DIRECTRICE_BY_CIBLE: Record<AbsenceEntry["cible"], string> = {
  direction_ecole: "directrice_ecole",
  direction_college: "directrice_college",
  direction_lycee: "directrice_lycee",
};

async function fetchSignatureBytes(url: string): Promise<Uint8Array> {
  try {
    const res = await fetch(url);
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return new Uint8Array();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, statut, declarerRectorat } = await req.json() as { id: string; statut: "validee" | "refusee"; declarerRectorat?: boolean };
    if (!id || !statut) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }
    const absences = await readStore();
    const demande = absences.find(a => a.id === id);
    if (!demande) return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    let destinataire: string[] = [];
    let mailSujet = "";
    let mailTexte = "";
    if (statut === "validee") {
      mailSujet = "Absence validée";
      mailTexte = `Absence validée de ${demande.nom} (${demande.email}) du ${demande.date_debut} au ${demande.date_fin}\nMotif: ${demande.motif}`;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      page.drawText("Déclaration d'absence validée", { x: 50, y: 800, size: 18, color: rgb(0, 0, 0) });
      page.drawText(`Établissement : ${demande.cible}`, { x: 50, y: 770 });
      page.drawText(`Nom : ${demande.nom}`, { x: 50, y: 740 });
      page.drawText(`Email : ${demande.email}`, { x: 50, y: 720 });
      page.drawText(`Type : ${demande.type}`, { x: 50, y: 700 });
      page.drawText(`Période : ${demande.date_debut} au ${demande.date_fin}`, { x: 50, y: 680 });
      page.drawText(`Motif : ${demande.motif}`, { x: 50, y: 660 });
      if (demande.commentaire) page.drawText(`Commentaire : ${demande.commentaire}`, { x: 50, y: 640 });
      const directriceKey = DEFAULT_DIRECTRICE_BY_CIBLE[demande.cible];
      const sigUrl = SIGNATURES[directriceKey];
      const sigBytes = await fetchSignatureBytes(sigUrl);
      if (sigBytes.length > 0) {
        const sigImage = sigUrl.endsWith(".png") ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
        page.drawImage(sigImage, { x: 400, y: 50, width: sigImage.width * 0.5, height: sigImage.height * 0.5 });
      }
      const pdfBytes = await pdfDoc.save();
      const pdfAttachment = {
        filename: "attestation-validation.pdf",
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf"
      };
      if (demande.type === "prof") {
        destinataire = demande.cible === "direction_ecole"
          ? RECIPIENTS.secretariat_ecole
          : RECIPIENTS.secretariat_college_lycee;
        mailTexte += declarerRectorat ? "\nDirection demande déclaration au rectorat" : "";
      } else {
        destinataire = RECIPIENTS.rh;
      }
     const attachments = [
        pdfAttachment,
        ...(demande.justificatifs || []).map(f => {
          let contentBuffer: Buffer;
          try {
            contentBuffer = Buffer.from(f.buffer, "base64");
          } catch {
            contentBuffer = Buffer.from([]);
          }
          return {
            filename: f.filename,
            content: contentBuffer,
            contentType: f.type,
          };
        })
      ];
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_MAIL,
        to: destinataire,
        subject: mailSujet,
        text: mailTexte,
        attachments,
      });
      await transporter.sendMail({
        from: process.env.SMTP_MAIL,
        to: demande.email,
        subject: "Votre absence a été validée",
        text: "Votre demande d'absence a été validée par la direction.",
        attachments: [pdfAttachment],
      });

    } else if (statut === "refusee") {
      destinataire = [demande.email];
      mailSujet = "Demande refusée";
      mailTexte = "Votre demande d'absence a été refusée par la direction.";
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS,
        },
      });
      await transporter.sendMail({ from: process.env.SMTP_MAIL, to: destinataire, subject: mailSujet, text: mailTexte });
    }
    await removeEntry(id);
    return NextResponse.json({ success: true, message: "Traitement effectué et notification envoyée." });
  } catch (err) {
    console.error("Erreur /api/absence/validate:", err);
    return NextResponse.json({ error: "Erreur serveur", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}