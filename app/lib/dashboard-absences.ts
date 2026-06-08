export type ConvocationRow = {
  id: string;
  data: {
    teacherName: string;
    examType: string;
    startAt: string;
    endAt: string;
  };
};

export type AbsenceTodayRow = {
  id: string;
  teacherName: string;
  examType: string;
  timeLabel: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeFR(date: Date) {
  return `${pad2(date.getHours())}h${pad2(date.getMinutes())}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function absencesToday(items: ConvocationRow[]): AbsenceTodayRow[] {
  const today = new Date();
  const out: AbsenceTodayRow[] = [];

  for (const item of items) {
    const start = new Date(item.data.startAt);
    const end = new Date(item.data.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || +end <= +start) continue;

    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    if (+end < +dayStart || +start > +dayEnd) continue;

    const isFirstDay = sameDay(start, today);
    const isLastDay = sameDay(end, today);
    const timeLabel =
      isFirstDay && isLastDay
        ? `${formatTimeFR(start)} – ${formatTimeFR(end)}`
        : isFirstDay
          ? `à partir de ${formatTimeFR(start)}`
          : isLastDay
            ? `jusqu'à ${formatTimeFR(end)}`
            : "journée";

    out.push({
      id: item.id,
      teacherName: item.data.teacherName,
      examType: item.data.examType,
      timeLabel,
    });
  }

  return out.sort((a, b) => a.teacherName.localeCompare(b.teacherName, "fr", { sensitivity: "base" }));
}
