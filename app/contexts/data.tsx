"use client"

import { createContext, useContext, PropsWithChildren, useEffect, useMemo, useState } from "react";

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
      "allowedRoles": ["administratif", "comptabilite","direction_ecole","direction_lycee","direction_college"],
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
      "allowedRoles": ["professeur", "administratif", "direction_college", "direction_ecole", "direction_lycee", "maintenance", "education"],
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
      "name": "Ajout de documents IA",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/add+Docs.png",
      "link": "/agentIAOCR",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": false
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
      "id": 12,
      "name": "Ajout d'actualités sur le site",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/News.jpg",
      "link": "/add-news-site",
      "allowedRoles": ["administratif", "direction_ecole", "direction_college", "direction_lycee"],
      "external": false
    },
    {
      "id": 13,
      "name": "Déclaration d'absences",
      "img": "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/planning+abs.jpg",
      "link": "/absences",
      "allowedRoles": ["professeur", "administratif", "direction_ecole", "direction_college", "direction_lycee", "comptabilite", "education"],
      "external": false
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
    }
  ],
  travels: [],
  documents: [],
  error: null,
};
const DataContext = createContext<Data | undefined>(undefined);
export const DataProvider = ({ children }: PropsWithChildren<object>) => {
  const [dynamicCategories, setDynamicCategories] = useState<Categories[]>([]);
  useEffect(() => {
    let cancelled = false;
    const commonAllowedRoles = ["direction_college", "administratif", "professeur", "direction_ecole", "direction_lycee", "maintenance", "comptabilite", "infirmerie", "education"];
    const loadGristCategory = async () => {
      try {
        const res = await fetch("/api/grist", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { gristUrl?: string };
        const gristUrl = data?.gristUrl;
        if (!gristUrl || cancelled) return;
        setDynamicCategories((prev) => {
          const withoutExisting = prev.filter((c) => c.name !== "Grist");
          return [
            ...withoutExisting,
            {
              id: 999,
              name: "Grist",
              img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Grist.jpg",
              link: gristUrl,
              allowedRoles: commonAllowedRoles,
              external: true,
            },
          ];
        });
      } catch {
      }
    };
    const loadDocsCategory = async () => {
      try {
        const res = await fetch("/api/docs", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { docsUrl?: string };
        const docsUrl = data?.docsUrl;
        if (!docsUrl || cancelled) return;
        setDynamicCategories((prev) => {
          const withoutExisting = prev.filter((c) => c.name !== "Docs");
          return [
            ...withoutExisting,
            {
              id: 1000,
              name: "Docs",
              img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Docs.jpg",
              link: docsUrl,
              allowedRoles: commonAllowedRoles,
              external: true,
            },
          ];
        });
      } catch {
      }
    };
    loadGristCategory();
    loadDocsCategory();
    return () => { cancelled = true; }}, []);
  const value = useMemo<Data>(
    () => ({
      ...STATIC_DATA,
      categories: [...STATIC_DATA.categories, ...dynamicCategories],
    }),
    [dynamicCategories]
  );
  return ( <DataContext.Provider value={value}>{children}</DataContext.Provider>);
};
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {throw new Error("useData must be used within a DataProvider")}
  return context;
};