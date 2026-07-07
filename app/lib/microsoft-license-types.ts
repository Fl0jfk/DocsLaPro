export type MicrosoftLicenseType = "A3" | "A1";

export type MicrosoftLicensePerson = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobRole: string;
  licenseType: MicrosoftLicenseType;
};

export type MicrosoftLicenseRequest = {
  version: 1;
  submittedAt: string;
  submittedBy?: string;
  establishmentName?: string;
  people: MicrosoftLicensePerson[];
  notes?: string;
};

export const MICROSOFT_LICENSE_ONBOARDING = {
  title: "Licences Microsoft 365 Education",
  intro:
    "Scola provisionne vos licences via le programme Microsoft Partner (CSP éducation). Voici ce qui est inclus dans votre abonnement :",
  bullets: [
    "Jusqu'à 10 licences M365 Education A3 pour les référents administratif, comptabilité et direction.",
    "Licences A1 illimitées pour les enseignants (Word, Excel, PowerPoint en ligne).",
    "Attribution sous 5 à 10 jours ouvrés après validation de la liste par notre revendeur CSP.",
  ],
  a3Hint: "Réservé aux postes admin / compta / référents (max. 10).",
  a1Hint: "Pour tous les enseignants — sans limite de volume.",
} as const;

export const MAX_A3_LICENSES = 10;
