"use client"

import { createContext, useContext, PropsWithChildren } from "react";

type Categories = {
  id: number;
  name: string;
  link: string;
  img: string;
  description?: string;
  allowedRoles: string[];
  external?: boolean;
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
      "id": 2,
      "name": "Ecole Directe",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Ecole+direct.png",
      "link": "https://www.ecoledirecte.com/login?cameFrom=%2FAccueil",
      "allowedRoles": ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"],
      "external": true
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
      "allowedRoles": ["administratif", "comptabilite"],
      "external": false
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
      "id": 6,
      "name": "Base de données Elèves",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/BDD.jpg",
      "link": "https://lyceelaprovidencenbarre-my.sharepoint.com/:f:/g/personal/florian_hacqueville_laprovidence-nicolasbarre_fr/El7spw2Xkz5Jhj7mfvCF3GQBF_SXsR3v_8S_7G4lMJMKMQ?e=fI8DPd",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": true
    },
    {
      "id": 7,
      "name": "ZeenDoc",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/zeendoc.png",
      "link": "https://armoires.zeendoc.com/_Login/Login.php",
      "allowedRoles": ["administratif", "comptabilite", "direction_college", "direction_ecole", "direction_lycee"],
      "external": true
    },
    {
      "id": 8,
      "name": "Réservation de salle",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/reservationsalle.jpg",
      "link": "/prof-room",
      "allowedRoles": ["professeur", "administratif", "direction_college", "direction_ecole", "direction_lycee", "maintenance"],
      "external": false
    },
    {
      "id": 9,
      "name": "Arena Ac Normandie",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/MIN_Education_Nationale_et_Jeunesse_RVB.jpg",
      "link": "https://arena.ac-normandie.fr/arena/",
      "allowedRoles": ["administratif", "direction_college", "direction_ecole", "direction_lycee"],
      "external": true
    },
    {
      "id": 10,
      "name": "Planning des absences",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/planning+abs.jpg",
      "link": "https://lyceelaprovidencenbarre-my.sharepoint.com/:x:/g/personal/florian_hacqueville_laprovidence-nicolasbarre_fr/ETx1_Apa6ANLj_N8J05vWGEBsog7mkqCltCeB06kyUGcLQ?e=0IeBeq",
      "allowedRoles": ["administratif", "direction_college", "direction_ecole", "direction_lycee", "comptabilite", "infirmerie", "education"],
      "external": true
    },
    {
      "id": 11,
      "name": "Ajout de documents IA",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/add+Docs.png",
      "link": "/agentIAOCR",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": false
    },
    {
      "id": 12,
      "name": "Portes ouvertes",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Portes+ouvertes.jpg",
      "link": "https://lyceelaprovidencenbarre-my.sharepoint.com/:x:/g/personal/florian_hacqueville_laprovidence-nicolasbarre_fr/IQC50xx-JtAFQr6iU6GdgepSAW5mUuNX_aARV_kdxUnJyTc?e=4gvKbw",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": true
    },
    {
      "id": 13,
      "name": "Salons",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/channels.jpg",
      "link": "/channels",
      "allowedRoles": ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"],
      "external": false
    }
  ],
  travels: [],
  documents: [],
  error: null,
};

const DataContext = createContext<Data | undefined>(undefined);

export const DataProvider = ({ children }: PropsWithChildren<object>) => {
  return (
    <DataContext.Provider value={STATIC_DATA}>{children}</DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {throw new Error("useData must be used within a DataProvider")}
  return context;
};