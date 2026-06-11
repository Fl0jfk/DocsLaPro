/** Constantes et formatage cuisine — safe client & serveur (pas de fs). */

export const CUISINE_DAYS = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
];

export const CUISINE_ROWS = [
  { key: "picnicTotal", label: "Pique-nique (total)" },
  { key: "picnicNoPork", label: "  dont Sans porc" },
  { key: "picnicVeg", label: "  dont Végétarien" },
  { key: "selfAdults", label: "Repas au self (adultes)" },
  { key: "selfStudents", label: "Repas au self (élèves)" },
  { key: "coffee", label: "Café / thé / chocolat" },
  { key: "juice", label: "Jus de fruits" },
  { key: "cakes", label: "Petits gâteaux" },
  { key: "pastries", label: "Viennoiserie" },
  { key: "other", label: "Autre" },
];

const moisFR = [
  "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
  "septembre", "octobre", "novembre", "décembre",
];
const moisIndexByName: Record<string, number> = {
  janvier: 0, janv: 0, february: 1, fév: 1, février: 1, fevrier: 1, fev: 1,
  mars: 2, march: 2, avril: 3, april: 3, mai: 4, june: 5, juin: 5, july: 6,
  juillet: 6, août: 7, aout: 7, august: 7, septembre: 8, sep: 8, sept: 8,
  october: 9, oct: 9, octobre: 9, novembre: 10, nov: 10, november: 10,
  décembre: 11, decembre: 11, dec: 11, december: 11,
};

export function formatCuisineDateFR(input?: string | null): string {
  if (!input) return "—";
  const raw = String(input).trim();
  const isoFull = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoFull) {
    const [, y, mm, dd] = isoFull;
    return `${Number(dd)} ${moisFR[Number(mm) - 1]} ${y}`;
  }
  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
  if (isoMonth) {
    const [, y, mm] = isoMonth;
    return `1 ${moisFR[Number(mm) - 1]} ${y}`;
  }
  const monthYear = raw.match(/^([A-Za-zÀ-ÿœŒ]+)\s+(\d{4})$/);
  if (monthYear) {
    const [, m, y] = monthYear;
    const key = m.toLowerCase().replace(/\./g, "");
    const idx = moisIndexByName[key];
    return `1 ${typeof idx === "number" ? moisFR[idx] : key} ${y}`;
  }
  return raw;
}

export type CuisineTripPayload = {
  id?: string;
  ownerEmail?: string;
  data: {
    title?: string;
    classes?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
    nbEleves?: number | string;
    nbAccompagnateurs?: number | string;
    piqueNiqueDetails?: {
      active?: boolean;
      deliveryPlace?: string;
      deliveryTime?: string;
      daysSelection?: Record<string, boolean>;
      orders?: Record<string, Record<string, string>>;
    };
  };
};

export function cuisineDateRangeLabel(tripData: CuisineTripPayload["data"]): string {
  const startDateFR = formatCuisineDateFR(tripData.startDate ?? tripData.date);
  const endDateFR = formatCuisineDateFR(tripData.endDate);
  return endDateFR && endDateFR !== "—" && endDateFR !== startDateFR
    ? `du ${startDateFR} au ${endDateFR}`
    : `le ${startDateFR}`;
}
