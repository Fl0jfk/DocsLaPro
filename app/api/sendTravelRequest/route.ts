import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Busboy from "busboy";
import { Readable } from "stream";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return new Promise((resolve) => {
    const headersObject = Object.fromEntries(request.headers.entries());
    const busboy = Busboy({ headers: headersObject });
    let profName2 = "";
    let destination = "";
    let dateAller = "";
    let heureAller = "";
    let dateRetour = "";
    let heureRetour = "";
    let nombreAcc = "";
    let nombreEleves = "";
    let details = "";
    busboy.on("field", (fieldname, value) => {
        console.log(`Received field: ${fieldname} with value: ${value}`);
        if (fieldname === "profName2") profName2 = value;
        if (fieldname === "destination") destination = value;
        if (fieldname === "dateAller") dateAller = value;
        if (fieldname === "heureAller") heureAller = value;
        if (fieldname === "dateRetour") dateRetour = value;
        if (fieldname === "heureRetour") heureRetour = value;
        if (fieldname === "nombreAcc") nombreAcc = value;
        if (fieldname === "nombreEleves") nombreEleves = value;
        if (fieldname === "details") details = value;
      });
      

    busboy.on("finish", async () => {
      if (!profName2 || !destination || !dateAller || !heureAller || !dateRetour || !heureRetour || !nombreAcc || !nombreEleves) {
        return resolve(NextResponse.json({ error: "Veuillez remplir tous les champs." }, { status: 400 }));
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
          subject: `Demande de voyage - ${destination}`,
          text: `Une nouvelle demande de voyage a été soumise:\n\n` +
                `Professeur: ${profName2}\nDestination: ${destination}\nDate Aller: ${dateAller}\n` +
                `Heure de départ: ${heureAller}\nDate de retour: ${dateRetour}\nHeure de retour: ${heureRetour}\n` +
                `Nombre d'élèves: ${nombreEleves}\nNombre d'accompagnateurs: ${nombreAcc}\nDétails: ${details}`,
        };
        await transporter.sendMail(mailOptions);
        return resolve(NextResponse.json({ message: "Email envoyé avec succès !" }));
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return resolve(NextResponse.json({ error: "Erreur lors de l'envoi de l'email." }, { status: 500 }));
      }
    });
    const stream = Readable.from(request.body as any);
    stream.pipe(busboy);
  });
}


