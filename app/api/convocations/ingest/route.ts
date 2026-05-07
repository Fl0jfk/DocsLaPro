import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetDocumentTextDetectionCommand, StartDocumentTextDetectionCommand, TextractClient,} from "@aws-sdk/client-textract";

type Etablissement = "École" | "Collège" | "Lycée";
type ParsedSlot = { startAt: string; endAt: string };
type ParsedConvocation = {
  teacherName: string;
  examType: string;
  etablissement: Etablissement;
  sourceDocument: string;
  documentKey: string;
  confidence: number;
  slots: ParsedSlot[];
};

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
const WAIT_MS = 5000;
const OCR_MAX_ATTEMPTS = 30;

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const textract = new TextractClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function getAbsenceIndex(): Promise<ConvocationRecord[]> {
  try {
    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: INDEX_KEY,
      }),
    );
    const body = await result.Body?.transformToString();
    return body ? (JSON.parse(body) as ConvocationRecord[]) : [];
  } catch (error: any) {
    if (error?.name === "NoSuchKey") return [];
    throw error;
  }
}

async function saveAbsenceIndex(index: ConvocationRecord[]) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: INDEX_KEY,
      Body: JSON.stringify(index),
      ContentType: "application/json",
    }),
  );
}

function scoreNameMatch(target: string, firstName: string, lastName: string) {
  const nTarget = norm(target);
  const nFirst = norm(firstName);
  const nLast = norm(lastName);
  let score = 0;
  if (nLast && nTarget.includes(nLast)) score += 2;
  if (nFirst && nTarget.includes(nFirst)) score += 2;
  if (`${nFirst} ${nLast}`.trim() === nTarget) score += 3;
  return score;
}

async function resolveTeacherIdentity(teacherName: string, fallbackName: string) {
  const client = await clerkClient();
  const list = await client.users.getUserList({ limit: 500 });
  const teachers = list.data.filter((u) => {
    const rolesRaw = u.publicMetadata.role;
    const roles = Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : [];
    return roles.some((r) => norm(r).includes("professeur"));
  });
  const scored = teachers
    .map((u) => {
      const firstName = u.firstName || "";
      const lastName = u.lastName || "";
      return {
        user: u,
        score: scoreNameMatch(teacherName, firstName, lastName),
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 2) {
    return {
      userId: `teacher:${Date.now()}`,
      name: teacherName || fallbackName,
      email: "",
      roles: ["professeur"],
    };
  }

  const user = best.user;
  const rolesRaw = user.publicMetadata.role;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : ["professeur"];
  return {
    userId: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || teacherName || fallbackName,
    email: user.emailAddresses?.[0]?.emailAddress || "",
    roles,
  };
}

async function runTextractForS3Key(key: string) {
  const start = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: process.env.BUCKET_NAME!, Name: key } },
    }),
  );
  const jobId = start.JobId;
  if (!jobId) throw new Error("Textract: Job ID manquant.");

  for (let i = 0; i < OCR_MAX_ATTEMPTS; i += 1) {
    const result = await textract.send(new GetDocumentTextDetectionCommand({ JobId: jobId }));
    if (result.JobStatus === "SUCCEEDED") {
      const text = (result.Blocks || [])
        .map((b) => b.Text)
        .filter(Boolean)
        .join(" ");
      if (!text) throw new Error("Textract: texte vide.");
      return text;
    }
    if (result.JobStatus === "FAILED" || result.JobStatus === "PARTIAL_SUCCESS") {
      throw new Error(`Textract: statut ${result.JobStatus}`);
    }
    await sleep(WAIT_MS);
  }

  throw new Error("Textract: timeout d'extraction.");
}

function parseJsonFromMistral(content: string) {
  const raw = String(content || "").trim().replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Mistral: JSON introuvable.");
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeEtablissement(value: string): Etablissement {
  const n = norm(value);
  if (n.includes("ecole")) return "École";
  if (n.includes("lycee")) return "Lycée";
  return "Collège";
}

function toIso(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function buildAbsenceRecord(params: {
  etablissement: Etablissement;
  examType: string;
  teacherName: string;
  sourceDocument: string;
  documentKey: string;
  confidence: number;
  slot: ParsedSlot;
}) {
  const now = new Date().toISOString();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startDate = params.slot.startAt.slice(0, 10);
  const endDate = params.slot.endAt.slice(0, 10);
  const record: ConvocationRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    data: {
      etablissement: params.etablissement,
      startDate,
      endDate,
      teacherName: params.teacherName,
      examType: params.examType,
      startAt: params.slot.startAt,
      endAt: params.slot.endAt,
      sourceDocument: params.sourceDocument,
      documentKey: params.documentKey,
      confidence: params.confidence,
    },
  };

  return record;
}

async function parseConvocationWithMistral(text: string, sourceDocument: string): Promise<ParsedConvocation> {
  const prompt = `
Analyse la convocation d'examen ci-dessous et extrais les absences d'un professeur.
Réponds strictement en JSON valide.
Si une info est introuvable, utilise une valeur vide adaptée (chaine vide ou tableau vide).

Format JSON attendu:
{
  "teacherName": "Prénom NOM",
  "examType": "brevet|bac|oral...",
  "etablissement": "École|Collège|Lycée",
  "sourceDocument": "${sourceDocument}",
  "confidence": 0.0,
  "slots": [
    { "startAt": "2026-06-03T08:00:00+02:00", "endAt": "2026-06-03T12:00:00+02:00" }
  ]
}

Contraintes:
- "slots" doit contenir tous les créneaux détectés.
- Les dates doivent être ISO8601.
- Ne retourne aucun texte hors JSON.

Texte OCR:
---
${text}
---
`;

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-medium",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral: ${err}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || "";
  const json = parseJsonFromMistral(content) as ParsedConvocation;
  return {
    teacherName: String(json?.teacherName || "").trim(),
    examType: String(json?.examType || "Examen").trim(),
    etablissement: normalizeEtablissement(String(json?.etablissement || "")),
    sourceDocument,
    documentKey: "",
    confidence: Number(json?.confidence || 0),
    slots: Array.isArray(json?.slots) ? json.slots : [],
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
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier PDF requis." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Seuls les PDF sont autorisés." }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Le PDF dépasse 15 Mo." }, { status: 400 });
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const uploadedAt = Date.now();
    const key = `convocations/pdfs/${uploadedAt}_${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf",
      }),
    );

    const ocrText = await runTextractForS3Key(key);
    const parsed = await parseConvocationWithMistral(ocrText, file.name);
    parsed.documentKey = key;

    if (!parsed.teacherName || parsed.slots.length === 0) {
      return NextResponse.json(
        { error: "Extraction incomplète: enseignant ou créneaux non détectés.", parsed },
        { status: 422 },
      );
    }

    const normalizedSlots = parsed.slots
      .map((slot) => {
        const startAt = toIso(slot.startAt);
        const endAt = toIso(slot.endAt);
        if (!startAt || !endAt) return null;
        if (new Date(endAt) <= new Date(startAt)) return null;
        return { startAt, endAt };
      })
      .filter(Boolean) as ParsedSlot[];

    if (normalizedSlots.length === 0) {
      return NextResponse.json({ error: "Créneaux invalides après validation." }, { status: 422 });
    }

    const currentIndex = await getAbsenceIndex();
    const createdRecords: ConvocationRecord[] = [];
    for (const slot of normalizedSlots) {
      const record = buildAbsenceRecord({
        etablissement: parsed.etablissement,
        examType: parsed.examType,
        teacherName: parsed.teacherName,
        sourceDocument: parsed.sourceDocument,
        documentKey: parsed.documentKey,
        confidence: parsed.confidence,
        slot,
      });
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: `convocations/${record.id}.json`,
          Body: JSON.stringify(record),
          ContentType: "application/json",
        }),
      );
      createdRecords.push(record);
    }
    await saveAbsenceIndex([...currentIndex, ...createdRecords]);

    return NextResponse.json({
      success: true,
      parsed,
      created: createdRecords.map((r) => ({
        id: r.id,
        teacherName: r.data.teacherName,
        startDate: r.data.startDate,
        endDate: r.data.endDate,
      })),
    });
  } catch (error) {
    console.error("Convocations ingest error:", error);
    return NextResponse.json({ error: "Erreur ingestion convocation." }, { status: 500 });
  }
}
