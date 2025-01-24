import { type NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export async function POST(request: NextRequest) {
  const { email, name, message, director } = await request.json();

  const emailMap: { lycee: string; college: string; ecole: string } = {
    lycee: 'sara.buno@ac-normandie.fr',
    college: 'florian.hacqueville-mathi@ac-normandie.fr',
    ecole: 'pauline.leblond@ac-normandie.fr',
  };
  
  const recipientEmail = emailMap[director as keyof typeof emailMap];
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const mailOptions: Mail.Options = {
    from: process.env.MY_EMAIL,
    to: recipientEmail,
    subject: `Tu as reçu un mail de ${name}, son email est : ${email} depuis L'intranet La Providence.`,
    text: `Son message est : ${message}`,
  };

  const sendMailPromise = () =>
    new Promise<string>((resolve, reject) => {
      transport.sendMail(mailOptions, function (err) {
        if (!err) {
          resolve('Email envoyé, nous répondrons rapidement !');
        } else {
          reject(`Nous n'avons pas réussi à envoyer votre message. :( Erreur = ${err.message}`);
        }
      });
    });

  try {
    await sendMailPromise();
    return NextResponse.json({ message: 'Email envoyé' });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}