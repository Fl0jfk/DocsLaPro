export type FournituresSection = { title: string; items: string[] };

export type FournituresStage = "ecole" | "college" | "lycee";

export type EcoleNiveau =
  | "JE1MMEBAYEL"
  | "JE2MMECARTIER"
  | "JE3MMEDOUGHTY"
  | "JE4"
  | "CP"
  | "CE1"
  | "CE2"
  | "CM1"
  | "CM2";

export type CollegeNiveau = "6e" | "5e" | "4e" | "3e";
export type LyceeNiveau = "2nde" | "1re" | "Terminale";
export type LyceeTrack = "General" | "ST2S";
export type LangueSeconde = "Espagnol" | "Allemand";
export type LyceeSpecialite =
  | "Maths"
  | "Physique-Chimie"
  | "SVT"
  | "SES"
  | "HG-GEO-GEOPOL"
  | "HLP"
  | "LLCE"
  | "Sciences-de-l-Ingenieur";

export const LYCEE_SPEC_LABELS: Record<LyceeSpecialite, string> = {
  Maths: "Maths",
  "Physique-Chimie": "Physique-Chimie",
  SVT: "SVT",
  SES: "SES",
  "HG-GEO-GEOPOL": "Histoire-Géographie-Géopolitique",
  HLP: "Humanités, littérature et philosophie",
  LLCE: "Langue, littérature et culture étrangère",
  "Sciences-de-l-Ingenieur": "Sciences de l'ingénieur",
};

/** Spécialités proposées en 1re générale (3 obligatoires). */
export const LYCEE_SPECS_1RE_GENERAL: LyceeSpecialite[] = [
  "Maths",
  "Physique-Chimie",
  "SVT",
  "SES",
  "HG-GEO-GEOPOL",
  "HLP",
  "LLCE",
  "Sciences-de-l-Ingenieur",
];

/** Spécialités proposées en Terminale générale (2 obligatoires). */
export const LYCEE_SPECS_TERMINALE_GENERAL: LyceeSpecialite[] = [
  "SES",
  "SVT",
  "HG-GEO-GEOPOL",
  "Maths",
  "Physique-Chimie",
  "Sciences-de-l-Ingenieur",
];
export type LyceeOption = "Maths Complémentaires" | "Maths Expertes";

export type FournituresChild =
  | {
      id: string;
      stage: "ecole";
      niveau: EcoleNiveau;
    }
  | {
      id: string;
      stage: "college";
      niveau: CollegeNiveau;
      langue: LangueSeconde;
      optionBilingueAllemand: boolean;
      optionLatin: boolean;
      optionOse: boolean;
      optionLceAnglais: boolean;
    }
  | {
      id: string;
      stage: "lycee";
      niveau: LyceeNiveau;
      track: LyceeTrack;
      langue: LangueSeconde;
      /** Section européenne (= anglais section Europe) — option, manuels dédiés. */
      optionSectionEuropeenne: boolean;
      specialites: LyceeSpecialite[];
      latin: boolean;
      options: LyceeOption[];
    };

/** Overrides par identifiant de profil (classe ou rubrique). */
export type FournituresProfileOverrides = Record<string, FournituresSection[]>;

/** Lien partenaire optionnel affiché sur le simulateur pour un cycle. */
export type FournituresPartnerLink = {
  url: string;
  /** Libellé du badge (ex. Colbert, ARBS). Défaut : « Partenaire ». */
  label?: string;
};

export type FournituresStagePartnerLinks = Partial<Record<FournituresStage, FournituresPartnerLink>>;

export type FournituresToolConfig = {
  enabled: boolean;
  title: string;
  schoolYear: string;
  /** Liens partenaires indépendants par cycle (école, collège, lycée). */
  stageLinks: FournituresStagePartnerLinks;
  /** Listes éditables — clé = profileId (ex. ecole:CP, college:5e). */
  profiles: FournituresProfileOverrides;
};

export type FournituresProfileMeta = {
  id: string;
  label: string;
  stage: FournituresStage;
  group: string;
  hint?: string;
};

export const DEFAULT_FOURNITURES_CONFIG: Omit<FournituresToolConfig, "enabled"> = {
  title: "Simulateur fournitures",
  schoolYear: "2026 / 2027",
  stageLinks: {},
  profiles: {},
};
