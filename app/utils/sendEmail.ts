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
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587, // STARTTLS
  secure: false, // false = utilise STARTTLS, true = SSL (465)
  auth: {
    user: process.env.SMTP_USER, // ex: ton.email@gmail.com
    pass: process.env.SMTP_PASS, // ton mot de passe d'application Gmail
  },
});


export async function sendMail( data :GenericMailData): Promise<void> {
  const mailOptions: Mail.Options = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    ...data,
  };
  await transporter.sendMail(mailOptions);
}
