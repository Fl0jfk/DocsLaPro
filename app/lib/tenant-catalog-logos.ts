import "server-only";

import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Key } from "@/app/lib/s3-path";
import { getPlatformS3Client } from "@/app/lib/s3-clients";
import type { TenantConfig } from "@/app/lib/tenant-types";

function decodeS3Path(path: string): string {
  try {
    return decodeURIComponent(path.replace(/^\//, ""));
  } catch {
    return path.replace(/^\//, "");
  }
}

/** Extrait une clé S3 depuis une URL publique ou signée du bucket donné. */
function parseS3KeyFromUrlForBucket(fileUrl: string, bucket: string): string | null {
  const raw = String(fileUrl || "").trim();
  if (!raw) return null;
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return null;

  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const bucketLower = bucket.toLowerCase();

    if (host === `${bucketLower}.s3.amazonaws.com` || host.startsWith(`${bucketLower}.s3.`)) {
      return decodeS3Path(u.pathname);
    }

    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0]?.toLowerCase() === bucketLower) {
      return decodeS3Path(parts.slice(1).join("/"));
    }
  } catch {
    /* ignore */
  }

  return null;
}

async function getSignedReadUrlForBucket(
  bucket: string,
  relativeOrFullKey: string,
  expiresIn = 3600,
): Promise<string | null> {
  const client = getPlatformS3Client();
  const key = s3Key(relativeOrFullKey);
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
  } catch {
    return null;
  }
}

async function resolveLogoRef(logoRef: string, dataBucket: string): Promise<string | null> {
  const trimmed = logoRef.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const parsedKey = parseS3KeyFromUrlForBucket(trimmed, dataBucket);
    if (parsedKey) {
      return (await getSignedReadUrlForBucket(dataBucket, parsedKey)) || trimmed;
    }
    return trimmed;
  }

  return getSignedReadUrlForBucket(dataBucket, trimmed);
}

async function readTenantSiteLogoRef(tenant: TenantConfig): Promise<string | null> {
  try {
    const client = getPlatformS3Client();
    const res = await client.send(
      new GetObjectCommand({ Bucket: tenant.dataBucket, Key: "settings/site.json" }),
    );
    const raw = await res.Body?.transformToString();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { headerLogoUrl?: string };
    return parsed.headerLogoUrl?.trim() || null;
  } catch {
    return null;
  }
}

/** Logo public pour le portail de connexion (registry → site.json → URL signée). */
export async function resolveTenantCatalogLogo(tenant: TenantConfig): Promise<string | null> {
  const registryLogo = tenant.logoUrl?.trim();
  if (registryLogo) return resolveLogoRef(registryLogo, tenant.dataBucket);

  const siteLogo = await readTenantSiteLogoRef(tenant);
  if (siteLogo) return resolveLogoRef(siteLogo, tenant.dataBucket);

  return null;
}
