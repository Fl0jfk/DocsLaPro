import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TENANT_S3_PREFIX, tenantReadKeys, tenantS3Key } from "@/app/lib/tenant";

let _client: S3Client | null = null;

export function getTenantS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

export function getBucketName(): string {
  const b = process.env.BUCKET_NAME;
  if (!b) throw new Error("BUCKET_NAME manquant");
  return b;
}

export async function getTenantJson<T>(
  orgId: string,
  relativePath: string,
): Promise<{ data: T; key: string } | null> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  for (const key of tenantReadKeys(orgId, relativePath)) {
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const raw = await res.Body?.transformToString();
      if (!raw) continue;
      return { data: JSON.parse(raw) as T, key };
    } catch {
      /* essayer clé suivante */
    }
  }
  return null;
}

export async function putTenantJson(orgId: string, relativePath: string, data: unknown): Promise<string> {
  const key = tenantS3Key(orgId, relativePath);
  await getTenantS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    }),
  );
  return key;
}

export async function putTenantObject(
  orgId: string,
  relativePath: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
): Promise<string> {
  const key = tenantS3Key(orgId, relativePath);
  await getTenantS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function getTenantObjectBytes(orgId: string, relativePath: string): Promise<Buffer | null> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  for (const key of tenantReadKeys(orgId, relativePath)) {
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = await res.Body?.transformToByteArray();
      if (bytes?.length) return Buffer.from(bytes);
    } catch {
      /* next */
    }
  }
  return null;
}

export async function listTenantPrefix(orgId: string, relativePrefix: string): Promise<string[]> {
  const prefix = tenantS3Key(orgId, relativePrefix.replace(/^\/+/, ""));
  const client = getTenantS3Client();
  const out: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push(o.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

export async function deleteTenantObject(orgId: string, s3Key: string): Promise<void> {
  await getTenantS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key,
    }),
  );
}

/** URL présignée pour une clé relative ou déjà préfixée tenant. */
export async function getTenantSignedReadUrl(
  orgId: string,
  relativeOrFullKey: string,
  expiresIn = 3600,
): Promise<string | null> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  const raw = relativeOrFullKey.replace(/^\/+/, "");
  const keys = raw.startsWith(`${TENANT_S3_PREFIX}/`) ? [raw] : tenantReadKeys(orgId, raw);
  for (const key of keys) {
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
    } catch {
      /* essayer clé suivante */
    }
  }
  return null;
}
