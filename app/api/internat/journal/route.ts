import { NextResponse } from "next/server";
import { requireInternatAccess, requireInternatManage } from "@/app/api/internat/_auth";
import { getInternatJournal, saveInternatJournal } from "@/app/lib/internat-storage";
import { newId, type InternatJournalEntry } from "@/app/lib/internat-types";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const entries = (await getInternatJournal()).sort((a, b) => b.date.localeCompare(a.date));
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const body = await req.json().catch(() => ({}));
  const date = String(body.date || "").trim() || new Date().toISOString().slice(0, 10);
  const category = String(body.category || "").trim() || "Général";
  const content = String(body.content || "").trim();
  if (!content) return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  const entry: InternatJournalEntry = {
    id: newId("jrn"),
    date,
    category,
    content,
    createdAt: new Date().toISOString(),
    createdBy: { userId: access.userId, name: access.userName },
  };
  const entries = await getInternatJournal();
  entries.push(entry);
  await saveInternatJournal(entries);
  return NextResponse.json({ entry, entries });
}

export async function DELETE(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "");
  const entries = (await getInternatJournal()).filter((e) => e.id !== id);
  await saveInternatJournal(entries);
  return NextResponse.json({ ok: true, entries });
}
