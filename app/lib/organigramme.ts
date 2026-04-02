import { SCHOOL } from "@/app/lib/school";

/** Une fiche personne — complétez les noms, photos et missions dans ce fichier. */
export type OrganigramPerson = {
  id: string;
  firstName?: string;
  lastName?: string;
  role: string;
  photoUrl?: string | null;
  email?: string;
  missions: string[];
};

export type OrganigramBlock = {
  id: string;
  title: string;
  description?: string;
  people: OrganigramPerson[];
};

export type OrganigramPole = {
  id: string;
  label: string;
  blocks: OrganigramBlock[];
};

export const ORGANIGRAM_DIRECTORS: OrganigramPerson[] = [
  {
    id: "dir-ecole",
    firstName: "Elise",
    lastName: "PLANTEC",
    role: "Directrice de l'école",
    email: SCHOOL.ecole.emailHref.replace(/^mailto:/, ""),
    missions: [
      "Pilotage pédagogique et éducatif de l'école (maternelle & élémentaire).",
      "Coordination avec l'OGEC, les familles et les services. ",
      "Vis-à-vis institutionnel de l'établissement pour le cycle concerné. ",
    ],
  },
  {
    id: "dir-college",
    firstName: "Anne-Sophie",
    lastName: "DUMOUCHEL",
    role: "Directrice du collège",
    email: SCHOOL.college.emailHref.replace(/^mailto:/, ""),
    missions: [
      "Pilotage du collège et du projet d'établissement. ",
      "Accompagnement des équipes et des élèves sur le cycle 3 et 4. ",
    ],
  },
  {
    id: "dir-lycee",
    firstName: "Anne-Marie",
    lastName: "DONA",
    role: "Directrice du lycée",
    email: SCHOOL.lycee.emailHref.replace(/^mailto:/, ""),
    missions: [
      "Pilotage du lycée (2nde, 1re, Terminale). ",
      "Coordination lors de projets groupe (plusieurs cycles) avec les autres directions. ",
    ],
  },
];

export const ORGANIGRAM_ADMIN: OrganigramBlock = {
  id: "admin-transverse",
  title: "Administration & gestion transverse",
  description:
    "Missions larges : secrétariats, relations rectorat, remplacements, inscriptions, communication, outils numériques, etc. Les intitulés ci-dessous sont des exemples à personnaliser.",
  people: [
    {
      id: "admin-1",
      firstName: "Pauline",
      lastName: "LEBLOND",
      role: "Gestion administrative & secrétariat école",
      missions: [
        "Inscriptions et réinscriptions des élèves. ",
        "Secrétariat de cycle et suivi des dossiers élèves. ",
        "Sorties / autorisations de sortie, organisation de transports pour sorties scolaires. ",
        "Appui à la communication de l'établissement. ",
        "Veille et outils numériques (plateformes, projet SI). ",
      ],
    },
    {
      id: "admin-2",
      firstName: "Sarah",
      lastName: "VILLIER",
      role: "Secrétariat collège & gestion des équipes et rectorat",
      missions: [
        "Interface avec le rectorat (contractuels, paiements, dossiers administratifs enseignants). ",
        "Organisation des remplacements et lien avec la direction du collège. ",
        "Accueil des familles et gestion courante du secrétariat collège. ",
      ],
    },
    {
      id: "admin-3",
      firstName: "Florian",
      lastName: "HACQUEVILLE-MATHI",
      role: "Adjoint·e administratif·ve / pôle accompagnement",
      missions: [
        "À compléter selon la fiche de poste réelle. ",
      ],
    },
  ],
};

export const ORGANIGRAM_ACCOUNTING: OrganigramBlock = {
  id: "comptabilite",
  title: "Comptabilité & gestion financière",
  description: "Trois profils complémentaires — regroupés pour la lisibilité de l'organigramme. ",
  people: [
    {
      id: "compta-1",
      role: "Comptabilité — gestion courante & fournisseurs",
      missions: ["Suivi des factures et règlements. ", "Interfaces avec les services de l'établissement. "],
    },
    {
      id: "compta-2",
      role: "Comptabilité — budget & analyse",
      missions: ["Suivi budgétaire. ", "Tableaux de pilotage pour la direction et l'OGEC. "],
    },
    {
      id: "compta-3",
      role: "Comptabilité — paie & dossiers sociaux",
      missions: ["Déclarations et liens avec les organismes. ", "À préciser selon l'organisation réelle. "],
    },
  ],
};

/** Accueil / standard : bloc volontairement isolé (pas rattaché au pôle santé). */
export const ORGANIGRAM_RECEPTION: OrganigramBlock = {
  id: "accueil-standard",
  title: "Accueil & standard téléphonique",
  description:
    "Représentation à part : premier contact téléphonique et orientation vers les services.",
  people: [
    {
      id: "standard",
      role: "Standard & accueil téléphonique",
      missions: [
        "Orientation des appels vers les bons interlocuteurs. ",
        "Premier contact avec les familles et partenaires. ",
      ],
    },
  ],
};

/** Pôle santé : infirmière, psychologue, et emplacements pour intervenant·e·s futur·e·s. */
export const ORGANIGRAM_HEALTH: OrganigramBlock = {
  id: "pole-sante",
  title: "Pôle santé & accompagnement",
  description:
    "Professionnels de santé et spécialistes auprès des élèves. D'autres profils (ergothérapie, etc.) pourront compléter ce pôle.",
  people: [
    {
      id: "infirmiere",
      role: "Infirmière scolaire",
      missions: [
        "Accueil des élèves, soins, prévention et liaison avec les familles. ",
        "Allègement du service de vie scolaire sur le volet santé au lycée. ",
      ],
    },
    {
      id: "psychologue",
      role: "Psychologue scolaire",
      missions: [
        "Accompagnement psychologique des élèves et appui aux équipes. ",
        "Liaison avec les familles et les partenaires extérieurs selon les protocoles. ",
      ],
    },
    {
      id: "sante-extension",
      role: "Intervenant·e spécialisé·e (ex. ergothérapie, orthophonie…)",
      missions: [
        "Fiche réservée : à activer lorsque la convention ou le poste sera confirmé. ",
      ],
    },
  ],
};

/** Pôle maintenance : deux agent·e·s (missions à adapter dans ce fichier). */
export const ORGANIGRAM_MAINTENANCE: OrganigramBlock = {
  id: "pole-maintenance",
  title: "Pôle maintenance & bâtiments",
  description:
    "Entretien des locaux, suivi des interventions et lien avec les prestataires. Complétez les noms et le détail des missions ci-dessous.",
  people: [
    {
      id: "maint-1",
      role: "Agent·e d'entretien / maintenance — poste 1",
      missions: [
        "Entretien courant des locaux et des espaces communs. ",
        "Traitement des demandes via la plateforme de signalement maintenance. ",
        "À compléter : périmètre précis (électricité, plomberie, espaces verts, etc.). ",
      ],
    },
    {
      id: "maint-2",
      role: "Agent·e d'entretien / maintenance — poste 2",
      missions: [
        "Appui aux interventions et suivi des petits travaux. ",
        "Coordination avec la direction pour les urgences et la sécurité des biens. ",
        "À compléter : astreinte, clés, fournitures, liaisons externes. ",
      ],
    },
  ],
};

/** Pôles éducatifs : une colonne par cycle pour garder le CPE et l'équipe visibles. */
export const ORGANIGRAM_POLES: OrganigramPole[] = [
  {
    id: "pole-ecole",
    label: SCHOOL.ecole.label,
    blocks: [
      {
        id: "vs-ecole",
        title: "Vie scolaire & accompagnement",
        people: [
          {
            id: "cfe-ecole",
            role: "CPE (référent vie scolaire)",
            missions: ["Suivi des élèves, liaison familles–école. ", "À compléter. "],
          },
          {
            id: "vs-ecole-2",
            role: "Membre de l'équipe école",
            missions: ["À compléter. "],
          },
        ],
      },
    ],
  },
  {
    id: "pole-college",
    label: SCHOOL.college.label,
    blocks: [
      {
        id: "vs-college",
        title: "Vie scolaire — équipe & CPE",
        description: "Plusieurs CPE selon l'organisation du collège. ",
        people: [
          { id: "cfe-col-1", role: "CPE (collège) — poste 1", missions: ["À compléter. "] },
          { id: "cfe-col-2", role: "CPE (collège) — poste 2", missions: ["À compléter. "] },
          { id: "cfe-col-3", role: "CPE (collège) — poste 3", missions: ["À compléter. "] },
          { id: "vs-col-assist", role: "Assistant·e éducation / équipe vie scolaire", missions: ["À compléter. "] },
        ],
      },
    ],
  },
  {
    id: "pole-lycee",
    label: SCHOOL.lycee.label,
    blocks: [
      {
        id: "vs-lycee",
        title: "Vie scolaire lycée",
        people: [
          {
            id: "cfe-lycee",
            role: "CPE (lycée) — chef·fe du travail éducatif",
            missions: ["Suivi disciplinaire et éducatif. ", "Accompagnement des élèves et des familles. "],
          },
          {
            id: "vs-lycee-2",
            role: "Membre équipe vie scolaire",
            missions: ["À compléter. "],
          },
          {
            id: "vs-lycee-3",
            role: "Membre équipe vie scolaire",
            missions: ["À compléter. "],
          },
          {
            id: "vs-lycee-4",
            role: "Membre équipe vie scolaire (optionnel)",
            missions: ["À compléter ou retirer la ligne dans organigramme.ts. "],
          },
        ],
      },
    ],
  },
];

export const ORGANIGRAM_PASTORAL: OrganigramBlock = {
  id: "pastorale",
  title: "Pastorale",
  description: "Accompagnement spirituel et projet pastoral du groupe scolaire. ",
  people: [
    { id: "past-1", role: "Référent·e pastorale", missions: ["À compléter. "] },
    { id: "past-2", role: "Membre équipe pastorale", missions: ["À compléter. "] },
    { id: "past-3", role: "Aumônier / intervenant·e (si applicable)", missions: ["À compléter. "] },
  ],
};

/** OGEC : employeur du personnel de fonctionnement (administration, comptabilité, services…), distinct de la tutelle. */
export const ORGANIGRAM_OGEC: OrganigramBlock = {
  id: "ogec",
  title: "OGEC",
  description:
    "Organisme de gestion de l'enseignement catholique : employeur du personnel administratif, de comptabilité et des équipes de service rattachées à l'OGEC. Pour les enseignants, le cadre employeur peut différer selon le statut — à préciser en interne si besoin.",
  people: [
    {
      id: "ogec-1",
      role: "OGEC — contact / direction (à compléter)",
      missions: [
        "Ressources humaines et administration du personnel relevant de l'OGEC. ",
        "Contrats, gestion administrative et lien avec la direction d'établissement. ",
        "À compléter : nom et coordonnées. ",
      ],
    },
    {
      id: "ogec-2",
      role: "OGEC — contact complémentaire",
      missions: ["À compléter selon votre organisation. "],
    },
  ],
};

/** Tutelle de la congrégation : instance distincte de l'OGEC (lien canonique / gouvernance). */
export const ORGANIGRAM_TUTELLE: OrganigramBlock = {
  id: "tutelle",
  title: "Tutelle de la congrégation",
  description:
    "La tutelle relève de la congrégation : ce n'est ni l'OGEC ni un employeur au même titre. Elle porte la mission et la vigilance sur le projet spirituel et la gouvernance propre à la famille religieuse.",
  people: [
    {
      id: "tutelle-1",
      role: "Tutelle — référent·e congrégationnel·le",
      missions: [
        "Lien avec la tutelle religieuse et les instances de la congrégation. ",
        "À compléter : nom et coordonnées. ",
      ],
    },
  ],
};
