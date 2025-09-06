import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { addEntry, AbsenceEntry } from "@/app/utils/jsonStore";
import nodemailer from "nodemailer";

const MAX_FILES = 5;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole: ["florian.hacqueville-mathi@ac-normandie.fr"],
  direction_college: ["florian@h-me.fr"],
  direction_lycee: ["florian.hacqueville-mathi@ac-normandie.fr"]
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const type = data.get("type") as "prof" | "salarie";
    const rawCible = data.get("cible") as string;
    if (!["direction_ecole", "direction_college", "direction_lycee"].includes(rawCible)) {
      return NextResponse.json({ error: "Établissement invalide" }, { status: 400 });
    }
    const cible = rawCible as "direction_ecole" | "direction_college" | "direction_lycee";
    const nom = (data.get("nom") as string) || "";
    const email = (data.get("email") as string) || "";
    const date_debut = data.get("date_debut") as string;
    const date_fin = data.get("date_fin") as string;
    const motif = data.get("motif") as string;
    const commentaire = (data.get("commentaire") as string) || undefined;
    if (!type || !cible || !nom || !email || !date_debut || !date_fin || !motif) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const filesRaw = data.getAll("attachments");
    const files = filesRaw.filter(f =>
      typeof f === "object" &&
      f !== null &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (f as any).name === "string" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (f as any).size === "number" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (f as any).type === "string" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (f as any).arrayBuffer === "function"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any[];

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Pas plus de ${MAX_FILES} fichiers.` }, { status: 400 });
    }

    const attachments = [];
    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json({ error: `Type de fichier non autorisé: ${file.name}` }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      attachments.push({
        filename: file.name,
        buffer: Buffer.from(arrayBuffer).toString("base64"),
        type: file.type || "application/octet-stream"
      });
    }

    const absence: AbsenceEntry = {
      id: uuidv4(),
      type,
      cible,
      nom,
      email,
      date_debut,
      date_fin,
      motif,
      commentaire,
      justificatifs: attachments.length > 0 ? attachments : undefined,
      etat: "en_attente",
      date_declaration: new Date().toISOString()
    };

    await addEntry(absence);

    const lien = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/validationAbsences?id=${absence.id}`;
    const mailTo = RECIPIENTS[cible] || [];
    const mailSubject = `[Absence] Nouvelle demande (${motif})`;
    const mailText = `Nouvelle demande d'absence de ${nom} (${email}) du ${date_debut} au ${date_fin}.\nMotif: ${motif}\nCliquez pour traiter: ${lien}`;


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,        // 465 pour SSL/TLS
  secure: true,     // true pour port 465
  auth: {
    user: process.env.GMAIL_USER,      // ton adresse Gmail (ex: flojfk@gmail.com)
    pass: process.env.GMAIL_APP_PASS,  // mot de passe d'application Gmail
  },
});


    await transporter.sendMail({
      from: process.env.SMTP_MAIL,
      to: mailTo,
      subject: mailSubject,
      text: mailText,
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: Buffer.from(a.buffer, "base64"),
        contentType: a.type,
      }))
    });

    return NextResponse.json({ success: true, message: "Demande enregistrée et mail envoyé à la direction." });

  } catch (err) {
    console.error("Erreur /api/absence/want:", err);
    return NextResponse.json({ error: "Erreur serveur", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}