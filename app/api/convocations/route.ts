import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getDocumentKeys, isDocumentKeyReferenced } from "@/app/lib/convocations";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson, putTenantJson, getBucketName } from "@/app/lib/tenant-s3-storage";
import { tenantS3Key } from "@/app/lib/tenant";

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

async function getIndex(orgId: string): Promise<ConvocationRecord[]> {
  const hit = await getTenantJson<ConvocationRecord[]>(orgId, INDEX_KEY);
  return hit?.data ?? [];
}

async function saveIndex(orgId: string, index: ConvocationRecord[]) {
  await putTenantJson(orgId, INDEX_KEY, index);
}

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.ctx;
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canViewConvocations(roles)) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  try {
    const index = await getIndex(orgId);
    const sorted = (index || []).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Convocations list error:", error);
    return NextResponse.json({ error: "Erreur récupération convocations" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.ctx;
  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canViewConvocations(roles)) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });
  try {
    const fileHit = await getTenantJson<ConvocationRecord>(orgId, `convocations/${id}.json`);
    if (!fileHit?.data) return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });
    const record = fileHit.data;
    const docKeys = getDocumentKeys(record.data);
    const bucket = getBucketName();

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: tenantS3Key(orgId, `convocations/${id}.json`),
      }),
    );
    const index = await getIndex(orgId);
    const updated = (index || []).filter((r) => r.id !== id);
    await saveIndex(orgId, updated);
    for (const docKey of docKeys) {
      if (!isDocumentKeyReferenced(updated, docKey)) {
        const key = docKey.startsWith("tenants/") ? docKey : tenantS3Key(orgId, docKey);
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Convocations delete error:", error);
    return NextResponse.json({ error: "Erreur suppression convocation" }, { status: 500 });
  }
}

