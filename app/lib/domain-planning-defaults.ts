import type { DomainPlanningDomain } from "@/app/lib/domain-planning-types";

export const DEFAULT_DOMAIN_PLANNING_ACTIVITY_COLORS: Record<string, string> = {
  "Séance 1": "bg-violet-600 text-white",
  "Séance 2": "bg-indigo-600 text-white",
  "Séance 3": "bg-fuchsia-600 text-white",
  Atelier: "bg-teal-600 text-white",
};

export const DEFAULT_DOMAIN_PLANNING_DOMAINS: DomainPlanningDomain[] = [
  {
    id: "evars",
    name: "EVARS",
    description: "Éducation à la vie affective, relationnelle et à la sexualité",
    color: "bg-rose-600 text-white",
    coordinatorClerkUserIds: [],
  },
  {
    id: "unss",
    name: "UNSS",
    description: "Union nationale du sport scolaire",
    color: "bg-orange-600 text-white",
    coordinatorClerkUserIds: [],
  },
];

/** Pôles réservés à d'autres modules (ex. réservation de salles). */
const EXCLUDED_CLASSES_POLES = new Set(["MAINTENANCE"]);

export function sanitizeDomainPlanningClassesByPole(
  classesByPole: Record<string, string[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [pole, classes] of Object.entries(classesByPole)) {
    if (EXCLUDED_CLASSES_POLES.has(pole.toUpperCase())) continue;
    out[pole] = classes;
  }
  return out;
}

export function withDefaultDomainPlanningActivities<T extends { activityColors: Record<string, string> }>(
  config: T,
): T {
  return {
    ...config,
    activityColors: { ...DEFAULT_DOMAIN_PLANNING_ACTIVITY_COLORS, ...config.activityColors },
  };
}

export function normalizeDomainPlanningModule<
  T extends { classesByPole: Record<string, string[]>; activityColors: Record<string, string> },
>(config: T): T {
  return {
    ...withDefaultDomainPlanningActivities(config),
    classesByPole: sanitizeDomainPlanningClassesByPole(config.classesByPole),
  };
}
