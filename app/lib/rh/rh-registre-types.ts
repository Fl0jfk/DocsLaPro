/**
 * Types registre RH (partagés client / serveur).
 * L'agrégation OneDrive vit dans `rh-registre.ts` (server-only).
 */

import type { RhCategory } from "@/app/lib/rh/types";

export type RhRegistreUrgency = "high" | "medium" | "low";

export type RhRegistreAlertKind =
  | "habilitation"
  | "formation"
  | "medecine"
  | "conformite"
  | "entretien";

export type RhRegistreAlert = {
  id: string;
  kind: RhRegistreAlertKind;
  personnelId: string;
  displayName: string;
  folderName: string;
  title: string;
  detail: string;
  urgency: RhRegistreUrgency;
  dueDate?: string | null;
};

export type RhRegistreRow = {
  id: string;
  folderName: string;
  displayName: string;
  email: string;
  category: RhCategory;
  categoryLabel: string;
  active: boolean;
  accountStatus: string;
  jobTitle: string | null;
  hireDate: string | null;
  birthDate: string | null;
  socialSecurityNumber: string | null;
  contractType: string | null;
  missingSocialSecurity: boolean;
  missingContractType: boolean;
  missingBirthDate: boolean;
  hasMissingData: boolean;
  medecineNextVisitAt: string | null;
  medecineLastVisitAt: string | null;
  habilitationsCount: number;
  formationsCount: number;
  updatedAt: string | null;
  metaFound: boolean;
  metaError?: string;
};

export type RhSkillBucket = {
  label: string;
  kind: "habilitation" | "formation";
  count: number;
  people: Array<{ id: string; displayName: string; folderName: string }>;
};

export type RhRegistrePayload = {
  basePath: string;
  generatedAt: string;
  medecineIntervalYears: number;
  rows: RhRegistreRow[];
  alerts: RhRegistreAlert[];
  skills: RhSkillBucket[];
  counts: {
    staff: number;
    metaLoaded: number;
    metaMissing: number;
    withMissingData: number;
    alertsHigh: number;
    alertsTotal: number;
  };
};
