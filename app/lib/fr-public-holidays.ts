/** Jours fériés France métropolitaine (calendrier légal courant). */

function easterSundayUtcNoon(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

function ymdKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Jour férié = pas d’école / pas de planification sortie (métropole). */
export function isJourFerieFranceMetropole(d: Date): boolean {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const fixed = new Set<string>([
    `${y}-01-01`,
    `${y}-05-01`,
    `${y}-05-08`,
    `${y}-07-14`,
    `${y}-08-15`,
    `${y}-11-01`,
    `${y}-11-11`,
    `${y}-12-25`,
  ]);
  const key = ymdKey(d);
  if (fixed.has(key)) return true;
  const easter = easterSundayUtcNoon(y);
  const movable = [
    addDays(easter, 1),
    addDays(easter, 39),
    addDays(easter, 50),
  ];
  return movable.some((md) => md.getMonth() + 1 === m && md.getDate() === day);
}
