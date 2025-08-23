import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.REGION || "eu-west-3",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.BUCKET_NAME!;
export const KEY = "absences_en_attente.json";

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
  justificatifs?: { filename: string; buffer: string; type: string }[];
  etat: "en_attente" | "validee" | "refusee";
  date_declaration: string;
  directrice?: "directrice_ecole" | "directrice_college" | "directrice_lycee";
};

export async function readStore(): Promise<AbsenceEntry[]> {
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    const body = await obj.Body?.transformToString() ?? "";
    if (!body.trim()) return [];
    try {
      return JSON.parse(body);
    } catch {
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.$metadata?.httpStatusCode === 404) return [];
    throw e;
  }
}

export async function writeStore(entries: AbsenceEntry[]) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: JSON.stringify(entries, null, 2),
      ContentType: "application/json",
    })
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

export async function getPresignedAbsenceStoreUrl(
  expiresInSeconds: number = 600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  return url;
}
