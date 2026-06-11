import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";
import { fetchTravelsPdfBytes } from "@/app/lib/travels-s3";

const ZEENDOC_TO = "comptabilite@laprovidence-nicolasbarre.fr";

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
    const fileBuffer = await fetchTravelsPdfBytes(fileUrl);
    let contentType = "application/pdf";
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
