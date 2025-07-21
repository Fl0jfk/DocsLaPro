import { NextRequest, NextResponse } from "next/server";
import { sendMail, Attachment } from "@/app/utils/sendEmail";
import Busboy from "busboy";
import { Readable } from "stream";

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole: ["flojfk+directionecole@gmail.com"],
  college: ["email.direction.college@gmail.com"],
  lycee: ["email.direction.lycee@gmail.com"],
  rh: ["rh@gmail.com"],
  voyages: ["voyages@ecole.com"],
  default: ["secretariat@ecole.com"],
};

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  // — 1. APPEL JSON CLASSIQUE (automatisé)
  if (contentType.includes("application/json")) {
    const body = await request.json();

    // 1️⃣ PRISE EN CHARGE DU CHAMP TO EN PRIORITE
    let to: string | string[];
    if (body.to) {
      to = body.to;
    } else if (body.target) {
      to = RECIPIENTS[body.target] || RECIPIENTS.default;
    } else {
      to = RECIPIENTS.default;
    }

    let attachments: any[] | undefined = undefined;
    if (Array.isArray(body.attachments) && body.attachments.length) {
      attachments = body.attachments.map((att: { filename: string; content: string; contentType: string; }) => ({
        filename: att.filename,
        content: Buffer.from(att.content, "base64"),
        contentType: att.contentType,
      }));
    }

    // ➡️ LOG DANS LES LOGS SERVEUR (DEBUG)
    console.log("Envoi mail à :", to, body.subject);

    await sendMail({
      to,
      subject: body.subject || "[Système] Message reçu",
      text: body.text,
      html: body.html,
      replyTo: body.replyTo,
      attachments,
    });
    return NextResponse.json({ success: true, message: "Email envoyé." });
  }

  // — 2. UPLOAD FORM MULTIPART
  if (contentType.startsWith("multipart/form-data")) {
    const busboy = Busboy({ headers: Object.fromEntries(request.headers.entries()) });
    const fields: Record<string, string> = {};
    const attachments: Attachment[] = [];

    busboy.on("file", (fieldname, file, { filename, mimeType }) => {
      const chunks: Buffer[] = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        attachments.push({
          filename,
          content: Buffer.concat(chunks),
          contentType: mimeType,
        });
      });
    });

    busboy.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    await new Promise<void>((resolve, reject) => {
      busboy.on("finish", resolve);
      busboy.on("error", reject);
      // @ts-expect-error: Readable.fromWeb est OK ici
      const nodeStream = Readable.fromWeb(request.body as unknown as ReadableStream<Uint8Array>);
      nodeStream.pipe(busboy);
    });

    let to: string | string[];
    if (fields.to) {
      try {
        to = JSON.parse(fields.to); // support array ou string
      } catch {
        to = fields.to;
      }
    } else if (fields.target) {
      to = RECIPIENTS[fields.target] || RECIPIENTS.default;
    } else {
      to = RECIPIENTS.default;
    }

    // ➡️ LOG DANS LES LOGS SERVEUR (DEBUG)
    console.log("Envoi mail à :", to, fields.subject);

    await sendMail({
      to,
      subject: fields.subject || "[Système] Nouveau formulaire",
      text: fields.text || "",
      html: fields.html || "",
      attachments,
      replyTo: fields.replyTo,
    });
    return NextResponse.json({ success: true, message: "Email (avec pièce jointe si présente) envoyé." });
  }

  return NextResponse.json({ error: "Type de contenu non supporté." }, { status: 415 });
}
