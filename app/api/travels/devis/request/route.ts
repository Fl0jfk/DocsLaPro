import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { s3, BUCKET } from "@/app/utils/voyageStore";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const TRANSPORTEURS = [
  { id: "t1", nom: "Voyages Martin", email: "contact@voyagesmartin.fr" },
  { id: "t2", nom: "Autocars Dupont", email: "dupont.autocars@gmail.com" },
  { id: "t3", nom: "Keolis Nantes", email: "devis@keolis-nantes.fr" },
];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { voyageId, infos, heureDepart, carSurPlace, commentaire } = body;
    if (!voyageId) {
      return NextResponse.json({ error: "voyageId manquant" }, { status: 400 });
    }
    const key = `travels/${voyageId.split("-")[0]}/${voyageId}/voyage.json`;
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const voyage = JSON.parse(await obj.Body?.transformToString() || "{}");
    voyage.prof_form = {
      heureDepart: heureDepart || "",
      carSurPlace: carSurPlace || false,
      commentaire: commentaire || "",
      date: new Date().toISOString(),
    };
    const requests = await Promise.all(
      TRANSPORTEURS.map(async (t) => {
        const token = crypto.randomBytes(12).toString("hex");
        const fileKey = `travels/${voyageId}/devis/${t.id}/devis.pdf`;
        const presignUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
        return { transporteur: t, token, presignUrl, fileKey };
      })
    );
    voyage.devis_requests = requests.map((r) => ({
      id: r.transporteur.id,
      nom: r.transporteur.nom,
      email: r.transporteur.email,
      token: r.token,
      presignUrl: r.presignUrl,
      fileKey: r.fileKey,
      status: "pending",
      infos,
      date: new Date().toISOString(),
    }));
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(voyage, null, 2),
        ContentType: "application/json",
      })
    );
    for (const r of requests) {
      const mailOptions = {
        from: `"École" <${process.env.SMTP_USER}>`,
        to: r.transporteur.email,
        subject: `[Demande de devis bus] Voyage scolaire "${voyage.lieu}"`,
        text: `Bonjour ${r.transporteur.nom},

L’établissement vous invite à déposer un devis pour le voyage "${voyage.lieu}" (${voyage.date_depart} → ${voyage.date_retour}).

Détails du voyage :
- Heure de départ : ${voyage.prof_form.heureDepart || "non précisée"}
- Car sur place : ${voyage.prof_form.carSurPlace ? "Oui" : "Non"}
- Commentaire prof : ${voyage.prof_form.commentaire || "(aucune précision)"}

Détails supplémentaires :
${infos || "(aucune précision fournie)"}

➡️ Cliquez sur le lien suivant pour déposer votre devis PDF :
${r.presignUrl}

Merci de votre retour,
Cordialement,
L’équipe`,
      };
      await transporter.sendMail(mailOptions);
    }
    return NextResponse.json({
      success: true,
      message: "Mini-formulaire ajouté et demandes de devis envoyées aux transporteurs.",
      requests,
    });
  } catch (err: any) {
    console.error("Erreur demande devis :", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}