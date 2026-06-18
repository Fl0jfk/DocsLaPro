import { calendarDateKeyParis } from "@/app/lib/domain-planning-dates";

/** Catégories d'échéances réglementaires (sources publiques nationales / académiques). */
export type AcademicDeadlineCategory =
  | "mutation_intra"
  | "mutation_inter"
  | "examens"
  | "parcoursup"
  | "affectation"
  | "rentree"
  | "autre";

export type AcademicDeadlineKind = "deadline" | "window_start" | "window_end" | "ongoing";

export type AcademicDeadline = {
  id: string;
  title: string;
  detail?: string;
  category: AcademicDeadlineCategory;
  kind: AcademicDeadlineKind;
  /** Jour clé (AAAA-MM-JJ, Europe/Paris). */
  date: string;
  /** Fin de période pour kind ongoing / window. */
  endDate?: string;
  platform?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  sourcePdfKey?: string;
  /** Année scolaire de référence — permet de filtrer les campagnes passées. */
  schoolYear: string;
};

export type AcademicDeadlineView = {
  id: string;
  title: string;
  detail?: string;
  category: AcademicDeadlineCategory;
  categoryLabel: string;
  icon: string;
  kind: AcademicDeadlineKind;
  date: string;
  endDate?: string;
  dateLabel: string;
  platform?: string;
  sourceUrl?: string;
  isToday: boolean;
  isThisWeek: boolean;
  isOngoing: boolean;
  daysUntil: number;
};

export const ACADEMIC_CATEGORY_META: Record<
  AcademicDeadlineCategory,
  { label: string; icon: string }
> = {
  mutation_intra: { label: "Mutation intra", icon: "🔄" },
  mutation_inter: { label: "Mutation inter", icon: "🌍" },
  examens: { label: "Examens", icon: "📝" },
  parcoursup: { label: "Parcoursup", icon: "🎓" },
  affectation: { label: "Affectation élèves", icon: "🏫" },
  rentree: { label: "Rentrée", icon: "📅" },
  autre: { label: "Académie", icon: "📌" },
};

/**
 * Calendrier réglementaire 2025-2026 — Académie de Normandie / ministère.
 * Sources : education.gouv.fr, parcoursup.gouv.fr, chlorofil.fr (Affelnet), SNES Normandie (mouvement).
 * À mettre à jour chaque rentrée quand les circulaires sont publiées.
 */
export const ACADEMIC_DEADLINES_SEED: AcademicDeadline[] = [
  // ——— Mutations intra Normandie 2026 ———
  {
    id: "intra-voeux-fin",
    title: "Fin de saisie des vœux (mutation intra)",
    detail: "Dernière heure pour saisir les vœux sur SIAM / I-Prof.",
    category: "mutation_intra",
    kind: "deadline",
    date: "2026-04-16",
    platform: "SIAM / I-Prof",
    sourceUrl: "https://www.normandie.snes.edu/mouvement-intra-normand.html",
    schoolYear: "2025-2026",
  },
  {
    id: "intra-confirmation-fin",
    title: "Fin des confirmations de mutation intra",
    detail: "Dépôt des confirmations signées et pièces justificatives auprès de la DPE.",
    category: "mutation_intra",
    kind: "deadline",
    date: "2026-04-27",
    platform: "Colibris / mail DPE",
    sourceUrl: "https://www.normandie.snes.edu/mouvement-intra-normand.html",
    schoolYear: "2025-2026",
  },
  {
    id: "intra-resultats",
    title: "Publication des résultats (mutation intra)",
    detail: "Résultats consultables sur I-Prof.",
    category: "mutation_intra",
    kind: "deadline",
    date: "2026-06-16",
    platform: "I-Prof",
    sourceUrl: "https://www.normandie.snes.edu/mouvement-intra-normand.html",
    schoolYear: "2025-2026",
  },
  {
    id: "intra-recours-fin",
    title: "Date limite de recours (mutation intra)",
    detail: "Formuler un recours si le résultat n'est pas satisfaisant.",
    category: "mutation_intra",
    kind: "deadline",
    date: "2026-08-16",
    platform: "I-Prof / rectorat",
    sourceUrl: "https://www.normandie.snes.edu/mouvement-intra-normand.html",
    schoolYear: "2025-2026",
  },

  // ——— Parcoursup 2026 (établissements : suivi des candidatures) ———
  {
    id: "parcoursup-admission",
    title: "Phase d'admission Parcoursup",
    detail: "Réponses aux candidatures — classement des vœux en attente du 5 au 8 juin.",
    category: "parcoursup",
    kind: "ongoing",
    date: "2026-06-02",
    endDate: "2026-07-11",
    platform: "Parcoursup",
    sourceUrl: "https://www.parcoursup.gouv.fr",
    schoolYear: "2025-2026",
  },
  {
    id: "parcoursup-complementaire",
    title: "Phase complémentaire Parcoursup",
    detail: "Nouveaux vœux possibles pour les formations avec places restantes.",
    category: "parcoursup",
    kind: "ongoing",
    date: "2026-06-11",
    endDate: "2026-09-10",
    platform: "Parcoursup",
    sourceUrl: "https://www.parcoursup.gouv.fr",
    schoolYear: "2025-2026",
  },

  // ——— Examens session 2026 ———
  {
    id: "bac-specialites",
    title: "Épreuves de spécialité (bac général)",
    detail: "Terminale — épreuves écrites de spécialités.",
    category: "examens",
    kind: "ongoing",
    date: "2026-06-16",
    endDate: "2026-06-18",
    platform: "Établissement",
    sourceUrl:
      "https://www.education.gouv.fr/reussir-au-lycee/baccalaureat-brevet-cap-parcoursup-le-calendrier-2026-341384",
    schoolYear: "2025-2026",
  },
  {
    id: "bac-grand-oral",
    title: "Grand oral du baccalauréat",
    detail: "Épreuves orales organisées par l'académie jusqu'au 1er juillet.",
    category: "examens",
    kind: "ongoing",
    date: "2026-06-22",
    endDate: "2026-07-01",
    platform: "Établissement",
    sourceUrl:
      "https://www.education.gouv.fr/reussir-au-lycee/baccalaureat-brevet-cap-parcoursup-le-calendrier-2026-341384",
    schoolYear: "2025-2026",
  },
  {
    id: "brevet-ecrits",
    title: "Épreuves écrites du brevet (DNB)",
    detail: "3e — épreuves communes les 26, 29 et 30 juin.",
    category: "examens",
    kind: "ongoing",
    date: "2026-06-26",
    endDate: "2026-06-30",
    platform: "Établissement",
    sourceUrl:
      "https://www.education.gouv.fr/reussir-au-lycee/baccalaureat-brevet-cap-parcoursup-le-calendrier-2026-341384",
    schoolYear: "2025-2026",
  },
  {
    id: "bac-resultats",
    title: "Publication des résultats du bac",
    detail: "Résultats à partir du 7 juillet (selon académie).",
    category: "examens",
    kind: "deadline",
    date: "2026-07-07",
    platform: "Cyclades / académie",
    sourceUrl:
      "https://www.education.gouv.fr/reussir-au-lycee/baccalaureat-brevet-cap-parcoursup-le-calendrier-2026-341384",
    schoolYear: "2025-2026",
  },

  // ——— Affectation après la 3e (Affelnet) ———
  {
    id: "affelnet-resultats",
    title: "Résultats d'affectation en lycée (1er tour)",
    detail: "Avis d'affectation consultable par les familles — préparer l'accueil des affectés.",
    category: "affectation",
    kind: "deadline",
    date: "2026-06-30",
    platform: "Scolarité Services / Affelnet",
    sourceUrl: "https://chlorofil.fr/actions/orientation-reussite/orientation/affelnet",
    schoolYear: "2025-2026",
  },
  {
    id: "affelnet-inscriptions",
    title: "Inscriptions dans le lycée d'affectation",
    detail: "Familles invitées à finaliser l'inscription (modalités par établissement).",
    category: "affectation",
    kind: "ongoing",
    date: "2026-07-01",
    endDate: "2026-07-04",
    platform: "Établissement",
    sourceUrl: "https://chlorofil.fr/actions/orientation-reussite/orientation/affelnet",
    schoolYear: "2025-2026",
  },

  // ——— Rentrée 2026 ———
  {
    id: "rentree-eleves",
    title: "Rentrée scolaire des élèves",
    category: "rentree",
    kind: "deadline",
    date: "2026-09-01",
    sourceUrl: "https://www.education.gouv.fr/calendrier-scolaire-108",
    schoolYear: "2025-2026",
  },
  {
    id: "rentree-profs",
    title: "Prérentrée des enseignants",
    category: "rentree",
    kind: "deadline",
    date: "2026-08-31",
    sourceUrl: "https://www.education.gouv.fr/calendrier-scolaire-108",
    schoolYear: "2025-2026",
  },

  // ——— Parcoursup rentrée 2026-2027 (anticipation) ———
  {
    id: "parcoursup-voeux-2027",
    title: "Ouverture des vœux Parcoursup (session 2027)",
    detail: "Terminale 2026-2027 — formulation des vœux.",
    category: "parcoursup",
    kind: "window_start",
    date: "2027-01-19",
    endDate: "2027-03-12",
    platform: "Parcoursup",
    sourceUrl: "https://www.parcoursup.gouv.fr",
    schoolYear: "2026-2027",
  },
];

const MS_PER_DAY = 86_400_000;

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBetween(fromKey: string, toKey: string): number {
  const diff = parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime();
  return Math.round(diff / MS_PER_DAY);
}

function startOfWeekMonday(key: string): string {
  const d = parseDateKey(key);
  const day = d.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function endOfWeekSunday(weekStartKey: string): string {
  const d = parseDateKey(weekStartKey);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

function isDateInRange(key: string, start: string, end?: string): boolean {
  if (!end) return key === start;
  return key >= start && key <= end;
}

function formatDateLabelFr(key: string): string {
  const d = parseDateKey(key);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatRangeLabel(start: string, end?: string): string {
  if (!end || start === end) return formatDateLabelFr(start);
  return `${formatDateLabelFr(start)} → ${formatDateLabelFr(end)}`;
}

function toView(item: AcademicDeadline, todayKey: string, weekStart: string, weekEnd: string): AcademicDeadlineView {
  const meta = ACADEMIC_CATEGORY_META[item.category];
  const end = item.endDate ?? item.date;
  const isOngoing =
    item.kind === "ongoing" && isDateInRange(todayKey, item.date, item.endDate);
  const isToday =
    todayKey === item.date ||
    (item.kind === "ongoing" && isDateInRange(todayKey, item.date, item.endDate)) ||
    (item.endDate && todayKey === item.endDate);
  const isThisWeek =
    isDateInRange(item.date, weekStart, weekEnd) ||
    isDateInRange(end, weekStart, weekEnd) ||
    (item.endDate && weekStart <= item.endDate && weekEnd >= item.date);

  const daysUntil = isOngoing ? 0 : daysBetween(todayKey, item.date);

  return {
    id: item.id,
    title: item.title,
    detail: item.detail,
    category: item.category,
    categoryLabel: meta.label,
    icon: meta.icon,
    kind: item.kind,
    date: item.date,
    endDate: item.endDate,
    dateLabel: formatRangeLabel(item.date, item.endDate),
    platform: item.platform,
    sourceUrl: item.sourceUrl,
    isToday,
    isThisWeek,
    isOngoing,
    daysUntil,
  };
}

function compareByStartDate(a: AcademicDeadlineView, b: AcademicDeadlineView): number {
  const byStart = a.date.localeCompare(b.date);
  if (byStart !== 0) return byStart;
  const endA = a.endDate ?? a.date;
  const endB = b.endDate ?? b.date;
  return endA.localeCompare(endB);
}

export type AcademicDeadlinesPayload = {
  todayKey: string;
  headline: {
    scope: "today" | "week" | "upcoming";
    scopeLabel: string;
    item: AcademicDeadlineView;
  } | null;
  today: AcademicDeadlineView[];
  thisWeek: AcademicDeadlineView[];
  upcoming: AcademicDeadlineView[];
  /** Liste triée par date de début (la plus proche en haut). */
  displayItems: AcademicDeadlineView[];
  /** @deprecated Utiliser displayItems — conservé pour compatibilité. */
  topItems: AcademicDeadlineView[];
};

export function pickTopAcademicItems(
  views: AcademicDeadlineView[],
  limit = 3,
): AcademicDeadlineView[] {
  const seen = new Set<string>();
  const out: AcademicDeadlineView[] = [];
  for (const item of views) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function buildAcademicDeadlinesPayload(
  items: AcademicDeadline[] = ACADEMIC_DEADLINES_SEED,
  refDate: Date = new Date(),
): AcademicDeadlinesPayload {
  const todayKey = calendarDateKeyParis(refDate);
  const weekStart = startOfWeekMonday(todayKey);
  const weekEnd = endOfWeekSunday(weekStart);

  const views = items
    .map((item) => toView(item, todayKey, weekStart, weekEnd))
    .filter((item) => {
      const end = item.endDate ?? item.date;
      if (item.isOngoing) {
        const daysToEnd = daysBetween(todayKey, end);
        return daysToEnd >= -3;
      }
      if (item.daysUntil >= 0 && item.daysUntil <= 120) return true;
      if (item.daysUntil < 0 && item.daysUntil >= -3) return true;
      if (end >= todayKey) {
        const daysToEnd = daysBetween(todayKey, end);
        return daysToEnd >= 0 && daysToEnd <= 120;
      }
      return false;
    })
    .sort(compareByStartDate);

  const todayExact = views.filter((v) => v.isToday && !v.isOngoing);
  const todayOngoing = views.filter((v) => v.isOngoing);
  const today = [...todayExact, ...todayOngoing];
  const thisWeek = views.filter((v) => v.isThisWeek && !v.isToday && !v.isOngoing && v.daysUntil >= 0);
  const upcoming = views.filter((v) => !v.isToday && !v.isOngoing && !v.isThisWeek && v.daysUntil >= 0);

  const displayItems = [...views].sort(compareByStartDate);

  let headline: AcademicDeadlinesPayload["headline"] = null;
  const pick = displayItems[0];
  if (pick) {
    if (pick.isToday && !pick.isOngoing) {
      headline = { scope: "today", scopeLabel: "Aujourd'hui", item: pick };
    } else if (pick.isThisWeek) {
      headline = { scope: "week", scopeLabel: "Cette semaine", item: pick };
    } else if (pick.isOngoing) {
      headline = { scope: "today", scopeLabel: "En cours", item: pick };
    } else {
      headline = { scope: "upcoming", scopeLabel: "Prochaine échéance", item: pick };
    }
  }

  const base = {
    todayKey,
    headline,
    today,
    thisWeek: thisWeek.slice(0, 8),
    upcoming: upcoming.slice(0, 12),
    displayItems,
  };
  return { ...base, topItems: pickTopAcademicItems(displayItems, 3) };
}
