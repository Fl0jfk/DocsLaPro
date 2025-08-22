import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export type Attachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type GenericMailData = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  replyTo?: string;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail( data :GenericMailData): Promise<void> {
  const mailOptions: Mail.Options = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    ...data,
  };
  await transporter.sendMail(mailOptions);
}
