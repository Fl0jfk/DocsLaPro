import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getTenantAwsRegion, getTenantBucketName } from "@/app/lib/tenant-config";
import { s3Key } from "@/app/lib/s3-path";

export function encodeS3KeyForUrl(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function publicS3UrlForKey(key: string): Promise<string> {
  const bucket = await getTenantBucketName();
  const region = await getTenantAwsRegion();
  if (!bucket || !region) throw new Error("Bucket tenant ou région AWS manquant");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeS3KeyForUrl(key)}`;
}

/** Extrait la clé objet depuis une URL S3 (publique, signée ou path-style). */
export async function parseTravelsS3KeyFromUrl(fileUrl: string): Promise<string | null> {
  const raw = String(fileUrl || "").trim();
  if (!raw) return null;

  const bucket = await getTenantBucketName();
  const region = await getTenantAwsRegion();
  if (!bucket) return null;

  const decodePath = (path: string) => {
    try {
      return decodeURIComponent(path.replace(/^\//, ""));
    } catch {
      return path.replace(/^\//, "");
    }
  };

  try {
    const u = new URL(raw);
    const host = u.hostname;
    const pathKey = decodePath(u.pathname);

    if (host === `${bucket}.s3.${region}.amazonaws.com` || host === `${bucket}.s3.amazonaws.com`) {
      return pathKey || null;
    }
    if (host === `s3.${region}.amazonaws.com` && pathKey.startsWith(`${bucket}/`)) {
      return pathKey.slice(bucket.length + 1) || null;
    }
    if (host === "s3.amazonaws.com" && pathKey.startsWith(`${bucket}/`)) {
      return pathKey.slice(bucket.length + 1) || null;
    }
  } catch {
    /* pas une URL absolue */
  }

  const markers = [
    `${bucket}.s3.${region}.amazonaws.com/`,
    `${bucket}.s3.amazonaws.com/`,
    `s3.${region}.amazonaws.com/${bucket}/`,
    `s3.amazonaws.com/${bucket}/`,
  ];
  for (const marker of markers) {
    const idx = raw.indexOf(marker);
    if (idx !== -1) {
      const rest = raw.slice(idx + marker.length).split("?")[0].split("#")[0];
      const key = decodePath(rest);
      if (key) return key;
    }
  }

  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    return s3Key(raw.split("?")[0].split("#")[0]);
  }

  return null;
}

export async function candidateTravelsS3Keys(
  fileUrl: string,
  explicitKey?: string | null,
): Promise<string[]> {
  const out: string[] = [];
  const add = (k: string | null | undefined) => {
    const n = s3Key(String(k || "").split("?")[0].split("#")[0]);
    if (n && !out.includes(n)) out.push(n);
  };

  if (explicitKey) add(explicitKey);

  const parsed = await parseTravelsS3KeyFromUrl(fileUrl);
  if (parsed) add(parsed);

  const raw = String(fileUrl || "").trim();
  if (raw && !raw.startsWith("http://") && !raw.startsWith("https://")) {
    add(raw);
  }

  for (const k of [...out]) {
    if (k.startsWith("tenants/")) {
      const parts = k.split("/");
      if (parts.length >= 3) add(parts.slice(2).join("/"));
    }
  }

  return out;
}

async function s3ObjectExists(bucket: string, key: string): Promise<boolean> {
  const client = await getTenantDataS3Client();
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    try {
      const res = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-0" }),
      );
      await res.Body?.transformToByteArray();
      return true;
    } catch {
      return false;
    }
  }
}

export async function resolveTravelsS3ObjectKey(
  fileUrl: string,
  explicitKey?: string | null,
): Promise<string | null> {
  const bucket = await getTenantBucketName();
  if (!bucket) return null;

  for (const key of await candidateTravelsS3Keys(fileUrl, explicitKey)) {
    if (await s3ObjectExists(bucket, key)) return key;
  }
  return null;
}

export async function fetchTravelsPdfBytes(
  fileUrl: string,
  explicitKey?: string | null,
): Promise<Buffer> {
  const key = await resolveTravelsS3ObjectKey(fileUrl, explicitKey);
  const bucket = await getTenantBucketName();

  if (key && bucket) {
    const client = await getTenantDataS3Client();
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes?.length) throw new Error("Fichier PDF vide ou introuvable sur S3.");
    return Buffer.from(bytes);
  }

  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error("Impossible de récupérer le PDF du devis.");
  return Buffer.from(await response.arrayBuffer());
}
