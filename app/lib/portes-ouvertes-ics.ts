/** Génère un fichier .ics pour un créneau portes ouvertes. */
export function buildPortesOuvertesIcs(params: {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  uid?: string;
}): string {
  const uid = params.uid || `po-${Date.now()}@scola`;
  const dtStart = toIcsUtc(params.startAt);
  const dtEnd = toIcsUtc(params.endAt || params.startAt);
  const desc = (params.description || "").replace(/\n/g, "\\n");
  const loc = (params.location || "").replace(/,/g, "\\,");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Scola//Portes ouvertes//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsNow()}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(params.title)}`,
    desc ? `DESCRIPTION:${escapeIcs(desc)}` : "",
    loc ? `LOCATION:${escapeIcs(loc)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatIcsNow();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function formatIcsNow(): string {
  return toIcsUtc(new Date().toISOString());
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
