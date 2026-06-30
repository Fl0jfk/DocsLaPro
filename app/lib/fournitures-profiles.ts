import type {
  CollegeNiveau,
  EcoleNiveau,
  FournituresProfileMeta,
  FournituresProfileOverrides,
  FournituresSection,
  LyceeOption,
} from "@/app/lib/fournitures-types";
import {
  collegeProfileId,
  ecoleProfileId,
  getCollegeSuppliesLegacy,
  getEcoleSuppliesLegacy,
  getLyceeSuppliesLegacy,
  lyceeProfileId,
} from "@/app/lib/fournitures-engine";
import type { FournituresChild } from "@/app/lib/fournitures-types";

const ECOLE_NIVEAUX: { niveau: EcoleNiveau; label: string }[] = [
  { niveau: "JE1MMEBAYEL", label: "J.E.1 — Mme BAYEL" },
  { niveau: "JE2MMECARTIER", label: "J.E.2 — Mme CARTIER" },
  { niveau: "JE3MMEDOUGHTY", label: "J.E.3 — Mme DOUGHTY" },
  { niveau: "JE4", label: "J.E.4" },
  { niveau: "CP", label: "CP" },
  { niveau: "CE1", label: "CE1" },
  { niveau: "CE2", label: "CE2" },
  { niveau: "CM1", label: "CM1" },
  { niveau: "CM2", label: "CM2" },
];

const COLLEGE_NIVEAUX: { niveau: CollegeNiveau; label: string }[] = [
  { niveau: "6e", label: "6e" },
  { niveau: "5e", label: "5e" },
  { niveau: "4e", label: "4e" },
  { niveau: "3e", label: "3e" },
];

export const FOURNITURES_PROFILES: FournituresProfileMeta[] = [
  ...ECOLE_NIVEAUX.map(({ niveau, label }) => ({
    id: ecoleProfileId(niveau),
    label,
    stage: "ecole" as const,
    group: "École",
    hint: "Liste complète pour cette classe.",
  })),
  ...COLLEGE_NIVEAUX.map(({ niveau, label }) => ({
    id: collegeProfileId(niveau),
    label,
    stage: "college" as const,
    group: "Collège",
    hint: "Liste de base (sans options Latin / OSE / LCE). Les options s'ajoutent automatiquement sur le simulateur.",
  })),
  {
    id: "lycee:2nde",
    label: "2nde",
    stage: "lycee",
    group: "Lycée",
    hint: "Manuels obligatoires et LV2. Section européenne et Latin en option sur le simulateur.",
  },
  {
    id: "lycee:1re-general",
    label: "1re — Général",
    stage: "lycee",
    group: "Lycée",
    hint: "Liste de base (manuels). 3 spécialités obligatoires, section européenne et Latin en option sur le simulateur.",
  },
  {
    id: "lycee:terminale-general",
    label: "Terminale — Général",
    stage: "lycee",
    group: "Lycée",
    hint: "Liste de base (manuels). 2 spécialités obligatoires, section européenne, Latin et options maths en option sur le simulateur.",
  },
  {
    id: "lycee:1re-st2s",
    label: "1re — ST2S",
    stage: "lycee",
    group: "Lycée",
    hint: "Manuels ST2S et LV2 sur le simulateur.",
  },
  {
    id: "lycee:terminale-st2s",
    label: "Terminale — ST2S",
    stage: "lycee",
    group: "Lycée",
    hint: "Manuels ST2S et LV2 sur le simulateur.",
  },
];

function sampleCollege(niveau: CollegeNiveau): Extract<FournituresChild, { stage: "college" }> {
  return {
    id: "sample",
    stage: "college",
    niveau,
    langue: "Allemand",
    optionBilingueAllemand: false,
    optionLatin: false,
    optionOse: false,
    optionLceAnglais: false,
  };
}

function sampleLycee(profileId: string): Extract<FournituresChild, { stage: "lycee" }> {
  const base = {
    id: "sample",
    stage: "lycee" as const,
    langue: "Allemand" as const,
    optionSectionEuropeenne: false,
    latin: false,
    options: [] as LyceeOption[],
  };
  if (profileId === "lycee:2nde") {
    return { ...base, niveau: "2nde", track: "General", specialites: [] };
  }
  if (profileId === "lycee:1re-general") {
    return { ...base, niveau: "1re", track: "General", specialites: ["Maths"] };
  }
  if (profileId === "lycee:terminale-general") {
    return {
      ...base,
      niveau: "Terminale",
      track: "General",
      specialites: ["Maths", "Physique-Chimie"],
    };
  }
  if (profileId === "lycee:1re-st2s") {
    return { ...base, niveau: "1re", track: "ST2S", specialites: [] };
  }
  return { ...base, niveau: "Terminale", track: "ST2S", specialites: [] };
}

export function getDefaultProfileSections(profileId: string): FournituresSection[] {
  const ecole = ECOLE_NIVEAUX.find((e) => ecoleProfileId(e.niveau) === profileId);
  if (ecole) return getEcoleSuppliesLegacy(ecole.niveau);

  const college = COLLEGE_NIVEAUX.find((c) => collegeProfileId(c.niveau) === profileId);
  if (college) return getCollegeSuppliesLegacy(sampleCollege(college.niveau));

  if (profileId.startsWith("lycee:")) {
    const child = sampleLycee(profileId);
    if (lyceeProfileId(child) === profileId) {
      return getLyceeSuppliesLegacy(child);
    }
    return getLyceeSuppliesLegacy(child);
  }

  return [];
}

export function getMergedProfileSections(
  profileId: string,
  profiles: FournituresProfileOverrides,
): FournituresSection[] {
  const custom = profiles[profileId];
  if (custom && custom.length > 0) {
    return custom.map((s) => ({ title: s.title, items: [...s.items] }));
  }
  return getDefaultProfileSections(profileId).map((s) => ({ title: s.title, items: [...s.items] }));
}

export function profileHasOverride(profileId: string, profiles: FournituresProfileOverrides): boolean {
  return Boolean(profiles[profileId]?.length);
}
