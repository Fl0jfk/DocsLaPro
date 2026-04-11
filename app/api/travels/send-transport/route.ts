import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";
import { TRANSPORT_PROVIDERS } from "@/app/lib/transport-providers";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { tripData,  userName } = body;
    const { data } = tripData;
    const moisFR = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];

    const moisIndexByName: Record<string, number> = {
      janvier: 0,
      janv: 0,
      february: 1,
      fév: 1,
      février: 1,
      fevrier: 1,
      fev: 1,
      mars: 2,
      march: 2,
      avril: 3,
      april: 3,
      mai: 4,
      june: 5,
      juin: 5,
      july: 6,
      juillet: 6,
      août: 7,
      aout: 7,
      august: 7,
      septembre: 8,
      sep: 8,
      sept: 8,
      october: 9,
      oct: 9,
      octobre: 9,
      novembre: 10,
      nov: 10,
      november: 10,
      décembre: 11,
      decembre: 11,
      dec: 11,
      december: 11,
    };

    const formatDateFR = (input?: string | null) => {
      if (!input) return "—";
      const raw = String(input).trim();
      const isoFull = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoFull) {
        const [, y, mm, dd] = isoFull;
        const monthIdx = Number(mm) - 1;
        const dayNum = Number(dd);
        const monthName = moisFR[monthIdx] || "";
        return `${dayNum} ${monthName} ${y}`;
      }
      const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
      if (isoMonth) {
        const [, y, mm] = isoMonth;
        const monthIdx = Number(mm) - 1;
        const monthName = moisFR[monthIdx] || "";
        return `1 ${monthName} ${y}`;
      }
      const monthYear = raw.match(/^([A-Za-zÀ-ÿœŒ]+)\s+(\d{4})$/);
      if (monthYear) {
        const [, m, y] = monthYear;
        const key = String(m).toLowerCase().replace(/\./g, "");
        const monthIdx = moisIndexByName[key];
        const monthName = typeof monthIdx === "number" ? moisFR[monthIdx] : key;
        return `1 ${monthName} ${y}`;
      }
      return raw;
    };
    const departDateRaw = data.startDate || data.date;
    const returnDateRaw = data.endDate || data.date;
    const departText = [ formatDateFR(departDateRaw), data.startTime ? `à ${data.startTime}` : "",].filter(Boolean).join(" ");
    const returnText = [ formatDateFR(returnDateRaw), data.endTime ? `à ${data.endTime}` : "",].filter(Boolean).join(" ");
    const transporteurs = TRANSPORT_PROVIDERS;
    const effectifTotal = Number(data.nbEleves) + Number(data.nbAccompagnateurs);
    let logoDataUri: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png");
      const logoBuffer = await fs.readFile(logoPath);
      logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (e) { console.error("Logo load error:", e)}
    const buildDemandePDF = (transporteurName: string): Buffer => {
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
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Professeur demandeur :", colA, yA);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(userName, colA, yA + 5);
      yA += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("DESTINATAIRE", colB, yB);
      yB += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(transporteurName, colB, yB);
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
      doc.setFillColor(37, 99, 235);
      doc.rect(ML, sy - 5, 2.5, 13, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("OBJET", ML + 7, sy - 0.5);
      sy += 5.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Demande de devis transport", ML + 7, sy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Réf. ${tripData.id}`, MR, sy, { align: "right" });
      sy += 10;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const intro = "Nous vous adressons, par la présente, une demande de devis pour la prestation de transport scolaire décrite ci-dessous. Nous vous remercions de bien vouloir nous faire parvenir votre offre tarifaire dans les meilleurs délais.";
      const introLines = doc.splitTextToSize(intro, MR - ML);
      doc.text(introLines, ML, sy);
      sy += introLines.length * 4.5 + 9;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("DÉTAILS DE LA PRESTATION", ML, sy);
      sy += 3.5;
      autoTable(doc, {
        startY: sy,
        body: [
          ["Projet", data.title || "—"],
          ["Réf. dossier (à rappeler par e-mail)", String(tripData.id)],
          ["Classes concernées", data.classes || "—"],
          ["Destination", data.destination || "—"],
          ["Date de départ", departText],
          ["Date de retour", returnText],
          ["Lieu de RDV / Départ", data.transportRequest?.pickupPoint || "—"],
          ["Effectif total", `${effectifTotal} personnes (dont ${data.nbAccompagnateurs} adultes)`],
          ["Bus reste sur place", data.transportRequest?.stayOnSite ? "Oui" : "Non"],
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
      if (data.transportRequest?.freeText) {
        const afterY = (doc as any).lastAutoTable.finalY + 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("INFORMATIONS COMPLÉMENTAIRES", ML, afterY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const freeLines = doc.splitTextToSize(String(data.transportRequest.freeText), MR - ML);
        doc.text(freeLines, ML, afterY + 5.5);
      }
      const closingY = (doc as any).lastAutoTable.finalY + 50;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Dans l'attente de votre retour, nous vous adressons nos cordiales salutations.", ML, closingY);
      doc.setFillColor(241, 245, 249);
      doc.rect(0, H - 14, W, 14, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(0, H - 14, W, H - 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text( "Groupe Scolaire La Providence Nicolas Barré  ·  Établissement catholique sous contrat avec l'État", ML, H - 7);
      doc.text("76240 Le Mesnil-Esnard", MR, H - 7, { align: "right" });
      return Buffer.from(doc.output("arraybuffer"));
    };
    const pdfBuffer = buildDemandePDF("(tous transporteurs)");
    const attachments: any[] = [
      {
        filename: `Demande_Transport_${data.destination.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];
    if (data.transportRequest.busProgramFile && data.transportRequest.busProgramFile.url) {
      try {
        const s3Url = data.transportRequest.busProgramFile.url;
        const urlObj = new URL(s3Url);
        const fileKey = decodeURIComponent(urlObj.pathname.substring(1)); 
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
        const fileRes = await fetch(presignedUrl);
        if (fileRes.ok) {
          const arrayBuffer = await fileRes.arrayBuffer();          
          attachments.push({
            filename: data.transportRequest.busProgramFile.name || "Programme_de_route.pdf",
            content: Buffer.from(arrayBuffer),
            contentType: 'application/pdf'
          });
        } else { console.error("Erreur S3 response:", fileRes.status, fileRes.statusText)}
      } catch (e) { console.error("Impossible de récupérer la PJ via URL présignée", e)}
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    for (const transporteur of transporteurs) {
      try {
      const personalPdf = buildDemandePDF(transporteur.name);
      const personalAttachments = [
        {
          filename: `Demande_Transport_${data.destination.replace(/\s+/g, "_")}.pdf`,
          content: personalPdf,
          contentType: "application/pdf",
        },
        ...attachments.slice(1),
      ];
      await transporter.sendMail({
        from: `"Plateforme Voyages" <${process.env.SMTP_USER}>`,
        to: transporteur.email,
        subject: `🚗 DEMANDE DE DEVIS - ${data.destination.toUpperCase()} - ${userName}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #334155;">
            <h2>Bonjour ${transporteur.name},</h2>
            <p>Veuillez trouver ci-joint une demande de devis pour un transport scolaire à destination de <strong>${data.destination}</strong>.</p>
            <p>Le récapitulatif complet ainsi que le programme éventuel sont joints à cet email.</p>
            <div style="margin: 24px 0; padding: 16px; border-radius: 12px; background-color: #f0fdf4; border: 1px solid #86efac;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #166534;">Réponse par e-mail</p>
              <p style="margin: 0; font-size: 14px; color: #14532d;">Répondez à cet e-mail ou écrivez à la boîte dédiée aux devis de l'établissement en <strong>joignant votre devis en PDF</strong>. Indiquez dans l'<strong>objet</strong> la référence : <strong>Réf. ${tripData.id}</strong> — elle figure aussi sur le PDF joint.</p>
            </div>
            <p>Cordialement,<br/>L'administration.</p>
          </div>
        `,
        attachments: personalAttachments,
      });
      } catch (sendErr: any) { console.error(`Erreur envoi à ${transporteur.name}:`, sendErr.message);}
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur API Gmail/Transport:", error.message);
    return NextResponse.json({ error: "Échec de l'envoi", details: error.message }, { status: 500 });
  }
}