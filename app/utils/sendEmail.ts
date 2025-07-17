import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export type Attachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

// Définition du type
export type GenericMailData = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  replyTo?: string;
};

// Initialisation du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Fonction d'envoi (LE NOM DU PARAMÈTRE DOIT ÊTRE "data" ou ce que tu veux, pas GenericMailData !)
export async function sendMail( data :GenericMailData): Promise<void> {
  const mailOptions: Mail.Options = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    ...data,
  };
  await transporter.sendMail(mailOptions);
}
