export type TripIndexRow = {
  id: string;
  type?: string;
  status?: string;
  data?: {
    title?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  };
};

function parisDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function parseDay(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return parisDateKey(d);
}

export function isTripOnDay(trip: TripIndexRow, dayKey = parisDateKey(new Date())): boolean {
  if (trip.status === "SEANCE_ANNULEE") return false;
  const isComplex = trip.type === "COMPLEX" || Boolean(trip.data?.startDate);
  if (isComplex) {
    const start = parseDay(trip.data?.startDate);
    const end = parseDay(trip.data?.endDate || trip.data?.startDate);
    if (!start) return false;
    if (!end) return start === dayKey;
    return dayKey >= start && dayKey <= end;
  }
  return parseDay(trip.data?.date) === dayKey;
}

export function tripsToday(trips: TripIndexRow[]): TripIndexRow[] {
  const today = parisDateKey(new Date());
  return trips.filter((t) => isTripOnDay(t, today));
}
