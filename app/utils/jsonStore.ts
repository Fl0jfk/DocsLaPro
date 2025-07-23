import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
export const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

const KEY = "absences_en_attente.json";

export type AbsenceEntry = {
  id: string;
  type: "prof" | "salarie";
  cible: "direction_ecole" | "direction_college" | "direction_lycee";
  nom: string;
  email: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  commentaire?: string;
  justificatif_filename?: string;
  justificatif_buffer?: string;
  justificatifs?: { filename: string; buffer: string; type: string }[];
  justificatif_type?: string;
  etat: "en_attente" | "validee" | "refusee";
  date_declaration: string;
};

export async function readStore(): Promise<AbsenceEntry[]> {
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    const body = await obj.Body?.transformToString();
    return body ? JSON.parse(body) : [];
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e.$metadata?.httpStatusCode === 404) return [];
    throw e;
  }
}

export async function writeStore(entries: AbsenceEntry[]) {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: KEY, Body: JSON.stringify(entries, null, 2), ContentType: "application/json"})
  );
}

export async function addEntry(entry: AbsenceEntry) {
  const entries = await readStore();
  entries.push(entry);
  await writeStore(entries);
}

export async function removeEntry(id: string) {
  const entries = await readStore();
  const out = entries.filter(e => e.id !== id);
  await writeStore(out);
}
