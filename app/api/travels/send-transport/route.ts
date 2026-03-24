import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) {
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
      "janv": 0,
      "janv.": 0,
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
      // ISO: YYYY-MM-DD
      const isoFull = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoFull) {
        const [, y, mm, dd] = isoFull;
        const monthIdx = Number(mm) - 1;
        const dayNum = Number(dd);
        const monthName = moisFR[monthIdx] || "";
        return `${dayNum} ${monthName} ${y}`;
      }
      // ISO month: YYYY-MM (no day provided -> use 1)
      const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
      if (isoMonth) {
        const [, y, mm] = isoMonth;
        const monthIdx = Number(mm) - 1;
        const monthName = moisFR[monthIdx] || "";
        return `1 ${monthName} ${y}`;
      }
      // Month year in words: "March 2026" / "mars 2026"
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
    const departText = [
      formatDateFR(departDateRaw),
      data.startTime ? `à ${data.startTime}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const returnText = [
      formatDateFR(returnDateRaw),
      data.endTime ? `à ${data.endTime}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Names must match app/travels/devis/[id]/page.tsx PROVIDER_EMAILS.
    const transporteurs = [
      { name: "Perrier", email: "perrier-voyages@orange.fr" },
      { name: "Reflexe", email: "florian.hacqueville-mathi@ac-normandie.fr" },
      { name: "Cars Bleus", email: "carbleus@mail.fr" },
      { name: "Hangard", email: "hangard.autocars@outlook.fr" },
    ];

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 14;
    const headerHeight = 22;
    const effectifTotal = Number(data.nbEleves) + Number(data.nbAccompagnateurs);

    // Header bar
    doc.setFillColor(24, 170, 226);
    doc.rect(0, 0, pageWidth, headerHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DEMANDE DE TRANSPORT", marginLeft, 15);

    // Company logo (from /public)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const logoFile = "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
      if (appUrl) {
        const logoUrl = `${appUrl}${encodeURIComponent(logoFile)}`;
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) {
          const arrayBuffer = await logoRes.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const dataUri = `data:image/png;base64,${base64}`;
          const imgProps = doc.getImageProperties(dataUri);
          const targetW = 34;
          const targetH = (imgProps.height * targetW) / imgProps.width;
          const x = pageWidth - targetW - marginLeft;
          const y = 2.5;
          doc.addImage(dataUri, "PNG", x, y, targetW, targetH);
          // Clickable logo (helps personalization when opening the PDF)
          try {
            doc.link(x, y, targetW, targetH, { url: appUrl });
          } catch {
            // `link` support may vary by jsPDF build; ignore if unsupported.
          }
        }
      }
    } catch (e) {
      console.error("Erreur ajout logo transport:", e);
    }

    // Small trip metadata
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Référence : ${tripData.id}`, marginLeft, 32);
    doc.text(`Demandeur : ${userName}`, marginLeft, 37);
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Destination : ${data.destination}`, marginLeft, 44);
    doc.text(
      `Effectif total : ${effectifTotal} (dont ${data.nbAccompagnateurs} adultes)`,
      marginLeft,
      50
    );

    const tableStartY = 58;
    autoTable(doc, {
      startY: tableStartY,
      head: [["Poste", "Information"]],
      body: [
        ["Projet", data.title || "—"],
        ["Classes concernées", data.classes || "—"],
        ['Destination', data.destination],
        ["Départ", departText],
        ["Lieu de RDV", data.transportRequest?.pickupPoint || "—"],
        ["Retour prévu", returnText],
        [
          "Bus reste sur place",
          data.transportRequest?.stayOnSite ? "OUI" : "NON",
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [226, 232, 240],
      },
      headStyles: {
        fillColor: [24, 170, 226],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 55 } },
    });
    if (data.transportRequest.freeText) {
      // @ts-ignore
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setTextColor(24, 170, 226);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Informations complémentaires :", marginLeft, finalY);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        doc.splitTextToSize(String(data.transportRequest.freeText), 180),
        marginLeft,
        finalY + 7
      );
    }

    // Friendly footer (helps readability in printed emails)
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Document destiné au transporteur. Merci de répondre via le lien sécurisé fourni par email.",
      marginLeft,
      doc.internal.pageSize.getHeight() - 8
    );
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
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
        } else {
          console.error("Erreur S3 response:", fileRes.status, fileRes.statusText);
        }
      } catch (e) {
        console.error("Impossible de récupérer la PJ via URL présignée", e);
      }
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    for (const transporteur of transporteurs) {
      const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/travels/devis/${tripData.id}?p=${encodeURIComponent(transporteur.name)}`;
      await transporter.sendMail({
        from: `"Plateforme Voyages" <${process.env.SMTP_USER}>`,
        to: transporteur.email,
        subject: `🚗 DEMANDE DE DEVIS - ${data.destination.toUpperCase()} - ${userName}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #334155;">
            <h2>Bonjour ${transporteur.name},</h2>
            <p>Veuillez trouver ci-joint une demande de devis pour un transport scolaire à destination de <strong>${data.destination}</strong>.</p>
            <p>Le récapitulatif complet ainsi que le programme éventuel sont joints à cet email.</p>
            
            <div style="margin: 32px 0; padding: 24px; border: 2px dashed #f59e0b; border-radius: 16px; text-align: center; background-color: #fffbeb;">
              <p style="margin-bottom: 16px; font-weight: bold; color: #b45309;">Pour nous transmettre votre devis, merci d'utiliser le lien sécurisé :</p>
              <a href="${uploadLink}" 
                 style="background-color: #f59e0b; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">
                  DÉPOSER MON DEVIS
              </a>
              <p style="margin-top: 12px; font-size: 11px; color: #d97706;">Ce lien vous est personnel et identifie votre société.</p>
            </div>

            <p>Cordialement,<br/>L'administration.</p>
          </div>
        `,
        attachments: attachments,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur API Gmail/Transport:", error);
    return NextResponse.json({ error: "Échec de l'envoi", details: error.message }, { status: 500 });
  }
}