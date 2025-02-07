import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_PASSWORD, 
  },
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { profName2, destination, dateAller, heureAller, dateRetour, heureRetour, nombreAcc, nombreEleves, details,} = data;
    if ( !profName2 || !destination || !dateAller || !heureAller || !dateRetour || !heureRetour || !nombreAcc || !nombreEleves) {
      return NextResponse.json(
        { message: "Tous les champs sont obligatoires." },
        { status: 400 }
      );
    }
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'florian.hacqueville-mathi@ac-normandie.fr',
      subject: 'Demande de voyage scolaire',
      text: `
        Nouveau formulaire de demande de voyage :

        Professeur : ${profName2}
        Destination : ${destination}
        Date d'aller : ${dateAller} à ${heureAller}
        Date de retour : ${dateRetour} à ${heureRetour}
        Nombre d'accompagnateurs : ${nombreAcc}
        Nombre d'élèves : ${nombreEleves}
        Détails supplémentaires : ${details}
      `,
      html: `
        <h2>Nouvelle demande de voyage scolaire</h2>
        <p><strong>Professeur :</strong> ${profName2}</p>
        <p><strong>Destination :</strong> ${destination}</p>
        <p><strong>Date d'aller :</strong> ${dateAller} à ${heureAller}</p>
        <p><strong>Date de retour :</strong> ${dateRetour} à ${heureRetour}</p>
        <p><strong>Nombre d'accompagnateurs :</strong> ${nombreAcc}</p>
        <p><strong>Nombre d'élèves :</strong> ${nombreEleves}</p>
        <p><strong>Détails supplémentaires :</strong> ${details}</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json(
      { message: "La demande de voyage a été envoyée par email avec succès." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    return NextResponse.json(
      { message: "Erreur lors de l'envoi de la demande." },
      { status: 500 }
    );
  }
}

