import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { putObject } from "@/app/lib/s3-storage";
import {
  buildAdminAbsenceRecord,
  canAdminIngest,
  normalizeEtablissement,
  parseLocalDateTime,
} from "@/app/lib/absences-types";
import { getAbsenceIndex, purgeExpiredAbsences, saveAbsenceIndex, saveAbsenceRecord } from "@/app/lib/absences-storage";

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const user = await currentUser();
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  if (!canAdminIngest(roles)) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  try {
    const formData = await req.formData();

    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const displayName = `${firstName} ${lastName}`.trim();
    if (!displayName) {
      return NextResponse.json({ error: "Prénom et nom du professeur sont requis." }, { status: 400 });
    }

    const reasonRaw = String(formData.get("examType") || "").trim();
    const reason = reasonRaw || "Absence (saisie manuelle)";

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
      documentKey = `absences/pdfs/manual_${uploadedAt}_${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await putObject(documentKey, buffer, "application/pdf");
      sourceDocument = file.name || "Justificatif PDF";
    }

    const creatorName = user?.fullName || user?.firstName || "Administrateur";
    const record = buildAdminAbsenceRecord({
      source: "admin_manual",
      displayName,
      etablissement,
      reason,
      startAt,
      endAt,
      documentKeys: documentKey ? [documentKey] : [],
      sourceDocument,
      createdBy: {
        userId: gate.ctx.userId,
        name: creatorName,
        email: user?.primaryEmailAddress?.emailAddress || "",
        roles,
      },
    });

    await saveAbsenceRecord(record);

    const currentIndex = await purgeExpiredAbsences(await getAbsenceIndex());
    await saveAbsenceIndex([...currentIndex, record]);

    return NextResponse.json({
      success: true,
      created: {
        id: record.id,
        teacherName: record.displayName,
        startDate: record.data.startDate,
        endDate: record.data.endDate,
      },
    });
  } catch (error) {
    console.error("Absences manual error:", error);
    return NextResponse.json({ error: "Erreur enregistrement absence manuelle." }, { status: 500 });
  }
}
