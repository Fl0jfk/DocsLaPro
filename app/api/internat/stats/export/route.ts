import { NextResponse } from "next/server";
import { requireInternatAccess } from "@/app/api/internat/_auth";
import { loadAppConfig } from "@/app/lib/app-config";
import { buildDashboardStats, todayDateParis } from "@/app/lib/internat-stats";
import {
  getInternatIncidents,
  getInternatRollCall,
  getInternatRooms,
  getInternatStudents,
  listRollCallHistory,
  listValidatedRollCalls,
} from "@/app/lib/internat-storage";

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;

  const date = todayDateParis();
  const [students, rooms, tonightRollCall, recentRollCalls, incidents, history, config] =
    await Promise.all([
      getInternatStudents(),
      getInternatRooms(),
      getInternatRollCall(date),
      listValidatedRollCalls(30),
      getInternatIncidents(),
      listRollCallHistory({ limit: 90 }),
      loadAppConfig(),
    ]);

  const stats = buildDashboardStats({
    students,
    rooms,
    tonightRollCall,
    recentRollCalls,
    incidents,
    weeklySummaryEnabled: config.internat.weeklySummaryEnabled,
  });

  const lines: string[] = [
    "Rapport internat — export direction",
    `Généré le ${new Date().toLocaleString("fr-FR")}`,
    "",
    "=== Synthèse ===",
    `Internes actifs : ${stats.activeStudents}`,
    `Chambres : ${stats.roomCount}`,
    `Taux présence 7 j : ${stats.presenceRate7d ?? "—"} %`,
    `Incidents (30 j) : ${stats.incidents30d.total}`,
    `  - incidents : ${stats.incidents30d.incident}`,
    `  - remarques : ${stats.incidents30d.remarque}`,
    `  - sanctions : ${stats.incidents30d.sanction}`,
    `  - valorisations : ${stats.incidents30d.valorisation}`,
    "",
    "=== Élèves sous surveillance ===",
  ];

  if (stats.studentsUnderWatch.length === 0) {
    lines.push("Aucun.");
  } else {
    for (const s of stats.studentsUnderWatch) {
      lines.push(`• ${s.name} (${s.classe})${s.note ? ` — ${s.note}` : ""}`);
    }
  }

  lines.push("", "=== Derniers appels validés ===");
  for (const day of history.slice(0, 14)) {
    lines.push(`${day.date} (${day.period}) — ${day.marks.length} marquage(s)`);
  }

  const body = lines.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="internat-rapport-${date}.txt"`,
    },
  });
}
