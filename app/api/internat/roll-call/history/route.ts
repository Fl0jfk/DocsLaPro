import { NextResponse } from "next/server";
import { requireInternatAccess } from "@/app/api/internat/_auth";
import { getInternatStudents, listRollCallHistory } from "@/app/lib/internat-storage";
import { INTERNAT_ROLL_MARK_LABELS, studentDisplayName, type InternatRollCallPeriod } from "@/app/lib/internat-types";

export async function GET(req: Request) {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const studentId = searchParams.get("studentId") || undefined;
  const periodRaw = searchParams.get("period");
  const period: InternatRollCallPeriod | undefined =
    periodRaw === "matin" ? "matin" : periodRaw === "soir" ? "soir" : undefined;
  const limit = Math.min(120, Math.max(1, Number(searchParams.get("limit") || 60)));

  const [history, students] = await Promise.all([
    listRollCallHistory({ from, to, studentId, period, limit }),
    getInternatStudents(),
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const rows = history.flatMap((day) =>
    day.marks.map((m) => {
      const student = studentMap.get(m.studentId);
      return {
        date: day.date,
        period: day.period,
        studentId: m.studentId,
        studentName: student ? studentDisplayName(student) : m.studentId,
        classe: student?.classe,
        mark: m.mark,
        markLabel: INTERNAT_ROLL_MARK_LABELS[m.mark as keyof typeof INTERNAT_ROLL_MARK_LABELS] || m.mark,
        validatedAt: day.validatedAt,
        validatedBy: day.validatedBy,
      };
    }),
  );

  return NextResponse.json({ history: rows, students: students.filter((s) => s.actif) });
}
