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
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY }));

    if (!Body) throw new Error("Fichier vide");

    const etudeJson = await streamToString(Body as Readable);
    
    return new NextResponse(etudeJson, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture de l'étude", error);
    return new NextResponse("Erreur de lecture de l'étude", { status: 500 });
  }
}
export async function PUT(req: Request) {
  try {
    const { etude, userName, password, modificationsInProgress } = await req.json();
    console.log(modificationsInProgress)
    if (password !== "test") {
      return new NextResponse("Mot de passe incorrect", { status: 403 });
    }
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY }));
    if (!Body) throw new Error("Fichier vide");
    const oldData = await streamToString(Body as Readable);
    const allEleves = JSON.parse(oldData);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const updatedData = allEleves.map((eleve: any) => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const presentEleve = etude.find((p: any) => p.id === eleve.id);
      if (presentEleve) {
        return {
          ...eleve,
          "Total Heures": eleve["Total Heures"] + 1,
          "Heures d'études": [
            ...eleve["Heures d'études"],
            {
              "Date": new Date().toLocaleDateString("fr-FR"),
              "Heure début": new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              "Personnel": userName,
            },
          ],
        };
      }
      return eleve;
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: FILE_KEY,
        Body: JSON.stringify(updatedData, null, 2),
        ContentType: "application/json",
      })
    );

    console.log("Mise à jour réussie de l'étude sur S3");
    await sendUpdateEmail(userName, etude);

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Erreur lors de la mise à jour de l'étude:", error.message);
      return new NextResponse(`Erreur de mise à jour de l'étude: ${error.message}`, { status: 500 });
    } else {
      console.error("Erreur inconnue", error);
      return new NextResponse("Erreur inconnue", { status: 500 });
    }
  }
}

const sendUpdateEmail = async (userName: string, presentEleves: Record<string, unknown>[]) => { 
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
    subject: `Nouvelle étude saisie`,
    text: `L'utilisateur ${userName} a saisi une nouvelle heure d'étude à ${new Date().toLocaleString()}.\n\nListe des élèves présents:\n\n${JSON.stringify(presentEleves, null, 2)}`,
  };

  await transporter.sendMail(mailOptions);
};






