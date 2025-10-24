import { NextRequest, NextResponse } from "next/server";
import { s3, BUCKET } from "@/app/utils/voyageStore";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const voyageId = form.get("voyageId") as string | null;
    const transporteurId = form.get("transporteurId") as string | null;
    const token = form.get("token") as string | null;
    const devisFile = form.get("devis") as File | null;
    if (!voyageId || !transporteurId || !token)
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    if (!devisFile)
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    const key = `travels/${voyageId.split("-")[0]}/${voyageId}/voyage.json`;
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const voyage = JSON.parse(await obj.Body?.transformToString() || "{}");
    const demande = voyage.devis_requests?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.id === transporteurId && r.token === token
    );
    if (!demande)
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 403 });
    const fileKey = `travels/${voyageId.split("-")[0]}/${voyageId}/devis/${transporteurId}-${Date.now()}-${devisFile.name}`;
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      ContentType: devisFile.type,
    });
    const presignUrl = await getSignedUrl(s3, putCommand, { expiresIn: 3600 });
    const arrayBuffer = await devisFile.arrayBuffer();
    await fetch(presignUrl, {
      method: "PUT",
      body: arrayBuffer,
      headers: { "Content-Type": devisFile.type },
    });
    const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
    const newDevis = {
      id: randomUUID(),
      transporteurId,
      transporteurNom: demande.nom,
      url: fileUrl,
      filename: devisFile.name,
      date: new Date().toISOString(),
    };
    voyage.devis = [...(voyage.devis || []), newDevis];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    voyage.devis_requests = voyage.devis_requests.map((r: any) =>
      r.id === transporteurId ? { ...r, status: "done", fileUrl } : r
    );
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(voyage, null, 2),
        ContentType: "application/json",
      })
    );
    await transporter.sendMail({
      from: `"École" <${process.env.SMTP_USER}>`,
      to: voyage.email,
      subject: `[Voyage scolaire] Devis reçu - ${demande.nom}`,
      text: `Le transporteur ${demande.nom} a déposé un devis pour le voyage "${voyage.lieu}".\n\nConsultez le fichier ici : ${fileUrl}`,
    });
    return NextResponse.json({
      success: true,
      message: "Devis déposé avec succès et notification envoyée !",
      fileUrl,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Erreur upload devis :", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne lors du dépôt du devis." },
      { status: 500 }
    );
  }
}

