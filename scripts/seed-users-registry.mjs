/**
 * Initialise users-registry.json à la racine du bucket depuis les utilisateurs Clerk.
 *
 * Usage: node scripts/seed-users-registry.mjs
 * (lit .env.local à la racine du projet)
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClerkClient } from "@clerk/backend";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

const orgId = process.env.LEGACY_TENANT_ORG_ID?.trim();
const bucket = process.env.BUCKET_NAME?.trim();
const secretKey = process.env.CLERK_SECRET_KEY?.trim();

const missing = [];
if (!orgId) missing.push("LEGACY_TENANT_ORG_ID");
if (!bucket) missing.push("BUCKET_NAME");
if (!process.env.ACCESS_KEY_ID) missing.push("ACCESS_KEY_ID");
if (!process.env.SECRET_ACCESS_KEY) missing.push("SECRET_ACCESS_KEY");
if (!process.env.REGION) missing.push("REGION");
if (!secretKey) missing.push("CLERK_SECRET_KEY");

if (missing.length) {
  console.error("Variables manquantes dans .env.local (ou shell) :", missing.join(", "));
  console.error("Ajoute LEGACY_TENANT_ORG_ID=org_... (ID organisation Clerk) puis relance.");
  process.exit(1);
}

const KEY = "users-registry.json";
const clerk = createClerkClient({ secretKey });
const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

let registry = { version: 1, updatedAt: new Date().toISOString(), organizations: {} };
try {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: KEY }));
  const raw = await res.Body?.transformToString();
  if (raw) registry = JSON.parse(raw);
} catch {
  /* nouveau fichier */
}

const users = [];
let offset = 0;
for (let i = 0; i < 20; i++) {
  const batch = await clerk.users.getUserList({ limit: 100, offset });
  for (const u of batch.data) {
    const email = u.emailAddresses[0]?.emailAddress;
    if (!email) continue;
    const role = u.publicMetadata?.role;
    const roles = Array.isArray(role) ? role.map(String) : role ? [String(role)] : ["professeur"];
    users.push({
      clerkUserId: u.id,
      email,
      firstName: u.firstName?.trim() || "",
      lastName: u.lastName?.trim() || "",
      roles,
      pending: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  if (batch.data.length < 100) break;
  offset += 100;
}

registry.organizations[orgId] = { label: "Migré depuis Clerk", users };
registry.updatedAt = new Date().toISOString();

await s3.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: KEY,
    Body: JSON.stringify(registry, null, 2),
    ContentType: "application/json",
  }),
);

console.log(`OK: ${users.length} utilisateurs → s3://${bucket}/${KEY}`);
console.log(`Organisation: ${orgId}`);
