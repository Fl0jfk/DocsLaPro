import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDocumentKeys } from "@/app/lib/convocations";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson, getTenantSignedReadUrl } from "@/app/lib/tenant-s3-storage";

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
    ["administratif", "direction ecole", "direction college", "direction lycee", "education"].some((allowed) =>
      r.includes(allowed),
    ),
  );
}

export async function GET(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;

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
    const fileHit = await getTenantJson<ConvocationRecord>(orgId, `convocations/${id}.json`);
    if (!fileHit?.data) return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });

    const record = fileHit.data;
    const keys = getDocumentKeys(record.data);
    if (keys.length === 0) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

    const index = Number.isFinite(docIndex) ? Math.max(0, Math.min(keys.length - 1, Math.floor(docIndex))) : 0;

    const urls = await Promise.all(keys.map((k) => getTenantSignedReadUrl(orgId, k, 60 * 10)));
    if (urls.some((u) => !u)) {
      return NextResponse.json({ error: "Document introuvable sur le stockage." }, { status: 404 });
    }

    return NextResponse.json({ url: urls[index], urls, count: keys.length });
  } catch (error) {
    console.error("Convocations document-url error:", error);
    return NextResponse.json({ error: "Erreur récupération document convocation" }, { status: 500 });
  }
}
