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

async function collectTextractBlocks(jobId: string) {
  const blocks: NonNullable<Awaited<ReturnType<typeof textract.send<GetDocumentTextDetectionCommand>>>["Blocks"]> = [];
  let nextToken: string | undefined;
  do {
    const page = await textract.send(
      new GetDocumentTextDetectionCommand({
        JobId: jobId,
        NextToken: nextToken,
      }),
    );
    if (page.Blocks?.length) blocks.push(...page.Blocks);
    nextToken = page.NextToken;
  } while (nextToken);
  return blocks;
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
      const blocks = await collectTextractBlocks(jobId);
      const text = blocks
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

function readSlotBoundary(slot: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const raw = slot[key];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value) return value;
  }
  return "";
}

function normalizeParsedSlots(raw: unknown): ParsedSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedSlot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const slot = item as Record<string, unknown>;
    const startAt = readSlotBoundary(slot, ["startAt", "start", "debut", "début", "dateDebut", "date_debut"]);
    const endAt = readSlotBoundary(slot, ["endAt", "end", "fin", "dateFin", "date_fin"]);
    if (!startAt || !endAt) continue;
    const startIso = toIso(startAt);
    const endIso = toIso(endAt);
    if (!startIso || !endIso) continue;
    if (new Date(endIso) <= new Date(startIso)) continue;
    out.push({ startAt: startIso, endAt: endIso });
  }
  return out;
}

function dedupeSlots(slots: ParsedSlot[]) {
  const seen = new Set<string>();
  const out: ParsedSlot[] = [];
  for (const slot of slots) {
    const key = `${slot.startAt}|${slot.endAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(slot);
  }
  return out.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
}

/** Fusionne les créneaux qui se touchent ou se suivent sans interruption (ex. fin 17h30 → début 17h30). */
function mergeContiguousSlots(slots: ParsedSlot[]) {
  if (slots.length <= 1) return slots;
  const GAP_MS = 5 * 60 * 1000;
  const sorted = dedupeSlots(slots);
  const merged: ParsedSlot[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i += 1) {
    const next = sorted[i];
    const currentEnd = +new Date(current.endAt);
    const nextStart = +new Date(next.startAt);
    const nextEnd = +new Date(next.endAt);

    if (nextStart <= currentEnd + GAP_MS) {
      if (nextEnd > currentEnd) current.endAt = next.endAt;
      continue;
    }

    merged.push(current);
    current = { ...next };
  }

  merged.push(current);
  return merged;
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
Tu analyses une convocation d'examen (ou document assimilé) pour un professeur convoqué.
Réponds strictement en JSON valide, sans texte avant ni après.

RÈGLE 1 — CRÉNEAUX QUI S'ENCHAÎNENT (POURSUITE, MÊME JOURNÉE):
Si le document enchaîne deux missions sans trou (fin d'une = début de l'autre, ex. 17h30 puis 17h30),
ou décrit une poursuite ("puis", "jusqu'au", "à la décoration de copies", dépouillement, surveillance en continu),
c'est UNE SEULE indisponibilité continue → UN SEUL slot du début du premier au fin du dernier.

Exemple typique bac:
- vendredi 19/06/2026 14h30–17h30 : réunion bac
- vendredi 19/06/2026 17h30 → mercredi 01/07/2026 16h00 : décoration de copies
→ UN slot: startAt 2026-06-19T14:30:00+02:00, endAt 2026-07-01T16:00:00+02:00
(le prof n'est pas dispo dès 14h30 le vendredi jusqu'à la fin de la mission, pas deux absences séparées ce jour-là).

RÈGLE 2 — PLUSIEURS ABSENCES NON LIÉES:
Une convocation peut aussi contenir des périodes séparées (jours différents SANS enchaînement,
ex. lundi 3 juin puis vendredi 14 juin sans lien entre les deux) → un slot par période distincte.
Ne PAS fusionner des dates éloignées sans poursuite explicite.

Tu dois:
1. Parcourir TOUT le texte OCR, du début à la fin (toutes les pages).
2. Repérer toutes les plages où le professeur est convoqué / indisponible.
3. Appliquer la RÈGLE 1 pour fusionner les poursuites ; la RÈGLE 2 pour garder séparé ce qui ne se touche pas.
4. Ne créer qu'un slot par journée distincte QUE si les plages du même jour ont un vrai trou (ex. matin puis soir sans lien).
5. Si seule la date est indiquée sans heure, utiliser 08:00–18:00 (fuseau Europe/Paris, +02:00 ou +01:00).
6. Si une info est introuvable: chaîne vide pour les textes, tableau vide pour "slots".

Format JSON attendu:
{
  "teacherName": "Prénom NOM",
  "examType": "brevet|bac|oral|convocation…",
  "etablissement": "École|Collège|Lycée",
  "sourceDocument": "${sourceDocument}",
  "confidence": 0.0,
  "slots": [
    { "startAt": "2026-06-19T14:30:00+02:00", "endAt": "2026-07-01T16:00:00+02:00" },
    { "startAt": "2026-06-14T14:00:00+02:00", "endAt": "2026-06-14T18:00:00+02:00" }
  ]
}

Contraintes techniques:
- "slots" doit lister TOUS les créneaux trouvés (minimum 1 si le document en contient au moins un).
- Chaque slot: "startAt" et "endAt" en ISO8601 avec fuseau horaire.
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
  const json = parseJsonFromMistral(content) as ParsedConvocation & { slots?: unknown };
  return {
    teacherName: String(json?.teacherName || "").trim(),
    examType: String(json?.examType || "Examen").trim(),
    etablissement: normalizeEtablissement(String(json?.etablissement || "")),
    sourceDocument,
    documentKey: "",
    confidence: Number(json?.confidence || 0),
    slots: normalizeParsedSlots(json?.slots),
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

    const normalizedSlots = mergeContiguousSlots(parsed.slots);

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
