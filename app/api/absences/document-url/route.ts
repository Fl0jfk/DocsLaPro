import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";

import { getAbsenceDocumentKeys } from "@/app/lib/absences-documents";
import { canViewAbsenceAttachment, canViewCalendar } from "@/app/lib/absences-types";
import { getAbsenceOrLegacyRecord } from "@/app/lib/absences-legacy-convocations";
import { requireAuth } from "@/app/lib/intranet-auth";
import { getSignedReadUrl } from "@/app/lib/s3-storage";
import { resolveTravelsS3ObjectKey } from "@/app/lib/travels-s3";

export async function GET(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { userId } = gate.ctx;

  const user = await safeCurrentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canViewCalendar(roles)) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  const docIndexRaw = searchParams.get("index");
  const docIndex = docIndexRaw === null || docIndexRaw === "" ? 0 : Number(docIndexRaw);
  if (!id) return NextResponse.json({ error: "Paramètre 'id' manquant." }, { status: 400 });

  try {
    const record = await getAbsenceOrLegacyRecord(id);
    if (!record) return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    if (!canViewAbsenceAttachment(record, userId, roles)) {
      return NextResponse.json({ error: "Accès au document non autorisé." }, { status: 403 });
    }

    const keys = [...getAbsenceDocumentKeys(record)];
    const justificationUrl = record.justification?.fileUrl?.trim();
    if (justificationUrl) {
      const justKey = await resolveTravelsS3ObjectKey(justificationUrl);
      if (justKey && !keys.includes(justKey)) keys.push(justKey);
    }
    if (keys.length === 0) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

    const index = Number.isFinite(docIndex) ? Math.max(0, Math.min(keys.length - 1, Math.floor(docIndex))) : 0;

    const urls = await Promise.all(keys.map((k) => getSignedReadUrl(k, 60 * 10)));
    if (urls.some((u) => !u)) {
      return NextResponse.json({ error: "Document introuvable sur le stockage." }, { status: 404 });
    }

    return NextResponse.json({ url: urls[index], urls, count: keys.length });
  } catch (error) {
    console.error("Absences document-url error:", error);
    return NextResponse.json({ error: "Erreur récupération document absence" }, { status: 500 });
  }
}
