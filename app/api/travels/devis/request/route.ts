import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/app/utils/voyageStore";
import { currentUser } from "@clerk/nextjs/server";

const TRANSPORTEURS = [
  { id: "t1", nom: "Voyages Martin", email: "flojfk+transport1@gmail.com" },
  { id: "t2", nom: "Autocars Dupont", email: "flojfk+transport2@gmail.com" },
  { id: "t3", nom: "Keolis Nantes", email: "flojfk+transport3@gmail.com" },
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
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const body = await req.json();
    const { voyageId, infos, heureDepart, carSurPlace, commentaire } = body;
    if (!voyageId) return NextResponse.json({ error: "voyageId manquant" }, { status: 400 });
    const list = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "travels/" }));
    let voyageKey: string | null = null;
    for (const obj of list.Contents || []) {
      if (!obj.Key?.endsWith("voyage.json")) continue;
      const data = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key }));
      const bodyStr = await data.Body?.transformToString();
      if (!bodyStr) continue;
      const voyage = JSON.parse(bodyStr);
      if (voyage.id === voyageId) {
        voyageKey = obj.Key;
        break;
      }
    }
    if (!voyageKey) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: voyageKey }));
    const voyage = JSON.parse(await obj.Body?.transformToString() || "{}");
    voyage.prof_form = {
      heureDepart: heureDepart || "",
      carSurPlace: carSurPlace || false,
      commentaire: commentaire || "",
      date: new Date().toISOString(),
    };
    const requests = TRANSPORTEURS.map((t) => {
      const token = crypto.randomBytes(12).toString("hex");
      const fileKey = `${voyageKey.replace("voyage.json", "")}devis/${t.id}/devis.pdf`;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const frontUrl = `${baseUrl}/travels/depot-devis?voyageId=${voyageId}&transporteurId=${t.id}&token=${token}`;
      return { transporteur: t, token, fileKey, frontUrl };
    });
    voyage.devis_requests = requests.map((r) => ({
      id: r.transporteur.id,
      nom: r.transporteur.nom,
      email: r.transporteur.email,
      token: r.token,
      frontUrl: r.frontUrl,
      fileKey: r.fileKey,
      status: "pending",
      infos,
      date: new Date().toISOString(),
    }));
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: voyageKey,
        Body: JSON.stringify(voyage, null, 2),
        ContentType: "application/json",
      })
    );
    for (const r of requests) {
      await transporter.sendMail({
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

➡️ Cliquez sur le lien suivant pour déposer votre devis :
${r.frontUrl}

Merci de votre retour,
Cordialement,
L’équipe`,
      });
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
