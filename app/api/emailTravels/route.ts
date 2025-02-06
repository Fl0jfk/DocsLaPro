import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Busboy from "busboy";
import { Readable } from "stream";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return new Promise((resolve) => {
    const headersObject = Object.fromEntries(request.headers.entries());
    const busboy = Busboy({ headers: headersObject });
    const fileBuffers: { filename: string; buffer: Buffer }[] = [];
    let travelId = "";
    let travelName = "";
    let name = "";
    let email = "";

    busboy.on("file", (fieldname, file, fileInfo) => {
      const { filename } = fileInfo;
      const chunks: Buffer[] = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        fileBuffers.push({ filename, buffer: Buffer.concat(chunks) });
      });
    });

    busboy.on("field", (fieldname, value) => {
      if (fieldname === "travelId") travelId = value;
      if (fieldname === "travelName") travelName = value;
      if (fieldname === "name") name = value;
      if (fieldname === "email") email = value;
    });

    busboy.on("finish", async () => {
      if (!fileBuffers.length) {
        return resolve(NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 }));
      }

      try {
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
          subject: `Nouvelle pièce jointe pour le voyage ${travelName}`,
          text: `Un professeur a ajouté une pièce jointe pour le voyage "${travelName}" (ID: ${travelId}).\nNom: ${name}\nEmail: ${email}`,
          attachments: fileBuffers.map((file) => ({
            filename: file.filename,
            content: file.buffer,
          })),
        };

        await transporter.sendMail(mailOptions);
        return resolve(NextResponse.json({ message: "Email envoyé avec succès !" }));
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return resolve(NextResponse.json({ error: "Erreur lors de l'envoi de l'email." }, { status: 500 }));
      }
    });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const stream = Readable.from(request.body as any);
    stream.pipe(busboy);
  });
}



