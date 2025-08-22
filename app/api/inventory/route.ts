import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { Buffer } from "buffer";
import nodemailer from "nodemailer";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const FILE_KEY = "Stocks/inventory.json";
const streamToString = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};
export async function GET() {
  try {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY }));
    if (!Body) throw new Error("Fichier vide");
    const inventoryJson = await streamToString(Body as Readable);
    return new NextResponse(inventoryJson, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture de l'inventaire", error);
    return new NextResponse("Erreur de lecture de l'inventaire", { status: 500 });
  }
}
export async function PUT(req: Request) {
  try {
    const { inventory, userName, password, modificationsInProgress } = await req.json();
    if (password !== "LaProNB76240") {
      return new NextResponse("Mot de passe incorrect", { status: 403 });
    }
    console.log("Données reçues:", { inventory, userName, password, modificationsInProgress });
    console.log("Nouveau contenu de l'inventaire avant mise à jour:", inventory);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FILE_KEY,
      Body: JSON.stringify(inventory, null, 2),
      ContentType: "application/json",
    }));
    console.log("Mise à jour réussie de l'inventaire sur S3");
    await sendUpdateEmail(userName, modificationsInProgress);
    return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Erreur lors de la mise à jour de l'inventaire:", error.message);
      return new NextResponse(`Erreur de mise à jour de l'inventaire: ${error.message}`, { status: 500 });
    } else {
      console.error("Erreur inconnue", error);
      return new NextResponse("Erreur inconnue", { status: 500 });
    }
  }
}
const sendUpdateEmail = async (userName: string,modificationsInProgress: Record<string, unknown>[]) => { 
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.MY_EMAIL, 
    to: "florian.hacqueville-mathi@ac-normandie.fr",
    subject: `Mise à jour de l'inventaire`,
    text: `L'utilisateur ${userName} a mis à jour l'inventaire à ${new Date().toLocaleString()}.\n\nModifications en cours:\n\n${JSON.stringify(modificationsInProgress, null, 2)}`,
  };
  await transporter.sendMail(mailOptions);
};





