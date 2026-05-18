import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getDocumentKeys, isAdministratifRole } from "@/app/lib/convocations";

type ConvocationRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  data: {
    etablissement: string;
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

async function getIndex(): Promise<ConvocationRecord[]> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: INDEX_KEY }));
    const body = await res.Body?.transformToString();
    return body ? (JSON.parse(body) as ConvocationRecord[]) : [];
  } catch (e: unknown) {
    if (e && typeof e === "object" && "name" in e && e.name === "NoSuchKey") return [];
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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!isAdministratifRole(roles)) {
    return NextResponse.json({ error: "Réservé au personnel administratif." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const id = String(formData.get("id") || "").trim();
    const file = formData.get("file");
    if (!id) return NextResponse.json({ error: "Identifiant du créneau manquant." }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier PDF requis." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Seuls les PDF sont autorisés." }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Le PDF dépasse 15 Mo." }, { status: 400 });
    }

    const fileRes = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `convocations/${id}.json`,
      }),
    );
    const fileBody = await fileRes.Body?.transformToString();
    if (!fileBody) return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });

    const record = JSON.parse(fileBody) as ConvocationRecord;
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const uploadedAt = Date.now();
    const newKey = `convocations/pdfs/attached_${uploadedAt}_${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: newKey,
        Body: buffer,
        ContentType: "application/pdf",
      }),
    );

    const keys = getDocumentKeys(record.data);
    keys.push(newKey);
    record.data.documentKeys = keys;
    record.data.documentKey = keys[0] || newKey;
    record.updatedAt = new Date().toISOString();

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: `convocations/${id}.json`,
        Body: JSON.stringify(record),
        ContentType: "application/json",
      }),
    );

    const index = await getIndex();
    const updatedIndex = index.map((r) => (r.id === id ? record : r));
    await saveIndex(updatedIndex);

    return NextResponse.json({
      success: true,
      documentCount: keys.length,
      documentKeys: keys,
    });
  } catch (error) {
    console.error("Convocations attach-document error:", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout du PDF." }, { status: 500 });
  }
}
