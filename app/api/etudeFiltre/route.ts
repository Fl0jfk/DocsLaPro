import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { Buffer } from "buffer";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const FILE_KEY = "Etude/BDD Eleves.json";
const streamToString = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

export async function GET() {
    try {
      // Récupérer le fichier depuis S3
      const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY }));
      if (!Body) throw new Error("Fichier vide");
  
      const etudeJson = await streamToString(Body as Readable);
      const allEleves = JSON.parse(etudeJson);
  
      // Filtrer uniquement les élèves ayant plus d'une heure d'étude
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const filteredEleves = allEleves.filter((eleve: any) => eleve["Total Heures"] > 1);
  
      // Transformer en JSON
      const filteredJson = JSON.stringify(filteredEleves, null, 2);
  
      // Retourner la réponse avec les bons headers pour un fichier .json
      return new NextResponse(filteredJson, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": "attachment; filename=eleves_plus_1h.json", // Force téléchargement en tant que fichier .json
        },
      });
    } catch (error) {
      console.error("Erreur lors du filtrage des élèves", error);
      return new NextResponse("Erreur lors du filtrage des élèves", { status: 500 });
    }
  }
  
  
