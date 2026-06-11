import { NextResponse } from "next/server";
import { requireInternatAccess } from "@/app/api/internat/_auth";
import { outingIsVisibleToParents } from "@/app/lib/internat-outing";
import { getInternatActivities, listInternatOutings } from "@/app/lib/internat-storage";

export async function GET(req: Request) {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const from = String(searchParams.get("from") || "");
  const to = String(searchParams.get("to") || "");

  const [activities, outings] = await Promise.all([getInternatActivities(), listInternatOutings(100)]);

  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to);

  return NextResponse.json({
    activities: activities.filter((a) => inRange(a.date)),
    outings: outings
      .filter((o) => outingIsVisibleToParents(o) && inRange(o.outingDate))
      .map((o) => ({
        id: o.id,
        title: o.title,
        activity: o.activity,
        outingDate: o.outingDate,
        departureTime: o.departureTime,
        returnTime: o.returnTime,
        status: o.status,
        participantCount: o.participants.length,
      })),
  });
}
