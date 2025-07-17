/*import { NextRequest, NextResponse } from "next/server";
import { sendMail, Attachment } from "@/app/utils/sendEmail";
import Busboy from "busboy";
import { Readable } from "stream";

const RECIPIENTS: Record<string, string[]> = {
  ecole: ["email.direction.ecole@tondomaine.com"],
  college: ["email.direction.college@tondomaine.com"],
  lycee: ["email.direction.lycee@tondomaine.com"],
  direction:   ["direction@ecole.com"],
  admin:       ["admin@ecole.com"],
  rh:          ["rh@ecole.com"],
  voyages:     ["voyages@ecole.com"],
  default:     ["secretariat@ecole.com"],
};

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  // 1. JSON classique (pas de fichier)
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const to = RECIPIENTS[body.target] || RECIPIENTS.default;
    await sendMail({
      to,
      subject: body.subject || "[Système] Message reçu",
      text: body.text,
      html: body.html,
      replyTo: body.replyTo,
    });
    return NextResponse.json({ success: true, message: "Email envoyé." });
  }

  // 2. Multipart (fichier joint)
  if (contentType.startsWith("multipart/form-data")) {
    return new Promise((resolve) => {
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
      busboy.on("finish", async () => {
        const to = RECIPIENTS[fields.target] || RECIPIENTS.default;
        await sendMail({
          to,
          subject: fields.subject || "[Système] Nouveau formulaire",
          text: fields.text || "",
          html: fields.html || "",
          attachments,
          replyTo: fields.replyTo,
        });
        resolve(NextResponse.json({ success: true, message: "Email (avec pièce jointe si présente) envoyé." }));
      });
      // @ts-ignore
      const nodeStream = Readable.fromWeb(request.body as unknown as ReadableStream<Uint8Array>);
      nodeStream.pipe(busboy);
    });
  }

  return NextResponse.json({ error: "Type de contenu non supporté." }, { status: 415 });
}
*/
