import "server-only";
import { getTenant } from "@/app/lib/tenant-context";
import { getBucketName } from "@/app/lib/s3-storage";

/** Bucket métier du tenant courant (ou BUCKET_NAME en mono-tenant). */
export async function getTenantBucketName(): Promise<string> {
  return getBucketName();
}

/** Clé Mistral : secrets tenant → repli MISTRAL_API_KEY Amplify. */
export async function getMistralApiKey(): Promise<string | undefined> {
  try {
    const tenant = await getTenant();
    const fromSecrets = tenant.secrets?.mistral?.apiKey?.trim();
    if (fromSecrets) return fromSecrets;
  } catch {
    /* pas de contexte tenant (script, webhook sans host) */
  }
  return process.env.MISTRAL_API_KEY?.trim() || undefined;
}

export async function requireMistralApiKey(): Promise<string> {
  const key = await getMistralApiKey();
  if (!key) throw new Error("Service IA non configuré (MISTRAL_API_KEY ou secrets tenant).");
  return key;
}
