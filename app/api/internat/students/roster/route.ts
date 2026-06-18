import { NextResponse } from "next/server";
import { requireInternatAccess, requireInternatManage } from "@/app/api/internat/_auth";
import {
  applyInternatRoster,
  previewRosterEntry,
  validateInternatRoster,
  type InternatRosterEntry,
} from "@/app/lib/internat-import";
import { getInternatRoster, getInternatStudents, saveInternatRoster, saveInternatStudents } from "@/app/lib/internat-storage";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;

  const roster = await getInternatRoster();
  if (!roster) {
    return NextResponse.json({ roster: null, count: 0 });
  }

  const preview = await Promise.all(
    roster.entries.slice(0, 200).map(async (e) => ({
      ...e,
      preview: await previewRosterEntry(e),
    })),
  );

  return NextResponse.json({
    meta: roster.meta,
    count: roster.entries.length,
    entries: preview,
  });
}

export async function PUT(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const validated = validateInternatRoster(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  const prev = await getInternatRoster();
  const roster = {
    meta: {
      updatedAt: now,
      updatedBy: access.userName,
      count: validated.entries.length,
      lastAppliedAt: prev?.meta.lastAppliedAt,
      lastAppliedBy: prev?.meta.lastAppliedBy,
      lastApplySummary: prev?.meta.lastApplySummary,
    },
    entries: validated.entries,
  };

  await saveInternatRoster(roster);
  return NextResponse.json({
    success: true,
    count: validated.entries.length,
    message: `Liste internat enregistrée (${validated.entries.length} élève(s)).`,
  });
}

export async function POST(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "apply");

  if (action !== "apply") {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }

  let entries: InternatRosterEntry[] = [];
  if (Array.isArray(body.entries)) {
    const validated = validateInternatRoster(body.entries);
    if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
    entries = validated.entries;
  } else {
    const roster = await getInternatRoster();
    if (!roster?.entries.length) {
      return NextResponse.json(
        { error: "Aucune liste internat enregistrée. Chargez d'abord le fichier JSON." },
        { status: 400 },
      );
    }
    entries = roster.entries;
  }

  const students = await getInternatStudents();
  const result = await applyInternatRoster({
    entries,
    students,
    appliedBy: access.userName,
  });

  await saveInternatStudents(result.students);

  const now = new Date().toISOString();
  const roster = await getInternatRoster();
  if (roster) {
    await saveInternatRoster({
      ...roster,
      entries: roster.entries.length ? roster.entries : entries,
      meta: {
        ...roster.meta,
        count: entries.length,
        lastAppliedAt: now,
        lastAppliedBy: access.userName,
        lastApplySummary: {
          added: result.added,
          updated: result.updated,
          skipped: result.skipped,
        },
      },
    });
  }

  return NextResponse.json({
    added: result.added,
    updated: result.updated,
    skipped: result.skipped,
    total: result.students.filter((s) => s.actif).length,
    message: `${result.added} ajouté(s), ${result.updated} mis à jour, ${result.skipped} inchangé(s).`,
  });
}
