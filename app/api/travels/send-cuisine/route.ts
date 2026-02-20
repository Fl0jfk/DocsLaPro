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
    if (!details || !details.active) {
      return NextResponse.json({ error: "Aucune commande cuisine à envoyer" }, { status: 400 });
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("BON DE COMMANDE CUISINE", 105, 20, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Organisateur : ${userName}`, 20, 40);
    doc.text(`Projet : ${tripData.data.title}`, 20, 47);
    doc.text(`Dates : du ${tripData.data.startDate} au ${tripData.data.endDate}`, 20, 54);
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
      to: "chef.0056isi@newrest.eu",
      cc: userEmail,
      subject: `Commande Cuisine - ${userName} - ${tripData.data.title}`,
      text: `Bonjour Chef,\n\nVeuillez trouver ci-joint le bon de commande de restauration pour le projet "${tripData.data.title}" prévu du ${tripData.data.startDate} au ${tripData.data.endDate}.\n\nCordialement,\n${userName}`,
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