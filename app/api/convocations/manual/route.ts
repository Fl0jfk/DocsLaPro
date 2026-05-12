import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

function canIngest(roles: string[]) {
  const normalized = roles.map((r) => norm(r));
  return normalized.some((r) =>
    ["administratif", "direction ecole", "direction college", "direction lycee", "education"].some((allowed) =>
      r.includes(allowed),
    ),
  );
}

async function getIndex(): Promise<ConvocationRecord[]> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: INDEX_KEY }));
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
      Bucket: process.env.BUCKET_NAME!,
      Key: INDEX_KEY,
      Body: JSON.stringify(index),
      ContentType: "application/json",
    }),
  );
}

function normalizeEtablissement(value: string): Etablissement {
  const n = norm(value);
  if (n.includes("ecole")) return "École";
  if (n.includes("lycee")) return "Lycée";
  return "Collège";
}

/** Heure locale (champs date + time du navigateur). */
function parseLocalDateTime(dateStr: string, timeStr: string): Date | null {
  const ds = String(dateStr || "").trim();
  const ts = String(timeStr || "").trim();
  if (!ds || !ts) return null;
  const timeNorm = ts.length === 5 ? `${ts}:00` : ts;
  const [y, mo, d] = ds.split("-").map((v) => Number(v));
  const tp = timeNorm.split(":");
  const h = Number(tp[0]);
  const mi = Number(tp[1] ?? 0);
  const sec = Number(tp[2] ?? 0);
  if (![y, mo, d, h, mi, sec].every((n) => Number.isFinite(n))) return null;
  const dt = new Date(y, mo - 1, d, h, mi, sec, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function buildRecord(params: {
  etablissement: Etablissement;
  examType: string;
  teacherName: string;
  sourceDocument: string;
  documentKey: string;
  startAt: string;
  endAt: string;
}): ConvocationRecord {
  const now = new Date().toISOString();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    createdAt: now,
    updatedAt: now,
    data: {
      etablissement: params.etablissement,
      startDate: params.startAt.slice(0, 10),
      endDate: params.endAt.slice(0, 10),
      teacherName: params.teacherName,
      examType: params.examType,
      startAt: params.startAt,
      endAt: params.endAt,
      sourceDocument: params.sourceDocument,
      documentKey: params.documentKey,
      confidence: 1,
    },
  };
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canIngest(roles)) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  try {
    const formData = await req.formData();

    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const teacherName = `${firstName} ${lastName}`.trim();
    if (!teacherName) {
      return NextResponse.json({ error: "Prénom et nom du professeur sont requis." }, { status: 400 });
    }

    const examTypeRaw = String(formData.get("examType") || "").trim();
    const examType = examTypeRaw || "Absence (saisie manuelle)";

    const etablissement = normalizeEtablissement(String(formData.get("etablissement") || "Collège"));

    const startDate = String(formData.get("startDate") || "").trim();
    const endDate = String(formData.get("endDate") || "").trim();
    const startTime = String(formData.get("startTime") || "").trim();
    const endTime = String(formData.get("endTime") || "").trim();

    if (!startDate || !endDate || !startTime || !endTime) {
      return NextResponse.json({ error: "Dates et heures de début/fin requises." }, { status: 400 });
    }

    const startAtDate = parseLocalDateTime(startDate, startTime);
    const endAtDate = parseLocalDateTime(endDate, endTime);
    if (!startAtDate || !endAtDate) {
      return NextResponse.json({ error: "Dates ou heures invalides." }, { status: 400 });
    }
    if (endAtDate.getTime() <= startAtDate.getTime()) {
      return NextResponse.json({ error: "La fin de l'absence doit être après le début." }, { status: 400 });
    }

    const startAt = startAtDate.toISOString();
    const endAt = endAtDate.toISOString();

    let documentKey = "";
    let sourceDocument = "Saisie manuelle";
    const file = formData.get("justificatif");
    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Le justificatif doit être un PDF." }, { status: 400 });
      }
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "Le PDF dépasse 15 Mo." }, { status: 400 });
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const uploadedAt = Date.now();
      documentKey = `convocations/pdfs/manual_${uploadedAt}_${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: documentKey,
          Body: buffer,
          ContentType: "application/pdf",
        }),
      );
      sourceDocument = file.name || "Justificatif PDF";
    }

    const record = buildRecord({
      etablissement,
      examType,
      teacherName,
      sourceDocument,
      documentKey,
      startAt,
      endAt,
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: `convocations/${record.id}.json`,
        Body: JSON.stringify(record),
        ContentType: "application/json",
      }),
    );

    const currentIndex = await getIndex();
    await saveIndex([...currentIndex, record]);

    return NextResponse.json({
      success: true,
      created: {
        id: record.id,
        teacherName: record.data.teacherName,
        startDate: record.data.startDate,
        endDate: record.data.endDate,
      },
    });
  } catch (error) {
    console.error("Convocations manual error:", error);
    return NextResponse.json({ error: "Erreur enregistrement absence manuelle." }, { status: 500 });
  }
}
