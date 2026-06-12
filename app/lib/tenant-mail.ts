import "server-only";
import nodemailer from "nodemailer";
import { getTenant } from "@/app/lib/tenant-context";

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

export type TenantSmtpConfig = {
  user: string;
  pass: string;
  host?: string;
};

/** SMTP : secrets tenant → repli SMTP_USER / SMTP_PASS Amplify. */
export async function getTenantSmtpConfig(): Promise<TenantSmtpConfig | null> {
  try {
    const tenant = await getTenant();
    const smtp = tenant.secrets?.smtp;
    if (smtp?.user?.trim() && smtp?.pass?.trim()) {
      return {
        user: smtp.user.trim(),
        pass: smtp.pass.trim(),
        host: smtp.host?.trim() || undefined,
      };
    }
  } catch {
    /* pas de contexte tenant */
  }
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;
  return { user, pass };
}

export function isTenantSmtpConfigured(): Promise<boolean> {
  return getTenantSmtpConfig().then(Boolean);
}

export async function createTenantTransporter(): Promise<MailTransporter | null> {
  const smtp = await getTenantSmtpConfig();
  if (!smtp) return null;
  if (smtp.host) {
    return nodemailer.createTransport({
      host: smtp.host,
      auth: { user: smtp.user, pass: smtp.pass },
    });
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

/** Adresse expéditeur (compte SMTP du tenant). */
export async function getTenantSmtpFromAddress(): Promise<string | null> {
  const smtp = await getTenantSmtpConfig();
  return smtp?.user ?? null;
}
