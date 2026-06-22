/** Types partagés — page publique rentrée et configuration boîte à outils. */

export type RentreeLevel = "ecole" | "college" | "lycee";

export type RentreeAccent =
  | "yellow"
  | "sky"
  | "pink"
  | "green"
  | "blue"
  | "rose"
  | "violet"
  | "amber"
  | "teal";

export const RENTREE_ACCENT_OPTIONS: { id: RentreeAccent; label: string }[] = [
  { id: "yellow", label: "Jaune (école)" },
  { id: "sky", label: "Bleu ciel (collège)" },
  { id: "pink", label: "Rose (lycée)" },
  { id: "green", label: "Vert" },
  { id: "blue", label: "Bleu" },
  { id: "rose", label: "Rose vif" },
  { id: "violet", label: "Violet" },
  { id: "amber", label: "Ambre" },
  { id: "teal", label: "Bleu-vert" },
];

export type RentreeLinkItem = {
  title: string;
  description?: string;
  href: string;
  kind?: "pdf" | "link";
};

export type RentreeSection = {
  title: string;
  items: RentreeLinkItem[];
};

/** Page rentrée liée à un établissement (paramètres généraux). */
export type RentreeEstablishmentPage = {
  establishmentId: string;
  label: string;
  accent: RentreeAccent;
  sections: RentreeSection[];
};

/** Ancien modèle par niveau — conservé pour migration. */
export type RentreeLinksByLevel = {
  level: RentreeLevel;
  label: string;
  accent: RentreeAccent;
  sections: RentreeSection[];
};
