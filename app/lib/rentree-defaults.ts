import type { RentreeEstablishmentPage, RentreeLinksByLevel, RentreeSection } from "@/app/lib/rentree-types";

export const DEFAULT_RENTREE_SECTIONS: RentreeSection[] = [
  {
    title: "Calendrier",
    items: [],
  },
  {
    title: "Documents",
    items: [],
  },
];

/**
 * Documents publics par défaut (La Providence — migration legacy).
 * Les nouveaux tenants démarrent avec des sections vides synchronisées aux établissements.
 */
export const RENTREE_LINKS: RentreeLinksByLevel[] = [
  {
    level: "ecole",
    label: "École",
    accent: "yellow",
    sections: [
      {
        title: "Calendrier",
        items: [
          {
            title: "Circulaire",
            description: "Calendrier scolaire, jours fériés et fermetures spécifiques à l'établissement.",
            href: "/documents/rentree/ecole/calendrier-annee.pdf",
            kind: "pdf",
          },
        ],
      },
      {
        title: "Infos pratiques",
        items: [
          {
            title: "Organisation de la rentrée",
            description: "Horaires, accueil, contacts, informations clés.",
            href: "/documents/rentree/ecole/rentree-infos.pdf",
            kind: "pdf",
          },
          {
            title: "Fournitures (simulateur)",
            description: "Simuler / imprimer la liste selon la classe.",
            href: "/simulateurFournitures",
            kind: "link",
          },
          {
            title: "Librairie Colbert – Commander les fournitures",
            description: "Commande groupée en partenariat avec l'APEL de l'établissement.",
            href: "https://scola-image.s3.eu-west-3.amazonaws.com/rentree/Colbert.pdf",
            kind: "pdf",
          },
        ],
      },
    ],
  },
  {
    level: "college",
    label: "Collège",
    accent: "sky",
    sections: [
      {
        title: "Calendrier",
        items: [
          {
            title: "Circulaire",
            description: "Calendrier scolaire, jours fériés et fermetures spécifiques à l'établissement.",
            href: "/documents/rentree/college/calendrier-annee.pdf",
            kind: "pdf",
          },
        ],
      },
      {
        title: "Documents",
        items: [
          {
            title: "Organisation de la rentrée",
            description: "Horaires, remise des manuels, consignes.",
            href: "/documents/rentree/college/rentree-infos.pdf",
            kind: "pdf",
          },
          {
            title: "Fournitures (simulateur)",
            description: "Simuler / imprimer la liste selon la classe.",
            href: "/simulateurFournitures",
            kind: "link",
          },
          {
            title: "Librairie Colbert – Commander les fournitures",
            description: "Commande groupée en partenariat avec l'APEL de l'établissement.",
            href: "https://scola-image.s3.eu-west-3.amazonaws.com/rentree/Colbert.pdf",
            kind: "pdf",
          },
        ],
      },
    ],
  },
  {
    level: "lycee",
    label: "Lycée",
    accent: "pink",
    sections: [
      {
        title: "Calendrier",
        items: [
          {
            title: "Circulaire",
            description: "Calendrier scolaire, jours fériés et fermetures spécifiques à l'établissement.",
            href: "/documents/rentree/lycee/calendrier-annee.pdf",
            kind: "pdf",
          },
        ],
      },
      {
        title: "Documents",
        items: [
          {
            title: "Organisation de la rentrée",
            description: "Horaires, informations élèves et familles.",
            href: "/documents/rentree/lycee/rentree-infos.pdf",
            kind: "pdf",
          },
          {
            title: "Fournitures (simulateur)",
            description: "Simuler / imprimer la liste selon la classe.",
            href: "/simulateurFournitures",
            kind: "link",
          },
          {
            title: "ARBS – Location de manuels scolaires",
            description: "Système de location de livres pour les lycéens.",
            href: "https://scola-image.s3.eu-west-3.amazonaws.com/rentree/Flyer-ARBS.pdf",
            kind: "pdf",
          },
          {
            title: "Atout Normandie – Subvention sur les manuels",
            description: "Dispositif de la Région Normandie.",
            href: "https://scola-image.s3.eu-west-3.amazonaws.com/rentree/Atouts+normandie.pdf",
            kind: "pdf",
          },
        ],
      },
    ],
  },
];

export function emptyRentreePage(establishmentId: string, label: string): RentreeEstablishmentPage {
  return {
    establishmentId,
    label,
    accent: "violet",
    sections: DEFAULT_RENTREE_SECTIONS.map((s) => ({ ...s, items: [...s.items] })),
  };
}
