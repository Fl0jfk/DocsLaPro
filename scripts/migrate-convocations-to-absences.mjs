/**
 * Migration one-shot : convocations/* → absences/*
 * Usage : node scripts/migrate-convocations-to-absences.mjs [--dry-run]
 *
 * Ne supprime pas convocations/ — validation manuelle en prod recommandée.
 */
import { CopyObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

const dryRun = process.argv.includes("--dry-run");
const bucket = process.env.BUCKET_NAME;
const region = process.env.REGION;

if (!bucket || !region || !process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY) {
  console.error("Variables S3 manquantes (BUCKET_NAME, REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY).");
  process.exit(1);
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

async function getJson(key) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch (e) {
    if (e?.name === "NoSuchKey") return null;
    throw e;
  }
}

async function putJson(key, data) {
  if (dryRun) {
    console.log(`[dry-run] PUT ${key}`);
    return;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    }),
  );
}

async function copyPdfIfNeeded(oldKey) {
  if (!oldKey?.trim()) return oldKey;
  const trimmed = oldKey.trim();
  if (trimmed.startsWith("absences/pdfs/")) return trimmed;
  const fileName = trimmed.split("/").pop() || `migrated_${Date.now()}.pdf`;
  const newKey = `absences/pdfs/migrated_${fileName}`;
  if (dryRun) {
    console.log(`[dry-run] COPY ${trimmed} → ${newKey}`);
    return newKey;
  }
  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${trimmed}`,
        Key: newKey,
        ContentType: "application/pdf",
      }),
    );
    return newKey;
  } catch (e) {
    console.warn(`PDF non copié (${trimmed}):`, e?.message || e);
    return trimmed;
  }
}

function documentKeysFromConvocation(data) {
  const fromArray = Array.isArray(data.documentKeys)
    ? data.documentKeys.map((k) => String(k || "").trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) return fromArray;
  const legacy = String(data.documentKey || "").trim();
  return legacy ? [legacy] : [];
}

function convertConvocation(record, createdByFallback) {
  const data = record.data || {};
  const teacherName = String(data.teacherName || "").trim() || "Inconnu";
  const reason = String(data.examType || "").trim() || "Absence";
  const sourceDocument = String(data.sourceDocument || "");
  const isManual = /saisie manuelle/i.test(sourceDocument);
  const source = isManual ? "admin_manual" : "admin_pdf";
  const now = record.updatedAt || record.createdAt || new Date().toISOString();

  return {
    id: record.id,
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || now,
    source,
    displayName: teacherName,
    calendarVisible: true,
    createdBy: createdByFallback,
    data: {
      scope: "professeur",
      etablissement: data.etablissement || "Collège",
      periodType: data.startDate === data.endDate ? "single_day" : "multi_day",
      startDate: data.startDate || data.startAt?.slice(0, 10) || "",
      endDate: data.endDate || data.endAt?.slice(0, 10) || "",
      startTime: null,
      endTime: null,
      startAt: data.startAt,
      endAt: data.endAt,
      reason,
      details: "",
      sourceDocument,
      documentKeys: data.documentKeys,
      confidence: data.confidence ?? 1,
    },
    workflowStatus: "CLOTUREE",
    managerDecision: "VALIDEE",
    closedAt: now,
    justification: null,
    justificatifRelanceAt: null,
    history: [
      {
        at: now,
        by: createdByFallback.name,
        action: source === "admin_pdf" ? "MIGRATION_CONVOCATION_PDF" : "MIGRATION_CONVOCATION_MANUEL",
      },
    ],
  };
}

function normalizeExistingAbsence(record) {
  const calendarVisible =
    typeof record.calendarVisible === "boolean"
      ? record.calendarVisible
      : record.managerDecision === "VALIDEE";
  const { startAt, endAt } = record.data || {};
  return {
    ...record,
    source: record.source || "self",
    displayName: record.displayName || record.createdBy?.name || "Inconnu",
    calendarVisible,
    data: {
      ...record.data,
      startAt: startAt || `${record.data?.startDate}T08:00:00.000Z`,
      endAt: endAt || `${record.data?.endDate}T18:00:00.000Z`,
    },
  };
}

async function main() {
  console.log(dryRun ? "=== DRY RUN ===" : "=== MIGRATION convocations → absences ===");

  const convIndex = (await getJson("convocations/index.json")) || [];
  const absIndex = ((await getJson("absences/index.json")) || []).map(normalizeExistingAbsence);
  const byId = new Map(absIndex.map((r) => [r.id, r]));

  const createdByFallback = {
    userId: "migration",
    name: "Migration convocations",
    email: "",
    roles: ["administratif"],
  };

  let migrated = 0;
  for (const conv of convIndex) {
    if (!conv?.id) continue;
    if (byId.has(conv.id)) {
      console.log(`Skip ${conv.id} (déjà dans absences)`);
      continue;
    }
    const absence = convertConvocation(conv, createdByFallback);
    const keys = documentKeysFromConvocation(conv.data || {});
    const newKeys = [];
    for (const k of keys) {
      newKeys.push(await copyPdfIfNeeded(k));
    }
    absence.data.documentKeys = newKeys;

    if (!dryRun) {
      await putJson(`absences/${absence.id}.json`, absence);
    } else {
      console.log(`[dry-run] record ${absence.id} (${absence.displayName})`);
    }
    byId.set(absence.id, absence);
    migrated += 1;
  }

  const merged = [...byId.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  await putJson("absences/index.json", merged);

  console.log(`Convocations migrées : ${migrated}`);
  console.log(`Index absences final : ${merged.length} entrée(s)`);
  console.log("Ancien dossier convocations/ conservé — supprimer manuellement après validation.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
