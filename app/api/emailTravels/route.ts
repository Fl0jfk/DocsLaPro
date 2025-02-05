import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export async function POST(request: NextRequest) {
  const formData = await request.formData(); // Récupère les données envoyées dans le formData

  const file = formData.get('file');
  const travelId = formData.get('travelId');
  const travelName = formData.get('travelName');
  const name = formData.get('name');
  const email = formData.get('email');

  // Vérifie que le fichier existe et est bien un fichier
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier valide n\'a été envoyé.' }, { status: 400 });
  }

  // Convertir le fichier en Buffer
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Prépare les données pour l'email
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const mailOptions: Mail.Options = {
    from: process.env.MY_EMAIL,
    to: "florian.hacqueville-mathi@ac-normandie.fr", // Ton email
    subject: `Nouvelle pièce jointe pour le voyage ${travelName}`,
    text: `
      Un professeur a ajouté une pièce jointe pour le voyage "${travelName}" (ID: ${travelId}).
      Nom du professeur: ${name}
      Email du professeur: ${email}
    `,
    attachments: [
      {
        filename: file.name,   // Nom du fichier
        content: fileBuffer,    // Utilisation du Buffer pour le contenu du fichier
      },
    ],
  };

  // Envoi du mail
  try {
    await transport.sendMail(mailOptions);
    return NextResponse.json({ message: 'Email envoyé' });
  } catch (err) {
    console.error("Erreur lors de l'envoi du mail:", err);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email.' }, { status: 500 });
  }
}


