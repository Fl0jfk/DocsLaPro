import { NextResponse } from "next/server";
import { requireInternatAccess } from "@/app/api/internat/_auth";
import { loadAppConfig } from "@/app/lib/app-config";
import { buildDashboardStats, todayDateParis } from "@/app/lib/internat-stats";
import {
  getInternatRollCall,
  getInternatRooms,
  getInternatStudents,
  listValidatedRollCalls,
} from "@/app/lib/internat-storage";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;

  const date = todayDateParis();
  const [students, rooms, tonightRollCall, recentRollCalls, config] = await Promise.all([
    getInternatStudents(),
    getInternatRooms(),
    getInternatRollCall(date),
    listValidatedRollCalls(30),
    loadAppConfig(),
  ]);

  const stats = buildDashboardStats({
    students,
    rooms,
    tonightRollCall,
    recentRollCalls,
    weeklySummaryEnabled: config.internat.weeklySummaryEnabled,
  });

  return NextResponse.json({ stats, date });
}
