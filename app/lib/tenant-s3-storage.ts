import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Key } from "@/app/lib/tenant";

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

function readKeysForPath(relativePath: string): string[] {
  const flat = s3Key(relativePath);
  const keys = [flat];
  const legacyOrg = process.env.LEGACY_TENANT_ORG_ID?.trim();
  if (legacyOrg) {
    const legacy = `tenants/${legacyOrg}/${flat}`;
    if (!keys.includes(legacy)) keys.push(legacy);
  }
  return keys;
}

export async function getTenantJson<T>(
  _orgId: string | null | undefined,
  relativePath: string,
): Promise<{ data: T; key: string } | null> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  for (const key of readKeysForPath(relativePath)) {
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

export async function putTenantJson(
  _orgId: string | null | undefined,
  relativePath: string,
  data: unknown,
): Promise<string> {
  const key = s3Key(relativePath);
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
  _orgId: string | null | undefined,
  relativePath: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
): Promise<string> {
  const key = s3Key(relativePath);
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

export async function getTenantObjectBytes(
  _orgId: string | null | undefined,
  relativePath: string,
): Promise<Buffer | null> {
  const key = s3Key(relativePath);
  try {
    const res = await getTenantS3Client().send(
      new GetObjectCommand({ Bucket: getBucketName(), Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (bytes?.length) return Buffer.from(bytes);
  } catch {
    /* ignore */
  }
  return null;
}

export async function listTenantPrefix(
  _orgId: string | null | undefined,
  relativePrefix: string,
): Promise<string[]> {
  const prefix = s3Key(relativePrefix.replace(/^\/+/, ""));
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

export async function deleteTenantObject(_orgId: string | null | undefined, key: string): Promise<void> {
  await getTenantS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key(key),
    }),
  );
}

export async function getTenantSignedReadUrl(
  _orgId: string | null | undefined,
  relativeOrFullKey: string,
  expiresIn = 3600,
): Promise<string | null> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  const key = s3Key(relativeOrFullKey);
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
  } catch {
    return null;
  }
}
