export type RentreeLevel = "ecole" | "college" | "lycee";

export type RentreeLinkItem = {
  title: string;
  description?: string;
  href: string;
  /** "pdf" pour afficher une pastille, "link" pour un lien externe */
  kind?: "pdf" | "link";
};

export type RentreeSection = {
  title: string;
  items: RentreeLinkItem[];
};

export type RentreeLinksByLevel = {
  level: RentreeLevel;
  label: string;
  accent: "yellow" | "sky" | "pink";
  sections: RentreeSection[];
};

/**
 * Documents publics pour les familles.
 *
 * Recommandé : déposer les fichiers dans `public/documents/rentree/...`
 * afin d'avoir des URLs stables en `/documents/rentree/...`.
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
            href: "https://docslaproimage.s3.eu-west-3.amazonaws.com/rentree/Colbert.pdf",
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
            href: "https://docslaproimage.s3.eu-west-3.amazonaws.com/rentree/Colbert.pdf",
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
            description: "Système de location de livres pour les lycéens. Remboursement aux ¾ si restitution en bon état.",
            href: "https://docslaproimage.s3.eu-west-3.amazonaws.com/rentree/Flyer-ARBS.pdf",
            kind: "pdf",
          },
        ],
      },
    ],
  },
];

