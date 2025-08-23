import { NextRequest, NextResponse } from "next/server";
import { sendMail, Attachment } from "@/app/utils/sendEmail";

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole: ["florian.hacqueville-mathi@ac-normandie.fr"],
  direction_college: ["florian.hacqueville-mathi@ac-normandie.fr"],
  direction_lycee: ["florian.hacqueville-mathi@ac-normandie.fr"],
  rh: ["florian.hacqueville-mathi@ac-normandie.fr"],
  default: ["secretariat@ecole.com"],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const target = body.target as string;
    const to = target ? RECIPIENTS[target] || RECIPIENTS.default : RECIPIENTS.default;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attachments: Attachment[] | undefined = body.attachments?.map((att: any) => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
      contentType: att.contentType,
    }));

    console.log("📨 Envoi mail à:", to);
    console.log("📄 Sujet:", body.subject);
    console.log("✉️ Texte:", body.text);
    if (attachments) console.log("📎 Pièces jointes:", attachments.map(a => a.filename));

    await sendMail({
      to,
      subject: body.subject || "[Système] Message reçu",
      text: body.text,
      html: body.html,
      replyTo: body.replyTo,
      attachments,
    });

    console.log("✅ Mail envoyé via /api/email");
    return NextResponse.json({ success: true, message: "Mail envoyé." });
  } catch (err) {
    console.error("❌ Erreur /api/email:", err);
    return NextResponse.json({ error: "Erreur serveur email." }, { status: 500 });
  }
}
