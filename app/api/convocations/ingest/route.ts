import { NextResponse, after } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  canIngestFromUser,
  newJobId,
  writeIngestJob,
  type IngestJob,
} from "./ingest-job";
import { mapIngestFailureMessage, runConvocationIngestJob } from "@/app/lib/convocation-ingest-process";

export const maxDuration = 60;

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

function isPdfFile(file: File) {
  const name = String(file.name || "").toLowerCase();
  const type = String(file.type || "").toLowerCase();
  if (name.endsWith(".pdf")) return true;
  return type === "application/pdf" || type === "application/x-pdf";
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canIngestFromUser(roles)) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier PDF requis." }, { status: 400 });
    }
    if (!isPdfFile(file)) {
      return NextResponse.json(
        {
          error: "Seuls les PDF sont autorisés (.pdf). Si vous glissez-déposez, vérifiez l'extension du fichier.",
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 },
      );
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Le PDF dépasse 15 Mo." }, { status: 400 });
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const key = `convocations/pdfs/${Date.now()}_${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf",
      }),
    );

    const jobId = newJobId();
    const startedAt = new Date().toISOString();
    const job: IngestJob = {
      jobId,
      userId,
      status: "pending",
      startedAt,
      updatedAt: startedAt,
      sourceFileName: file.name,
      documentKey: key,
    };
    await writeIngestJob(job);

    after(() =>
      runConvocationIngestJob(jobId, key, file.name).catch((err) =>
        console.error("[convocations/ingest] after():", err),
      ),
    );

    return NextResponse.json(
      {
        accepted: true,
        jobId,
        status: "pending",
        detail: "PDF enregistré. Analyse en cours (souvent 30 s à 2 min, parfois plus pour les scans lourds).",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Convocations ingest error:", error);
    const mapped = mapIngestFailureMessage(error);
    return NextResponse.json(mapped, { status: 500 });
  }
}
