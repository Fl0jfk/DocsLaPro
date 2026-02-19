import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) {
  try {
    const { providerEmail, signedQuoteUrl, providerName, tripTitle } = await req.json();
    if (!providerEmail) { return NextResponse.json({ error: "Email du transporteur manquant" }, { status: 400 })}
    const urlObj = new URL(signedQuoteUrl);
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
    const pdfResponse = await fetch(presignedUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Impossible d'accéder au PDF sur S3 : ${pdfResponse.statusText}`);
    }
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS,
      },
    });
    const mailOptions = {
      from: `"Gestion Voyages" <${process.env.SMTP_USER}>`,
      to: providerEmail,
      subject: `Confirmation de commande : ${tripTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <p>Bonjour <strong>${providerName}</strong>,</p>
          <p>Nous avons le plaisir de vous confirmer la sélection de votre offre pour le projet : <strong>${tripTitle}</strong>.</p>
          <p>Veuillez trouver en pièce jointe le <strong>devis signé</strong> valant bon de commande.</p>
          <br />
          <p>Cordialement,</p>
          <p><em>L'administration de l'établissement</em></p>
        </div>
      `,
      attachments: [
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