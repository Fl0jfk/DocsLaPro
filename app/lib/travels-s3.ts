import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

function travelsS3Client() {
  return new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

/** Extrait la clé objet depuis une URL S3 (publique, signée ou path-style). */
export function parseTravelsS3KeyFromUrl(fileUrl: string): string | null {
  const raw = String(fileUrl || "").trim();
  if (!raw) return null;

  const bucket = process.env.BUCKET_NAME;
  const region = process.env.REGION;
  if (!bucket) return null;

  try {
    const u = new URL(raw);
    const host = u.hostname;
    const pathKey = decodeURIComponent(u.pathname.replace(/^\//, ""));

    if (host === `${bucket}.s3.${region}.amazonaws.com` || host === `${bucket}.s3.amazonaws.com`) {
      return pathKey || null;
    }
    if (host === `s3.${region}.amazonaws.com` && pathKey.startsWith(`${bucket}/`)) {
      return pathKey.slice(bucket.length + 1) || null;
    }
    const legacy = `${bucket}.s3.${region}.amazonaws.com/`;
    const idx = raw.indexOf(legacy);
    if (idx !== -1) {
      const rest = raw.slice(idx + legacy.length).split("?")[0];
      return decodeURIComponent(rest) || null;
    }
  } catch {
    const legacy = bucket && region ? `${bucket}.s3.${region}.amazonaws.com/` : "";
    if (legacy && raw.includes(legacy)) {
      const rest = raw.split(legacy)[1]?.split("?")[0];
      return rest ? decodeURIComponent(rest) : null;
    }
  }

  return null;
}

/** Télécharge un PDF devis depuis S3 (devis manuels) ou via fetch si URL publique externe. */
export async function fetchTravelsPdfBytes(fileUrl: string): Promise<Buffer> {
  const key = parseTravelsS3KeyFromUrl(fileUrl);
  const bucket = process.env.BUCKET_NAME;

  if (key && bucket) {
    const res = await travelsS3Client().send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes?.length) throw new Error("Fichier PDF vide ou introuvable sur S3.");
    return Buffer.from(bytes);
  }

  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error("Impossible de récupérer le PDF du devis.");
  return Buffer.from(await response.arrayBuffer());
}
