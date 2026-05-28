import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { parseTravelsS3KeyFromUrl } from "@/app/lib/travels-s3";

const ZEENDOC_TO = "comptabilite@laprovidence-nicolasbarre.fr";

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: "SMTP non configuré." }, { status: 500 });
  }

  let body: { fileUrl?: string; fileName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const fileUrl = String(body.fileUrl || "").trim();
  const fileName = String(body.fileName || "document").trim();
  if (!fileUrl) {
    return NextResponse.json({ error: "fileUrl requis." }, { status: 400 });
  }

  try {
    let fileBuffer: Buffer;
    let contentType = "application/octet-stream";

    const key = parseTravelsS3KeyFromUrl(fileUrl);
    if (key && process.env.BUCKET_NAME) {
      const res = await s3Client.send(
        new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key }),
      );
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes?.length) throw new Error("Fichier introuvable sur S3.");
      fileBuffer = Buffer.from(bytes);
      if (res.ContentType) contentType = res.ContentType;
    } else {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Impossible de récupérer le fichier.");
      fileBuffer = Buffer.from(await response.arrayBuffer());
      const ct = response.headers.get("content-type");
      if (ct) contentType = ct;
    }
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Pièce jointe vide : envoi annulé.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Travels" <${process.env.SMTP_USER}>`,
      to: ZEENDOC_TO,
      subject: `Travels - document joint (${fileName})`,
      text: [
        "Envoi automatique Travels.",
        `Document joint: ${fileName}`,
        `Type: ${contentType}`,
        `Taille: ${fileBuffer.length} octets`,
      ].join("\n"),
      attachments: [
        {
          filename: fileName || "document",
          content: fileBuffer,
          contentType,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur d'envoi." }, { status: 500 });
  }
}
