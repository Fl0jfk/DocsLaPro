import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDocumentKeys, isAdministratifRole } from "@/app/lib/convocations";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson, putTenantJson, putTenantObject } from "@/app/lib/tenant-s3-storage";

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

async function getIndex(orgId: string): Promise<ConvocationRecord[]> {
  const hit = await getTenantJson<ConvocationRecord[]>(orgId, INDEX_KEY);
  return hit?.data ?? [];
}

async function saveIndex(orgId: string, index: ConvocationRecord[]) {
  await putTenantJson(orgId, INDEX_KEY, index);
}

export async function POST(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;

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

    const fileHit = await getTenantJson<ConvocationRecord>(orgId, `convocations/${id}.json`);
    if (!fileHit?.data) return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });

    const record = fileHit.data;
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const uploadedAt = Date.now();
    const newKey = `convocations/pdfs/attached_${uploadedAt}_${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await putTenantObject(orgId, newKey, buffer, "application/pdf");

    const keys = getDocumentKeys(record.data);
    keys.push(newKey);
    record.data.documentKeys = keys;
    record.data.documentKey = keys[0] || newKey;
    record.updatedAt = new Date().toISOString();

    await putTenantJson(orgId, `convocations/${id}.json`, record);

    const index = await getIndex(orgId);
    const updatedIndex = index.map((r) => (r.id === id ? record : r));
    await saveIndex(orgId, updatedIndex);

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
