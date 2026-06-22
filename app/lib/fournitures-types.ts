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
  | "Sc.Phy-Sc.Info";
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
      anglaisEuro?: boolean;
      specialites: LyceeSpecialite[];
      latin: boolean;
      options: LyceeOption[];
    };

/** Overrides par identifiant de profil (classe ou rubrique). */
export type FournituresProfileOverrides = Record<string, FournituresSection[]>;

export type FournituresToolConfig = {
  enabled: boolean;
  title: string;
  schoolYear: string;
  colbertPdfUrl?: string;
  arbsPdfUrl?: string;
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
  colbertPdfUrl: "",
  arbsPdfUrl: "",
  profiles: {},
};
