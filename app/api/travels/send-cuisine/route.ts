import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  try {
    const { tripData, userEmail, userName } = await req.json();
    const details = tripData.data.piqueNiqueDetails;
    if (!details || !details.active) { return NextResponse.json({ error: "Aucune commande cuisine à envoyer" }, { status: 400 })}

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

    const startDateFR = formatDateFR(tripData.data.startDate);
    const endDateFR = formatDateFR(tripData.data.endDate);

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("BON DE COMMANDE CUISINE", 105, 20, { align: "center" });

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
          const targetW = 30;
          const targetH = (imgProps.height * targetW) / imgProps.width;
          const x = 160;
          const y = 10;
          doc.addImage(dataUri, "PNG", x, y, targetW, targetH);
          try {
            doc.link(x, y, targetW, targetH, { url: appUrl });
          } catch {
            // ignore if link unsupported
          }
        }
      }
    } catch (e) {
      console.error("Erreur ajout logo cuisine:", e);
    }

    doc.setFontSize(11);
    doc.text(`Organisateur : ${userName}`, 20, 40);
    doc.text(`Projet : ${tripData.data.title}`, 20, 47);
    doc.text(`Dates : du ${startDateFR} au ${endDateFR}`, 20, 54);
    doc.text(`Lieu de livraison : ${details.deliveryPlace} à ${details.deliveryTime}`, 20, 61);
    const joursSelectionnes = Object.entries(details.daysSelection)
      .filter(([_, val]) => val)
      .map(([jour, _]) => jour.charAt(0).toUpperCase() + jour.slice(1))
      .join(", ");
    const tableRows = [
      ["Désignation", "Quantités / Détails"],
      ["Jours de sortie", joursSelectionnes],
      ["Pique-niques (Total)", details.picnicTotal || "0"],
      ["- dont Sans Porc", details.picnicNoPork || "0"],
      ["- dont Végétarien", details.picnicVeg || "0"],
      ["Repas au Self (Adultes)", details.selfAdults || "0"],
      ["Repas au Self (Élèves)", details.selfStudents || "0"],
      ["Pauses", [
        details.breakCoffee ? "Café/Thé" : null,
        details.breakJuice ? "Jus de fruits" : null,
        details.breakCakes ? "Gâteaux" : null,
        details.breakViennoiseries ? "Viennoiseries" : null,
      ].filter(Boolean).join(", ") || "Aucune"],
      ["Autres demandes", details.breakOther || "Néant"]
    ];
    autoTable(doc, {
      startY: 75,
      head: [tableRows[0]],
      body: tableRows.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Gestion Sorties" <${process.env.EMAIL_USER}>`,
      to: "flojfk@gmail.com",
      cc: userEmail,
      subject: `Commande Cuisine - ${userName} - ${tripData.data.title}`,
      text: `Bonjour Chef,\n\nVeuillez trouver ci-joint le bon de commande de restauration pour le projet "${tripData.data.title}" prévu du ${startDateFR} au ${endDateFR}.\n\nCordialement,\n${userName}`,
      attachments: [
        {
          filename: `Commande_Cuisine_${tripData.id}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
        },
      ],
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi mail cuisine:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi du mail" }, { status: 500 });
  }
}