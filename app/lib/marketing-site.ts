/** Contenu éditorial du site commercial Scola — à personnaliser pour la prod. */
export const MARKETING = {
  productName: "Scola",
  tagline: "Intranet tout-en-un pour établissements scolaires",
  contactEmail: process.env.NEXT_PUBLIC_SCOLA_CONTACT_EMAIL?.trim() || "contact@scola.app",
  demoCtaLabel: "Demander une démo",
  pricingPromise: "Un abonnement, tout inclus — pas de module en option ni de coffre caché.",
  pricePerStudentMonth: 0.3,

  legal: {
    companyName: process.env.NEXT_PUBLIC_SCOLA_LEGAL_COMPANY?.trim() || "[Raison sociale à compléter]",
    legalForm: "SAS",
    shareCapital: "[Capital social]",
    address: "[Adresse du siège social]",
    rcs: "[Ville] RCS [n°]",
    siret: "[SIRET]",
    vat: "[TVA intracommunautaire]",
    publisherName: "[Directeur / directrice de la publication]",
    hostName: "Amazon Web Services (AWS)",
    hostRegion: "France — région Paris",
    hostAddress: "Amazon Web Services EMEA SARL, 38 avenue John F. Kennedy, L-1855 Luxembourg",
    dpoEmail: process.env.NEXT_PUBLIC_SCOLA_DPO_EMAIL?.trim() || "dpo@scola.app",
  },
} as const;

/** Positionnement vs ENT classique — promesses produit. */
export const POSITIONING = {
  headline: "Pas un ENT de plus",
  text: "Les ENT classiques excellent sur la communication scolaire. Scola va plus loin : workflows métier, tri documentaire, sorties, RH, internat… tout en un, pour gagner du temps au quotidien.",
} as const;

export const BENEFITS = [
  {
    title: "Tout en un, sans surprise",
    desc: "Sorties, absences, salles, RH, internat, documents, demandes… Un seul abonnement, pas de module en add-on.",
  },
  {
    title: "Gain de temps concret",
    desc: "Tri automatique des documents élèves, workflows de sorties assistés par IA, demandes tracées de bout en bout.",
  },
  {
    title: "Votre établissement, votre échelle",
    desc: "Un site unique ou un groupe école–collège–lycège sur le même campus — pas une offre « réseau national ».",
  },
] as const;

/** Workflows phares — différenciation produit. */
export const KEY_WORKFLOWS = [
  {
    title: "Documents élèves",
    desc: "OCR + IA Mistral : segmentation des bulletins, matching élève/classe, renommage et rangement automatique vers OneDrive.",
  },
  {
    title: "Sorties scolaires",
    desc: "Parcours complet de A à Z, avec assistance IA pour préparer, suivre et sécuriser vos projets de sortie.",
  },
  {
    title: "Réservation de salles",
    desc: "Grille intuitive, créneaux partagés, enseignements transversaux — le planning sans tableur.",
  },
  {
    title: "Absences",
    desc: "Déclaration, suivi et validation pour le personnel et les enseignants, depuis le bureau ou le mobile.",
  },
  {
    title: "RH & personnel",
    desc: "Dossiers salariés, signatures, arrivées — l'administratif RH centralisé.",
  },
  {
    title: "Internat",
    desc: "Vie de l'internat, demandes et suivi dédiés au sein du même espace.",
  },
] as const;

/** Capacités incluses dans l'abonnement (liste commerciale). */
export const PLATFORM_CAPABILITIES = [
  { title: "Demandes & corbeilles", desc: "Dépôt, routage et suivi des tickets par service." },
  { title: "Cloud documents", desc: "2 Go par personne (prof & personnel) sur AWS S3 — dossiers partagés et partage de fichiers." },
  { title: "Outils familles", desc: "Liens et simulateurs (tarifs, rentrée…) à destination des parents." },
  { title: "Assistant IA", desc: "Chatbot, OCR et base de connaissances — Mistral AI, français." },
  { title: "Outils saisonniers", desc: "Modules adaptés aux temps forts (portes ouvertes, périodes clés) sur demande." },
  { title: "Accès par rôles", desc: "Direction, enseignants, administratif, parents — et à terme les élèves." },
] as const;

export const AUDIENCES = [
  {
    title: "Direction & OGEC",
    desc: "Pilotage, validation des demandes, sorties, RH et vision transversale.",
  },
  {
    title: "Enseignants & vie scolaire",
    desc: "Absences, salles, sorties, documents — depuis le bureau ou le mobile.",
  },
  {
    title: "Administratif & services",
    desc: "Corbeilles de traitement, RH, internat, tri documentaire automatisé.",
  },
  {
    title: "Familles",
    desc: "Liens dédiés, simulateurs et informations de rentrée — sans surcharger l'ENT.",
  },
] as const;

/** RGPD — version courte page d'accueil (rassurante, pas anxiogène). */
export const RGPD_COMPACT = {
  title: "Données & confiance",
  summary:
    "Scola est une plateforme de traitement : elle organise vos workflows plutôt que d'archiver tout chez nous. Hébergement AWS en France (Paris). IA via Mistral, acteur français.",
  bullets: [
    "Les dossiers sensibles (élèves) suivent des parcours vers vos espaces Microsoft — vous restez maître de vos données.",
    "Hébergement en France · IA française · accès par rôles.",
    "Démarche Microsoft Partner : à terme, licences comprises pour les référents administratif et comptabilité (offre en cours de structuration).",
  ],
} as const;

/** RGPD — version complète (mentions légales). */
export const RGPD_HIGHLIGHTS = {
  title: "Données & RGPD",
  intro:
    "Scola est une plateforme de traitement et d'orchestration des workflows, pas un coffre-fort généraliste. L'établissement conserve la responsabilité sur ses données sensibles.",
  processingModel:
    "Scola fait circuler, valider et tracer les démarches. Pour les dossiers élèves et contenus sensibles, des workflows orientent le dépôt vers les environnements Microsoft 365 de l'établissement. Scola intervient comme outil de traitement ; l'établissement reste responsable de traitement sur ses référentiels.",
  microsoftPartner:
    "Scola s'inscrit dans une démarche Microsoft Partner. L'objectif est d'intégrer à l'abonnement les licences nécessaires pour les référents administratif et comptabilité. Les autres profils feront l'objet d'une offre adaptée (notamment des licences A1 enseignants lorsque disponibles). Ces éléments sont en cours de finalisation contractuelle.",
  points: [
    {
      label: "Traitement, pas archivage",
      detail: "Workflows métier plutôt qu'une plateforme de stockage généraliste.",
    },
    {
      label: "Hébergement en France",
      detail: "Infrastructure AWS région Paris.",
    },
    {
      label: "IA française",
      detail: "Mistral AI pour l'assistant et l'aide documentaire.",
    },
    {
      label: "Microsoft & dossiers élèves",
      detail: "Tri et dépôt vers les espaces licenciés par l'établissement.",
    },
  ],
  reassurance:
    "Droits RGPD exercables auprès de notre référent données. Détails des sous-traitants dans les mentions légales.",
} as const;

export const TRUST_ITEMS = RGPD_COMPACT.bullets.map((detail, i) => ({
  label: ["Vos données, votre gouvernance", "Stack française", "Microsoft Partner"][i] ?? "Confiance",
  detail,
}));

export const STATS = [
  { value: "Tout", label: "inclus dans l'offre" },
  { value: "1", label: "espace unifié" },
  { value: "École → Lycée", label: "groupe scolaire" },
  { value: "Parents", label: "et bientôt élèves" },
] as const;

export type PricingPlan = {
  id: string;
  name: string;
  priceLabel: string;
  priceHint: string;
  description: string;
  highlighted?: boolean;
  features: string[];
};

export const PRICING_INCLUDED = [
  "Cloud documents : 2 Go par personne (prof & personnel, AWS S3)",
  "Tous les workflows : documents élèves IA, sorties, absences, salles, RH, internat",
  "Demandes, corbeilles et assistant IA (Mistral)",
  "Outils familles : liens rentrée, simulateurs",
  "Personnalisation logo & identité",
  "Hébergement France (AWS Paris)",
  "Mises à jour et correctifs inclus",
  "Accompagnement à la prise en main",
  "Pas de module en option — tout est là",
] as const;

/** Encadré Microsoft sur la page tarifs — promesse progressive, pas de Business en attendant CSP. */
export const MICROSOFT_PRICING_NOTE = {
  title: "Microsoft éducation — prochaine étape",
  intro:
    "Dans beaucoup d'établissements, le prestataire réseau gère les licences Microsoft — et déploie rarement les A1 gratuites pour les enseignants. Résultat : des profs sans Word/Excel chez eux, ou qui paient leur propre licence.",
  bullets: [
    "Scola prépare une offre via le Microsoft Partner Program (CSP éducation) — sans recourir à des licences Business coûteuses en attendant.",
    "Objectif : provisionner les licences A1 pour vos enseignants (Word, Excel, PowerPoint en ligne) directement via Scola.",
    "À terme : licences A3 pour les référents administratif et comptabilité intégrées à l'abonnement.",
  ],
  disclaimer:
    "Cette brique Microsoft s'ajoutera à l'offre dès validation du partenariat — elle ne conditionne pas l'abonnement Scola aujourd'hui.",
} as const;

const ALL_INCLUDED_FEATURES = [...PRICING_INCLUDED];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "etablissement",
    name: "Établissement",
    priceLabel: "0,30 € / élève / mois",
    priceHint: "Tout inclus — sans engagement (mensuel)",
    description: "Un site, toute la plateforme Scola. Pas de add-on.",
    highlighted: true,
    features: [...ALL_INCLUDED_FEATURES],
  },
  {
    id: "groupe",
    name: "Groupe scolaire",
    priceLabel: "0,30 € / élève / mois",
    priceHint: "École, collège & lycée — même tarif",
    description: "Même offre tout-en-un pour un campus unifié (ex. école + collège + lycée).",
    features: [
      ...ALL_INCLUDED_FEATURES,
      "Déploiement coordonné école / collège / lycée",
      "Identité et paramétrage partagés sur le groupe",
    ],
  },
];

export const PRICING_FAQ = [
  {
    q: "Y a-t-il des modules en option ?",
    a: "Non. Scola est vendu en tout inclus : sorties, RH, internat, absences, salles, documents, IA, outils familles… Pas de coffre caché ni de supplément par module.",
  },
  {
    q: "Comment est calculé le tarif ?",
    a: "0,30 € par élève et par mois, sur l'effectif de votre établissement ou de votre groupe scolaire (école, collège, lycée). Utilisez le simulateur pour estimer votre budget mensuel ou annuel.",
  },
  {
    q: "Puis-je résilier quand je veux ?",
    a: "Oui, avec l'option mensuelle : pas d'engagement longue durée. L'option annuelle couvre l'année scolaire avec 10 % de réduction pour un paiement unique à la rentrée.",
  },
  {
    q: "Proposez-vous une démonstration ?",
    a: "Oui, une démo guidée et un pilote peuvent être organisés avant souscription.",
  },
  {
    q: "Et les licences Microsoft pour les profs ?",
    a: "Scola prépare une offre via le Microsoft Partner Program : à terme, provisionner les licences A1 éducation pour vos enseignants (Word, Excel en ligne), là où les prestataires réseau ne le font pas. Ce pack Microsoft s'ajoutera sans augmenter le tarif de base dès que le partenariat sera actif — pas de licences Business en attendant.",
  },
  {
    q: "Le paiement en ligne est-il disponible ?",
    a: "Le paiement par carte ou prélèvement via Stripe sera proposé dès l'ouverture de notre structure juridique. En attendant, contactez-nous par e-mail pour souscrire ou demander un devis.",
  },
  {
    q: "Où sont hébergées les données ?",
    a: "En France (AWS, région Paris). Scola traite et organise vos workflows ; les dossiers sensibles rejoignent vos espaces Microsoft selon les parcours configurés.",
  },
] as const;
