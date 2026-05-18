import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getDocumentKeys, isDocumentKeyReferenced } from "@/app/lib/convocations";

type Etablissement = "École" | "Collège" | "Lycée";

type ConvocationRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  data: {
    etablissement: Etablissement;
    startDate: string;
    endDate: string;
    teacherName: string;
    examType: string;
    startAt: string;
    endAt: string;
    sourceDocument: string;
    documentKey: string;
    documentKeys?: string[];
    confidence: number;
  };
};

const INDEX_KEY = "convocations/index.json";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, " ")
    .trim();

function canViewConvocations(roles: string[]) {
  const normalized = roles.map((r) => norm(r));
  return normalized.some((r) =>["administratif", "direction ecole", "direction college", "direction lycee", "education"].some((allowed) => r.includes(allowed)));
}

async function getIndex(): Promise<ConvocationRecord[]> {
  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: INDEX_KEY}),
    );
    const body = await res.Body?.transformToString();
    return body ? (JSON.parse(body) as ConvocationRecord[]) : [];
  } catch (e: any) {
    if (e?.name === "NoSuchKey") return [];
    throw e;
  }
}

async function saveIndex(index: ConvocationRecord[]) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: INDEX_KEY,
      Body: JSON.stringify(index),
      ContentType: "application/json",
    }),
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canViewConvocations(roles)) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  try {
    const index = await getIndex();
    const sorted = (index || []).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Convocations list error:", error);
    return NextResponse.json({ error: "Erreur récupération convocations" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canViewConvocations(roles)) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
  try {
    const fileRes = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `convocations/${id}.json`,
      }),
    );
    const fileBody = await fileRes.Body?.transformToString();
    if (!fileBody) return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });
    const record = JSON.parse(fileBody) as ConvocationRecord;
    const docKeys = getDocumentKeys(record.data);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `convocations/${id}.json`,
      }),
    );
    const index = await getIndex();
    const updated = (index || []).filter((r) => r.id !== id);
    await saveIndex(updated);
    for (const docKey of docKeys) {
      if (!isDocumentKeyReferenced(updated, docKey)) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: docKey,
          }),
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Convocations delete error:", error);
    return NextResponse.json({ error: "Erreur suppression convocation" }, { status: 500 });
  }
}

