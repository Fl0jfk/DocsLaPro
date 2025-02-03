import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { Buffer } from "buffer";

// Initialisation du client S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const FILE_KEY = "Stocks/inventory.json";

// Fonction pour convertir un Stream en chaîne de caractères
const streamToString = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

// GET : Lire inventory.json depuis S3
export async function GET() {
  try {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY }));
    if (!Body) throw new Error("Fichier vide");

    // Convertir Body en une chaîne de caractères (Buffer)
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
    const newInventory = await req.json();

    // Journaliser l'inventaire pour vérifier les données
    console.log("Nouveau contenu de l'inventaire avant mise à jour:", newInventory);

    // Tentative de mise à jour de S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FILE_KEY,
      Body: JSON.stringify(newInventory, null, 2),
      ContentType: "application/json",
    }));

    console.log("Mise à jour réussie de l'inventaire sur S3");

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




