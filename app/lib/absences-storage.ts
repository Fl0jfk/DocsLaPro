import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getJson, putJson, getBucketName } from "@/app/lib/s3-storage";
import { s3Key } from "@/app/lib/s3-path";
import {
  ABSENCES_INDEX_KEY,
  normalizeAbsenceRecord,
  type AbsenceRecord,
} from "@/app/lib/absences-types";

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

function recordKey(id: string) {
  return `absences/${id}.json`;
}

export async function getAbsenceIndex(): Promise<AbsenceRecord[]> {
  const hit = await getJson<AbsenceRecord[]>(ABSENCES_INDEX_KEY);
  return (hit?.data ?? []).map(normalizeAbsenceRecord);
}

export async function saveAbsenceIndex(index: AbsenceRecord[]) {
  await putJson(ABSENCES_INDEX_KEY, index);
}

export async function getAbsenceRecord(id: string): Promise<AbsenceRecord | null> {
  const hit = await getJson<AbsenceRecord>(recordKey(id));
  return hit?.data ? normalizeAbsenceRecord(hit.data) : null;
}

export async function saveAbsenceRecord(record: AbsenceRecord) {
  const normalized = normalizeAbsenceRecord(record);
  await putJson(recordKey(normalized.id), normalized);
  return normalized;
}

function parseDateOnly(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Purge RGPD : uniquement les auto-déclarations (source self), pas le calendrier admin. */
function shouldPurgeSelfDeclaration(rec: AbsenceRecord) {
  const source = rec.source || "self";
  return source === "self";
}

export async function purgeExpiredAbsences(index: AbsenceRecord[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keep: AbsenceRecord[] = [];
  const remove: AbsenceRecord[] = [];

  for (const rec of index) {
    if (!shouldPurgeSelfDeclaration(rec)) {
      keep.push(rec);
      continue;
    }
    const endAt = rec?.data?.endAt || "";
    const end = parseDateOnly(rec?.data?.endDate || endAt.slice(0, 10));
    if (!end || end >= today) keep.push(rec);
    else remove.push(rec);
  }

  if (remove.length === 0) return keep;

  const bucket = getBucketName();
  for (const rec of remove) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: s3Key(recordKey(rec.id)),
        }),
      );
    } catch (e) {
      console.error(`Absences purge error (${rec.id}):`, e);
    }
  }

  await saveAbsenceIndex(keep);
  return keep;
}

export async function upsertAbsenceInIndex(record: AbsenceRecord) {
  const index = await purgeExpiredAbsences(await getAbsenceIndex());
  const pos = index.findIndex((a) => a.id === record.id);
  if (pos >= 0) index[pos] = record;
  else index.push(record);
  await saveAbsenceIndex(index);
  return index;
}
