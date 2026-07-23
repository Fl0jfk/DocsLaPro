/** Contenu éditorial du site commercial ScolIA — School + IA. */
export const MARKETING = {
  productName: "ScolIA",
  productNameExplanation: "School + IA",
  tagline: "Intranet tout-en-un pour établissements scolaires",
  contactEmail: process.env.NEXT_PUBLIC_SCOLA_CONTACT_EMAIL?.trim() || "contact@scolia.fr",
  contactCtaLabel: "Nous contacter",
  pricingPromise: "Trois forfaits clairs selon votre effectif — tout inclus, licences Microsoft comprises.",

  legal: {
    companyName: process.env.NEXT_PUBLIC_SCOLA_LEGAL_COMPANY?.trim() || "[Raison sociale à compléter]",
    legalForm: "SAS",
    shareCapital: "[Capital social]",
    address: "[Adresse du siège social]",
    rcs: "[Ville] RCS [n°]",
    siret: "[SIRET]",
    vat: "[TVA intracommunautaire]",
    publisherName: "[Directeur / directrice de la publication]",
    hostName: "Scaleway",
    hostRegion: "France — Paris (fr-par)",
    hostAddress: "Scaleway SAS, 8 rue de la Ville l’Évêque, 75008 Paris",
    dpoEmail: process.env.NEXT_PUBLIC_SCOLA_DPO_EMAIL?.trim() || "dpo@scolia.fr",
  },
} as const;

export const POSITIONING = {
  headline: "Pas un ENT de plus",
  text: "Les ENT classiques excellent sur la communication scolaire. ScolIA va plus loin : workflows métier, tri documentaire, sorties, salles et RH — tout en un, pour gagner du temps au quotidien.",
} as const;

export const BENEFITS = [
  {
    title: "Tout en un, sans surprise",
    desc: "Documents élèves, sorties, salles, RH, internat, cloud personnel et demandes — un seul abonnement, pas de module en add-on.",
  },
  {
    title: "Gain de temps concret",
    desc: "Tri automatique des documents élèves, parcours de sorties assistés par IA, RH et demandes tracées de bout en bout.",
  },
  {
    title: "Souveraineté maximisée",
    desc: "Hébergement Scaleway, IA & OCR Mistral, paiements EasyTransac — made in France. Microsoft Éducation et Clerk en complément.",
  },
] as const;

/** Quatre piliers produit. */
export const KEY_PILLARS = [
  {
    title: "Documents élèves",
    desc: "OCR + IA Mistral : segmentation, matching élève/classe, rangement automatique vers OneDrive.",
    accent: "#2F6B4A",
  },
  {
    title: "Sorties scolaires",
    desc: "Parcours complet de A à Z — validations, devis bus, e-mails et suivi.",
    accent: "#234B73",
  },
  {
    title: "Réservation de salles",
    desc: "Grille claire, matières en couleurs, récurrence — le planning sans tableur.",
    accent: "#4C3D7A",
  },
  {
    title: "RH",
    desc: "Dossiers personnel, absences, arrivées et signatures — l'administratif RH centralisé.",
    accent: "#6B3A4A",
  },
] as const;

/** Le reste de la plateforme (hors les 4 piliers). */
export const REST_CAPABILITIES = [
  {
    title: "Internat",
    desc: "Vie de l'internat, demandes et suivi dédiés dans le même espace.",
  },
  {
    title: "Cloud personnel",
    desc: "Espace documents pour le personnel — dossiers partagés et fichiers utiles au quotidien.",
  },
  {
    title: "Demandes & corbeilles",
    desc: "Dépôt, routage et suivi des tickets par service (administratif, maintenance, compta…).",
  },
] as const;

export const PLATFORM_CAPABILITIES = [
  { title: "Documents élèves (IA)", desc: "OCR Mistral, découpage et rangement automatique." },
  { title: "Sorties scolaires", desc: "Workflow complet, devis et validations." },
  { title: "Réservation de salles", desc: "Planning partagé sans tableur." },
  { title: "RH", desc: "Dossiers, absences, arrivées et signatures." },
  { title: "Internat", desc: "Suivi et demandes de la vie d'internat." },
  { title: "Cloud personnel", desc: "Documents et partages pour le personnel." },
  { title: "Demandes", desc: "Tickets et corbeilles par service." },
  { title: "Licences Microsoft", desc: "A1 / A3 Éducation incluses selon le forfait." },
] as const;

export const AUDIENCES = [
  {
    title: "Direction & OGEC",
    desc: "Pilotage, validations, sorties, RH et vision d'ensemble.",
  },
  {
    title: "Administratif & comptabilité",
    desc: "Corbeilles, dossiers, suivi financier et traitements du quotidien.",
  },
  {
    title: "Maintenance",
    desc: "Demandes techniques, tickets et suivi des interventions.",
  },
  {
    title: "Enseignants & vie scolaire",
    desc: "Documents, salles, sorties et absences — bureau ou mobile.",
  },
] as const;

export const PARTNERS = [
  {
    id: "scaleway",
    name: "Scaleway",
    role: "Hébergement",
    detail: "Cloud français — application et données à Paris (fr-par).",
    logoPath: "/partners/scaleway.svg",
    sovereign: true,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    role: "IA & OCR",
    detail: "Assistant, analyse documentaire et OCR — plus de Textract / AWS.",
    logoPath: "/partners/mistral.svg",
    sovereign: true,
  },
  {
    id: "easytransac",
    name: "EasyTransac",
    role: "Paiement",
    detail: "Encaissement des mensualités — startup française.",
    logoPath: "/partners/easytransac.png",
    sovereign: true,
  },
  {
    id: "microsoft",
    name: "Microsoft Éducation",
    role: "Licences bureautique",
    detail: "Membre du Partner Program — packs A1 / A3 selon forfait.",
    logoPath: "/partners/microsoft.svg",
    sovereign: false,
  },
  {
    id: "clerk",
    name: "Clerk",
    role: "Authentification",
    detail: "Connexion sécurisée des comptes établissement.",
    logoPath: "/partners/clerk.svg",
    sovereign: false,
  },
] as const;

/** Message souveraineté — page d'accueil & tarifs. */
export const SOVEREIGNTY = {
  title: "Souveraineté numérique",
  intro:
    "ScolIA maximise le made in France : hébergement Scaleway, IA et OCR Mistral, paiements EasyTransac. Hors France, uniquement Microsoft Éducation (licences) et Clerk (authentification).",
  bullets: [
    "Hébergement 100 % Scaleway (France) — plus d'AWS.",
    "IA + OCR via Mistral — plus de Textract.",
    "Mensualités via EasyTransac, startup française.",
    "Microsoft pour les licences Éducation · Clerk pour l'auth.",
  ],
} as const;

export const RGPD_COMPACT = {
  title: "Données & confiance",
  summary:
    "ScolIA organise vos workflows sans devenir un coffre-fort généraliste. Hébergement Scaleway en France. IA et OCR Mistral. Paiements EasyTransac. Licences Microsoft Éducation dans l'abonnement.",
  bullets: [
    "Les dossiers élèves sensibles rejoignent vos espaces Microsoft — vous restez maître de vos données.",
    "Hébergement France (Scaleway) · IA & OCR français (Mistral) · paiement français (EasyTransac).",
    "Licences Microsoft A1 / A3 Éducation selon forfait · authentification Clerk.",
  ],
} as const;

export const RGPD_HIGHLIGHTS = {
  title: "Données & RGPD",
  intro:
    "ScolIA est une plateforme de traitement et d'orchestration des workflows. L'établissement conserve la responsabilité sur ses données sensibles.",
  processingModel:
    "ScolIA fait circuler, valider et tracer les démarches. Pour les dossiers élèves et contenus sensibles, des workflows orientent le dépôt vers Microsoft 365. L'établissement reste responsable de traitement.",
  microsoftPartner:
    "ScolIA est membre du Microsoft Partner Program : licences A1 et A3 Éducation incluses dans chaque forfait, pour équiper direction, administratif et enseignants sans passer par des licences Business.",
  points: [
    {
      label: "Traitement, pas archivage",
      detail: "Workflows métier plutôt qu'une plateforme de stockage généraliste.",
    },
    {
      label: "Hébergement en France",
      detail: "Infrastructure Scaleway uniquement, région Paris (fr-par) — plus d'AWS.",
    },
    {
      label: "IA & OCR français",
      detail: "Mistral AI pour l'assistant, l'aide documentaire et l'OCR (remplace Textract).",
    },
    {
      label: "Paiement français",
      detail: "EasyTransac pour les mensualités d'abonnement.",
    },
    {
      label: "Microsoft Éducation",
      detail: "Licences A1 / A3 incluses selon le forfait.",
    },
    {
      label: "Authentification",
      detail: "Clerk pour la connexion des comptes.",
    },
  ],
  reassurance:
    "Droits RGPD exercables auprès de notre référent données. Détails des sous-traitants dans les mentions légales.",
} as const;

export const TRUST_ITEMS = RGPD_COMPACT.bullets.map((detail, i) => ({
  label: ["Vos données", "Stack française", "Microsoft & Clerk"][i] ?? "Confiance",
  detail,
}));

export const STATS = [
  { value: "4", label: "piliers métier" },
  { value: "3", label: "forfaits clairs" },
  { value: "FR", label: "Scaleway + Mistral" },
  { value: "MS", label: "licences incluses" },
] as const;

export type PricingPlan = {
  id: string;
  name: string;
  /** Libellé effectif (ex. Moins de 500 élèves). */
  audienceLabel: string;
  priceMonthly: number;
  priceLabel: string;
  priceHint: string;
  description: string;
  highlighted?: boolean;
  microsoftA3: number;
  microsoftA1: number;
  features: string[];
};

const BASE_FEATURES = [
  "Les 4 piliers : documents élèves, sorties, salles, RH",
  "Internat, cloud personnel et système de demandes",
  "Assistant IA Mistral (OCR & aide documentaire)",
  "Hébergement France — Scaleway Paris",
  "Personnalisation logo & identité",
  "Mises à jour et accompagnement à la prise en main",
] as const;

export const PRICING_INCLUDED = [
  ...BASE_FEATURES,
  "Licences Microsoft Éducation (A1 / A3) selon forfait",
] as const;

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "essentielle",
    name: "Essentielle",
    audienceLabel: "Moins de 500 élèves",
    priceMonthly: 299,
    priceLabel: "299 € / mois",
    priceHint: "Établissements jusqu'à 499 élèves",
    description: "Toute la plateforme ScolIA, avec un pack Microsoft adapté aux structures de taille moyenne.",
    microsoftA3: 5,
    microsoftA1: 50,
    features: [
      ...BASE_FEATURES,
      "5 licences Microsoft A3 Éducation",
      "50 licences Microsoft A1 Éducation",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    audienceLabel: "500 à 1 000 élèves",
    priceMonthly: 499,
    priceLabel: "499 € / mois",
    priceHint: "Le forfait le plus choisi",
    description: "Pour un collège, un lycée ou un campus de taille importante.",
    highlighted: true,
    microsoftA3: 10,
    microsoftA1: 150,
    features: [
      ...BASE_FEATURES,
      "10 licences Microsoft A3 Éducation",
      "150 licences Microsoft A1 Éducation",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    audienceLabel: "Plus de 1 000 élèves",
    priceMonthly: 699,
    priceLabel: "699 € / mois",
    priceHint: "Grands établissements & groupes scolaires",
    description: "Capacité étendue et pack Microsoft renforcé pour les plus gros effectifs.",
    microsoftA3: 15,
    microsoftA1: 150,
    features: [
      ...BASE_FEATURES,
      "15 licences Microsoft A3 Éducation",
      "150 licences Microsoft A1 Éducation",
    ],
  },
];

export const MICROSOFT_PRICING_NOTE = {
  title: "Licences Microsoft Éducation — inclus",
  eyebrow: "Microsoft Partner Program",
  partnerBadgeLabel: "Membre du Microsoft Partner Program",
  /** Badge officiel : téléchargez-le depuis Partner Center (Logo Builder) → public/partners/microsoft-partner.svg ou .png */
  partnerLogoPath: "/partners/microsoft-partner.svg",
  intro:
    "Fini d'attendre que le prestataire réseau déploie les bonnes licences. Chaque abonnement ScolIA embarque un pack Microsoft Éducation pour équiper direction, administratif et enseignants.",
  partnerNote:
    "ScolIA est membre du Microsoft Partner Program : nous provisionnons vos licences Éducation (A1 / A3) directement dans l'abonnement, via le canal partenaire.",
  bullets: [
    "Licences A3 pour les profils administratifs / direction (Word, Excel, Outlook…).",
    "Licences A1 pour les enseignants (outils Office en ligne).",
    "Volumes selon forfait — sans surcoût de licences Business.",
  ],
  disclaimer:
    "Les volumes A1 / A3 sont ceux indiqués sur chaque forfait. Besoin de licences supplémentaires ? Contactez-nous.",
} as const;

export const PRICING_FAQ = [
  {
    q: "Y a-t-il des modules en option ?",
    a: "Non. Documents élèves, sorties, salles, RH, internat, cloud personnel, demandes et IA — tout est dans l'abonnement.",
  },
  {
    q: "Comment choisir mon forfait ?",
    a: "Selon votre effectif : moins de 500 élèves → 299 €/mois ; 500 à 1 000 → 499 €/mois ; plus de 1 000 → 699 €/mois. Les licences Microsoft sont incluses dans chaque palier.",
  },
  {
    q: "Que contiennent les licences Microsoft ?",
    a: "ScolIA est membre du Microsoft Partner Program. Essentielle : 5× A3 + 50× A1. Standard : 10× A3 + 150× A1. Plus : 15× A3 + 150× A1 — licences Éducation provisionnées via le canal partenaire.",
  },
  {
    q: "Puis-je résilier quand je veux ?",
    a: "Oui, l'abonnement est mensuel, sans engagement longue durée. Contactez-nous pour un devis ou une mise en route.",
  },
  {
    q: "Où sont hébergées les données ?",
    a: "En France, chez Scaleway (Paris) — plus d'AWS. L'IA et l'OCR passent par Mistral (plus de Textract). La bureautique s'appuie sur Microsoft Éducation ; l'authentification sur Clerk.",
  },
  {
    q: "Comment sont réglées les mensualités ?",
    a: "Via EasyTransac, startup française de paiement (PCI DSS). Contactez-nous pour la mise en place de l'abonnement.",
  },
  {
    q: "Comment démarrer ?",
    a: "Écrivez-nous : on confirme le forfait selon votre effectif et on planifie la mise en route avec direction / OGEC.",
  },
] as const;
