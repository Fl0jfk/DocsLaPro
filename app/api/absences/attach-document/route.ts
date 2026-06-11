import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getAbsenceDocumentKeys } from "@/app/lib/absences-documents";
import { canAdminIngest } from "@/app/lib/absences-types";
import { getAbsenceIndex, getAbsenceRecord, saveAbsenceIndex, saveAbsenceRecord } from "@/app/lib/absences-storage";
import { requireAuth } from "@/app/lib/intranet-auth";
import { putObject } from "@/app/lib/s3-storage";

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
    const id = String(formData.get("id") || "").trim();
    const file = formData.get("file");
    if (!id) return NextResponse.json({ error: "Identifiant du créneau manquant." }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier PDF requis." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Seuls les PDF sont autorisés." }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Le PDF dépasse 15 Mo." }, { status: 400 });
    }

    const record = await getAbsenceRecord(id);
    if (!record) return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const uploadedAt = Date.now();
    const newKey = `absences/pdfs/attached_${uploadedAt}_${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await putObject(newKey, buffer, "application/pdf");

    const keys = getAbsenceDocumentKeys(record);
    keys.push(newKey);
    record.data.documentKeys = keys;
    record.updatedAt = new Date().toISOString();

    await saveAbsenceRecord(record);

    const index = await getAbsenceIndex();
    const updatedIndex = index.map((r) => (r.id === id ? record : r));
    await saveAbsenceIndex(updatedIndex);

    return NextResponse.json({
      success: true,
      documentCount: keys.length,
      documentKeys: keys,
    });
  } catch (error) {
    console.error("Absences attach-document error:", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout du PDF." }, { status: 500 });
  }
}
