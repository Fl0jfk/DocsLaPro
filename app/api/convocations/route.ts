import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
  return normalized.some((r) =>
    ["administratif", "direction ecole", "direction college", "direction lycee", "education"].some((allowed) => r.includes(allowed)),
  );
}

async function getIndex(): Promise<ConvocationRecord[]> {
  try {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: INDEX_KEY,
      }),
    );
    const body = await res.Body?.transformToString();
    return body ? (JSON.parse(body) as ConvocationRecord[]) : [];
  } catch (e: any) {
    if (e?.name === "NoSuchKey") return [];
    throw e;
  }
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

