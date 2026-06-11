"use client"

import { createContext, useContext, PropsWithChildren } from "react";

export type DashboardTileVariant = "default" | "travels" | "prof-room" | "agent-ia" | "absences" | "personnel-ogec";

export type Categories = {
  id: number;
  name: string;
  link: string;
  img: string;
  description?: string;
  allowedRoles: string[];
  external?: boolean;
  /** Visible uniquement pour org:admin (Clerk Organizations). */
  orgAdminOnly?: boolean;
  /** Tuile enrichie sur le dashboard (live data + actions). */
  variant?: DashboardTileVariant;
};

export type ExternalQuickLink = {
  id: string;
  name: string;
  link: string;
  img: string;
  allowedRoles: string[];
};

type Travels = {
  id: number;
  name: string;
  img: string;
  date: string;
  validated: boolean;
  description: string;
  company: string;
  to: string;
};

type DocumentItem = {
  title: string;
  printable?: string;
  digital?: string;
};

type DocumentCategory = {
  category: string;
  documents: DocumentItem[];
};

type Data = {
  categories: Categories[];
  externalQuickLinks: ExternalQuickLink[];
  travels: Travels[];
  documents: DocumentCategory[];
  error: string | null;
};

const STATIC_DATA: Data = {
  categories: [
    {
      "id": 1,
      "name": "Les documents",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/classeur.jpg",
      "link": "/documents",
      "allowedRoles": ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"],
      "external": false
    },
    {
      "id": 3,
      "name": "Maintenance",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/maintenance.avif",
      "link": "https://providence.dedikam.com/index.php?a=add",
      "allowedRoles": ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"],
      "external": true
    },
    {
      "id": 4,
      "name": "Sortie scolaire",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/transport.avif",
      "link": "/travels",
      "allowedRoles": ["administratif", "comptabilite","direction_ecole","direction_lycee", "professeur","direction_college"],
      "external": false,
      "variant": "travels"
    },
    {
      "id": 5,
      "name": "Création de QR Code",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/qr_code_avec_logo_personnalise.png",
      "link": "/qrcreator",
      "allowedRoles": ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"],
      "external": false
    },
    {
      "id": 8,
      "name": "Réservation de salle",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/reservationsalle.jpg",
      "link": "/prof-room",
      "allowedRoles": ["professeur", "administratif", "direction_college", "direction_ecole", "direction_lycee", "maintenance", "education"],
      "external": false,
      "variant": "prof-room"
    },
    {
      "id": 10,
      "name": "Ajout de documents IA",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/add+Docs.png",
      "link": "/agentIAOCR",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": false,
      "variant": "agent-ia"
    },
    {
      "id": 11,
      "name": "Salons",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/channels.jpg",
      "link": "/channels",
      "allowedRoles": ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"],
      "external": false
    },
    {
      "id": 13,
      "name": "Absences",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/planning+abs.jpg",
      "link": "/absences",
      "allowedRoles": ["professeur", "administratif", "direction_ecole", "direction_college", "direction_lycee", "comptabilite", "education"],
      "external": false,
      "variant": "absences"
    },
    {
      "id": 14,
      "name": "Organigramme interne",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Organigramme.jpg",
      "link": "/organigramme",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": false
    },
    {
      "id": 15,
      "name": "Demandes (équipe)",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/demandes.jpg",
      "link": "/requests",
      "allowedRoles": ["direction_college", "administratif", "direction_ecole", "direction_lycee", "maintenance", "comptabilite","education"],
      "external": false
    },
    {
      "id": 16,
      "name": "Suivi de mes demandes",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/demandes.jpg",
      "link": "/mes-demandes",
      "allowedRoles": ["professeur","infirmerie"],
      "external": false
    },
    {
      "id": 17,
      "name": "Brain AI (training engine)",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Brain+iA.jpg",
      "link": "/chatbot-knowledge",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": false
    },
    {
      "id": 19,
      "name": "Photocopies couleur",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Demande+impression.jpg",
      "link": "/photocopies-couleur",
      "allowedRoles": [
        "professeur",
        "administratif",
        "education",
        "direction_ecole",
        "direction_college",
        "direction_lycee",
      ],
      "external": false
    },
    {
      "id": 21,
      "name": "Paramètres généraux",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/classeur.jpg",
      "link": "/parametres",
      "allowedRoles": [],
      "orgAdminOnly": true,
      "external": false
    },
    {
      "id": 22,
      "name": "Utilisateurs",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/classeur.jpg",
      "link": "/membres",
      "allowedRoles": [],
      "orgAdminOnly": true,
      "external": false
    },
    {
      "id": 20,
      "name": "Demandes HSE",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Demande+HSE.jpg",
      "link": "/demandes-hse",
      "allowedRoles": ["professeur", "direction_ecole", "direction_college", "direction_lycee"],
      "external": false
    },
    {
      "id": 23,
      "name": "Module RH",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Organigramme.jpg",
      "link": "/rh",
      "allowedRoles": ["administratif", "comptabilite", "maintenance", "education", "direction_ecole", "direction_college", "direction_lycee", "professeur", "infirmerie", "admin"],
      "external": false,
      "variant": "personnel-ogec"
    }
  ],
  externalQuickLinks: [
    {
      id: "ecole-directe",
      name: "École Directe",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Ecole+direct.png",
      link: "https://www.ecoledirecte.com/login?cameFrom=%2FAccueil",
      allowedRoles: ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"],
    },
    {
      id: "zeendoc",
      name: "ZeenDoc",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/zeendoc.png",
      link: "https://armoires.zeendoc.com/_Login/Login.php",
      allowedRoles: ["administratif", "comptabilite", "direction_college", "direction_ecole", "direction_lycee"],
    },
    {
      id: "arena",
      name: "Arena Ac-Normandie",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/MIN_Education_Nationale_et_Jeunesse_RVB.jpg",
      link: "https://arena.ac-normandie.fr/arena/",
      allowedRoles: ["administratif", "direction_college", "direction_ecole", "direction_lycee"],
    },
  ],
  travels: [],
  documents: [],
  error: null,
};
const DataContext = createContext<Data | undefined>(undefined);
export const DataProvider = ({ children }: PropsWithChildren<object>) => (
  <DataContext.Provider value={STATIC_DATA}>{children}</DataContext.Provider>
);
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {throw new Error("useData must be used within a DataProvider")}
  return context;
};