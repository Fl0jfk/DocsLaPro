import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getDocumentKeys } from "@/app/lib/convocations";

type Etablissement = "École" | "Collège" | "Lycée";

type ConvocationRecord = {
  id: string;
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
  return normalized.some((r) =>
    ["administratif", "direction ecole", "direction college", "direction lycee", "education"].some((allowed) => r.includes(allowed)),
  );
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canViewConvocations(roles)) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  const docIndexRaw = searchParams.get("index");
  const docIndex = docIndexRaw === null || docIndexRaw === "" ? 0 : Number(docIndexRaw);
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
    const keys = getDocumentKeys(record.data);
    if (keys.length === 0) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

    const index = Number.isFinite(docIndex) ? Math.max(0, Math.min(keys.length - 1, Math.floor(docIndex))) : 0;
    const key = keys[index];

    const urls = await Promise.all(
      keys.map((k) =>
        getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: k }), { expiresIn: 60 * 10 }),
      ),
    );

    return NextResponse.json({ url: urls[index], urls, count: keys.length });
  } catch (error) {
    console.error("Convocations document-url error:", error);
    return NextResponse.json({ error: "Erreur récupération document convocation" }, { status: 500 });
  }
}

