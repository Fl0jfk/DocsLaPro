/**
 * Migration one-shot : copie les préfixes S3 plats vers tenants/{orgId}/
 *
 * Usage:
 *   LEGACY_TENANT_ORG_ID=org_xxx node scripts/migrate-s3-to-tenant.mjs
 *
 * Prérequis: ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, BUCKET_NAME
 */
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const orgId = process.env.LEGACY_TENANT_ORG_ID?.trim();
if (!orgId) {
  console.error("Définissez LEGACY_TENANT_ORG_ID (id organisation Clerk).");
  process.exit(1);
}

const PREFIXES = [
  "travels/",
  "absences/",
  "requests/",
  "reservation-rooms/",
  "demandes-hse/",
  "photocopies-couleur/",
  "convocations/",
  "channels/",
  "chat/",
  "documents/",
  "eleves.json",
  "news/",
];

const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.BUCKET_NAME;

async function exists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function copyPrefix(flatPrefix) {
  let token;
  let copied = 0;
  let skipped = 0;
  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: flatPrefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of list.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      const dest = `tenants/${orgId}/${obj.Key}`;
      if (await exists(dest)) {
        skipped++;
        continue;
      }
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${obj.Key}`,
          Key: dest,
        }),
      );
      copied++;
      console.log(`OK ${obj.Key} -> ${dest}`);
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);
  return { copied, skipped };
}

async function main() {
  console.log(`Migration vers tenants/${orgId}/ sur bucket ${bucket}`);
  let totalCopied = 0;
  let totalSkipped = 0;
  for (const p of PREFIXES) {
    const { copied, skipped } = await copyPrefix(p);
    totalCopied += copied;
    totalSkipped += skipped;
  }
  console.log(`Terminé. Copiés: ${totalCopied}, déjà présents: ${totalSkipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
