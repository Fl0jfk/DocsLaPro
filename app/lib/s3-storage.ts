import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Key } from "@/app/lib/s3-path";

let _client: S3Client | null = null;

export function getS3Client(): S3Client {
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

export async function getJson<T>(relativePath: string): Promise<{ data: T; key: string } | null> {
  const key = s3Key(relativePath);
  try {
    const res = await getS3Client().send(new GetObjectCommand({ Bucket: getBucketName(), Key: key }));
    const raw = await res.Body?.transformToString();
    if (!raw) return null;
    return { data: JSON.parse(raw) as T, key };
  } catch {
    return null;
  }
}

export async function putJson(relativePath: string, data: unknown): Promise<string> {
  const key = s3Key(relativePath);
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    }),
  );
  return key;
}

export async function putObject(
  relativePath: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
): Promise<string> {
  const key = s3Key(relativePath);
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function getObjectBytes(relativePath: string): Promise<Buffer | null> {
  const key = s3Key(relativePath);
  try {
    const res = await getS3Client().send(new GetObjectCommand({ Bucket: getBucketName(), Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (bytes?.length) return Buffer.from(bytes);
  } catch {
    /* ignore */
  }
  return null;
}

export async function listPrefix(relativePrefix: string): Promise<string[]> {
  const prefix = s3Key(relativePrefix.replace(/^\/+/, ""));
  const client = getS3Client();
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

export async function deleteObject(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key(key),
    }),
  );
}

export async function getSignedReadUrl(relativeOrFullKey: string, expiresIn = 3600): Promise<string | null> {
  const client = getS3Client();
  const bucket = getBucketName();
  const key = s3Key(relativeOrFullKey);
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
  } catch {
    return null;
  }
}
