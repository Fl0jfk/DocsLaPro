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
    const transporteurs = [
      { name: "Perier", email: "flojfk@gmail.com" },
      { name: "Reflexe", email: "florian.hacqueville-mathi@ac-normandie.fr" },
      { name: "Cars Bleus", email: "florian@h-me.fr" }
    ];
    const doc = new jsPDF();
    const effectifTotal = Number(data.nbEleves) + Number(data.nbAccompagnateurs);
    doc.setFontSize(18);
    doc.text("DEMANDE DE TRANSPORT", 14, 20);
    doc.setFontSize(10);
    doc.text(`Référence : ${tripData.id}`, 14, 28);
    doc.text(`Demandeur : ${userName}`, 14, 33);
    autoTable(doc, {
      startY: 40,
      head: [['Poste', 'Information']],
      body: [
        ['Destination', data.destination],
        ['Nombre total de passagers', `${effectifTotal} (dont ${data.nbAccompagnateurs} adultes)`],
        ['Départ', `${data.startDate} à ${data.startTime}`],
        ['Lieu de RDV', data.transportRequest.pickupPoint],
        ['Retour prévu', `${data.endDate} à ${data.endTime}`],
        ['Bus reste sur place', data.transportRequest.stayOnSite ? 'OUI' : 'NON'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] } 
    });
    if (data.transportRequest.freeText) {
      // @ts-ignore
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Informations complémentaires :", 14, finalY);
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(data.transportRequest.freeText, 180), 14, finalY + 7);
    }
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