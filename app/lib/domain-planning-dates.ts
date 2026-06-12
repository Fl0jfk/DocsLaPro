/** Dates calendaires en Europe/Paris (évite les décalages UTC de toISOString). */

export function calendarDateKeyParis(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

export function parseCalendarDateLocal(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}
