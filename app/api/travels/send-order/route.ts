import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs/promises";
import path from "path";
import { extractDevisMetadataWithMistral, ocrS3Key } from "@/app/lib/travel-devis-ocr";

function buildConfirmationPDF(opts: {
  providerName: string;
  tripTitle: string;
  amount?: string;
  reference?: string;
  extractedPrice?: string | null;
  logoDataUri: string | null;
  tripData?: any;
}): Buffer {
  const { providerName, tripTitle, amount, reference, extractedPrice, logoDataUri, tripData } = opts;
  const d = tripData || {};
  const effectifTotal = (Number(d.nbEleves) || 0) + (Number(d.nbAccompagnateurs) || 0);
  const effectifStr = effectifTotal > 0 ? `${effectifTotal} personnes (dont ${d.nbAccompagnateurs || 0} adultes)` : null;
  const datesStr = d.startDate && d.endDate ? `Du ${new Date(d.startDate).toLocaleDateString("fr-FR")} au ${new Date(d.endDate).toLocaleDateString("fr-FR")}` : d.date ? new Date(d.date).toLocaleDateString("fr-FR") : null;
  const agreedPrice = extractedPrice || amount || null;
  const doc = new jsPDF({ compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 15;
  const MR = W - 15;
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  if (logoDataUri) { doc.addImage(logoDataUri, "PNG", ML, 6, 24, 24)}
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("La Providence Nicolas Barré", MR, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Groupe scolaire catholique sous contrat", MR, 19, { align: "right" });
  doc.text("6, rue de Neuvillette — 76240 Le Mesnil-Esnard", MR, 24.5, { align: "right" });
  doc.text("02 32 86 50 90", MR, 30, { align: "right" });
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 35, W, 1.8, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 36.8, W, 0.6, "F");
  const colA = ML;
  const colB = W / 2 + 8;
  let yA = 45;
  let yB = 45;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("DESTINATAIRE", colB, yB);
  yB += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(providerName, colB, yB);
  yB += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("DATE D'ENVOI", colB, yB);
  yB += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(dateStr, colB, yB);
  const sepY = Math.max(yA, yB) + 9;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(ML, sepY, MR, sepY);
  let sy = sepY + 10;
  doc.setFillColor(22, 163, 74);
  doc.rect(ML, sy - 5, 2.5, 13, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("OBJET", ML + 7, sy - 0.5);
  sy += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  const subjectLine = [
    "Confirmation de devis transport",
    reference ? `  Réf. ${reference}` : "",
    amount ? `  —  ${amount} €` : "",
  ].join("");
  doc.text(subjectLine, ML + 7, sy);
  sy += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const intro = "Nous avons le plaisir de vous confirmer la sélection de votre offre pour le projet ci-dessous. Veuillez trouver en pièce jointe le devis signé valant bon de commande. Nous vous remercions de votre réactivité et vous souhaitons bonne route !";
  const introLines = doc.splitTextToSize(intro, MR - ML);
  doc.text(introLines, ML, sy);
  sy += introLines.length * 4.5 + 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("RÉCAPITULATIF", ML, sy);
  sy += 3.5;
  autoTable(doc, {
    startY: sy,
    body: [
      ["Projet", tripTitle],
      ...(d.classes ? [["Classes concernées", d.classes]] : []),
      ...(d.destination ? [["Destination", d.destination]] : []),
      ...(datesStr ? [["Date(s) du voyage", datesStr]] : []),
      ...(effectifStr ? [["Effectif total", effectifStr]] : []),
      ...(reference ? [["Référence devis", reference]] : []),
      ...(agreedPrice ? [["💶 Montant convenu", agreedPrice]] : []),
      ["Date de confirmation", dateStr],
    ],
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold", textColor: [30, 41, 59] as [number, number, number] },
      1: { textColor: [71, 85, 105] as [number, number, number] },
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
  });
  const closingY = (doc as any).lastAutoTable.finalY + 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Dans l'attente de vous lire, nous vous adressons nos cordiales salutations.", ML, closingY);
  doc.setFillColor(241, 245, 249);
  doc.rect(0, H - 14, W, 14, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, H - 14, W, H - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Groupe Scolaire La Providence Nicolas Barré  ·  Établissement catholique sous contrat avec l'État", ML, H - 7);
  doc.text("76240 Le Mesnil-Esnard", MR, H - 7, { align: "right" });
  return Buffer.from(doc.output("arraybuffer"));
}

export async function POST(req: Request) {
  try {
    const { providerEmail, signedQuoteUrl, providerName, tripTitle, tripData, amount, reference } = await req.json();
    if (!providerEmail) { return NextResponse.json({ error: "Email du transporteur manquant" }, { status: 400 })}
    let logoDataUri: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png");
      const logoBuffer = await fs.readFile(logoPath);
      logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (e) {
      console.error("Logo load error (send-order):", e);
    }
    const urlObj = new URL(signedQuoteUrl);
    const fileKey = decodeURIComponent(urlObj.pathname.substring(1));
    let extractedPrice: string | null = null;
    try {
      const ocrText = await ocrS3Key(process.env.BUCKET_NAME!, fileKey);
      if (ocrText) {
        const meta = await extractDevisMetadataWithMistral(ocrText);
        extractedPrice = meta.price;
      }
    } catch (ocrErr) {
      console.error("[send-order] Erreur OCR/Mistral:", ocrErr);
    }
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 });
    const pdfResponse = await fetch(presignedUrl);
    if (!pdfResponse.ok) { throw new Error(`Impossible d'accéder au PDF sur S3 : ${pdfResponse.statusText}`);}
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS,
      },
    });
    const confirmationPdf = buildConfirmationPDF({
      providerName,
      tripTitle,
      tripData: tripData ?? undefined,
      amount: amount ?? undefined,
      reference: reference ?? undefined,
      extractedPrice,
      logoDataUri,
    });
    const mailOptions = {
      from: `"Gestion Voyages" <${process.env.SMTP_USER}>`,
      to: providerEmail,
      subject: `Confirmation de commande : ${tripTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <p>Bonjour <strong>${providerName}</strong>,</p>
          <p>Nous avons le plaisir de vous confirmer la sélection de votre offre pour le projet : <strong>${tripTitle}</strong>.</p>
          <p>Veuillez trouver en pièce jointe la lettre de confirmation ainsi que le <strong>devis signé</strong> valant bon de commande.</p>
          <br />
          <p>Cordialement,</p>
          <p><em>L'administration de l'établissement</em></p>
        </div>
      `,
      attachments: [
        {
          filename: `Confirmation_Transport_${tripTitle.replace(/\s+/g, "_")}.pdf`,
          content: confirmationPdf,
          contentType: "application/pdf",
        },
        {
          filename: `Devis_Signe_${tripTitle.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur Envoi Mail:", error.message);
    return NextResponse.json({ 
      error: "Erreur lors de l'envoi du mail", 
      details: error.message 
    }, { status: 500 });
  }
}