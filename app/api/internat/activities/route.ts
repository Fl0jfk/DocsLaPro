import { NextResponse } from "next/server";
import { requireInternatAccess } from "@/app/api/internat/_auth";
import { getInternatActivities, saveInternatActivities } from "@/app/lib/internat-storage";
import { newId, type InternatActivity } from "@/app/lib/internat-types";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const activities = await getInternatActivities();
  return NextResponse.json({ activities });
}

export async function POST(req: Request) {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "create");
  const activities = await getInternatActivities();
  const now = new Date().toISOString();

  if (action === "delete") {
    const id = String(body.id || "");
    await saveInternatActivities(activities.filter((a) => a.id !== id));
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    const id = String(body.id || "");
    const idx = activities.findIndex((a) => a.id === id);
    if (idx < 0) return NextResponse.json({ error: "Activité introuvable." }, { status: 404 });
    activities[idx] = {
      ...activities[idx],
      date: String(body.date || activities[idx].date),
      title: String(body.title || activities[idx].title).trim() || activities[idx].title,
      description: body.description !== undefined ? String(body.description || "") : activities[idx].description,
      participantIds: Array.isArray(body.participantIds) ? body.participantIds.map(String) : activities[idx].participantIds,
    };
    await saveInternatActivities(activities);
    return NextResponse.json({ activity: activities[idx], activities });
  }

  const title = String(body.title || "").trim();
  const date = String(body.date || "").trim();
  if (!title || !date) {
    return NextResponse.json({ error: "Titre et date requis." }, { status: 400 });
  }

  const activity: InternatActivity = {
    id: newId("act"),
    date,
    title,
    description: String(body.description || "").trim() || undefined,
    participantIds: Array.isArray(body.participantIds) ? body.participantIds.map(String) : undefined,
    createdAt: now,
    createdBy: { userId: access.userId, name: access.userName },
  };
  activities.push(activity);
  await saveInternatActivities(activities);
  return NextResponse.json({ activity, activities });
}
