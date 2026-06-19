/**
 * ═══════════════════════════════════════════════════════════════════
 *  CATALOGUE UNIQUE DES MODULES INTRANET
 *  Ajouter / modifier un module ICI uniquement :
 *  - tuile dashboard (champ `dashboard`)
 *  - rôles autorisés (`allowedRoles`)
 *  - routes protégées par le middleware (`pathPrefixes`, si module interne)
 * ═══════════════════════════════════════════════════════════════════
 */

import { hasGlobalAdminRole, hasRole } from "./intranet-role-utils";
import { INTRANET_DIRECTION_SLUGS, intranetRolesExceptParent } from "./intranet-roles";

const DIRECTIONS = [...INTRANET_DIRECTION_SLUGS];
const ROLES_EXCEPT_PARENT = intranetRolesExceptParent();

export type DashboardTileVariant =
  | "default"
  | "travels"
  | "prof-room"
  | "domain-planning"
  | "agent-ia"
  | "absences"
  | "personnel-ogec"
  | "internat"
  | "week-sheet"
  | "academic-deadlines"
  | "photocopies-couleur";

export type DashboardCategory = {
  id: number;
  moduleId: string;
  name: string;
  link: string;
  img: string;
  description?: string;
  allowedRoles: string[];
  external?: boolean;
  orgAdminOnly?: boolean;
  variant?: DashboardTileVariant;
};

export type ExternalQuickLink = {
  id: string;
  name: string;
  link: string;
  img: string;
  allowedRoles: string[];
};

export type IntranetModule = {
  id: string;
  allowedRoles: string[];
  orgAdminOnly?: boolean;
  /** Routes page + API. Omis pour les liens externes (tuile seulement). */
  pathPrefixes?: string[];
  excludePrefixes?: string[];
  /** Tuile sur le dashboard. Omis si module API-only (ex. règle complémentaire). */
  dashboard?: Omit<DashboardCategory, "allowedRoles" | "orgAdminOnly" | "moduleId">;
};

/** Accessible à tout utilisateur connecté (hors contrôle module). */
export const INTRANET_ALWAYS_ALLOWED_PREFIXES = [
  "/dashboard",
  "/api/app/context",
  "/api/tenant/public",
  "/calendrierAbsProfs",
  "/faire-une-demande",
  "/demande/merci",
];

export const INTRANET_MODULES: IntranetModule[] = [
  {
    id: "documents",
    pathPrefixes: ["/documents", "/api/documents"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "comptabilite",
      "education",
      "professeur",
      "maintenance",
    ],
    dashboard: {
      id: 1,
      name: "Les documents",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/classeur.jpg",
      link: "/documents",
      external: false,
    },
  },
  {
    id: "faire-demande",
    pathPrefixes: ["/faire-une-demande", "/demande/merci"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "comptabilite",
      "education",
      "professeur",
      "maintenance",
    ],
  },
  {
    id: "travels",
    pathPrefixes: ["/travels", "/api/travels"],
    excludePrefixes: ["/api/travels/ingest-from-email"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "comptabilite",
      "education",
      "professeur",
    ],
    dashboard: {
      id: 4,
      name: "Sortie scolaire",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/transport.avif",
      link: "/travels",
      external: false,
      variant: "travels",
    },
  },
  {
    id: "qrcreator",
    pathPrefixes: ["/qrcreator"],
    allowedRoles: [...ROLES_EXCEPT_PARENT],
    dashboard: {
      id: 5,
      name: "Création de QR Code",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/qr_code_avec_logo_personnalise.png",
      link: "/qrcreator",
      external: false,
    },
  },
  {
    id: "prof-room",
    pathPrefixes: ["/prof-room", "/api/reservation-rooms"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "education",
      "professeur",
      "maintenance",
    ],
    dashboard: {
      id: 8,
      name: "Réservation de salle",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/reservationsalle.jpg",
      link: "/prof-room",
      external: false,
      variant: "prof-room",
    },
  },
  {
    id: "domain-planning",
    pathPrefixes: ["/domain-planning", "/api/domain-planning"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "education",
      "professeur",
      "maintenance",
    ],
    dashboard: {
      id: 25,
      name: "Enseignements transversaux",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/reservationsalle.jpg",
      link: "/domain-planning",
      external: false,
      variant: "domain-planning",
    },
  },
  {
    id: "agent-ia-ocr",
    pathPrefixes: ["/agentIAOCR", "/api/agentIAOCR", "/api/eleves", "/api/mef-secteurs"],
    allowedRoles: ["administratif", ...DIRECTIONS],
    dashboard: {
      id: 10,
      name: "Ajout de documents IA",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/add+Docs.png",
      link: "/agentIAOCR",
      external: false,
      variant: "agent-ia",
    },
  },
  {
    id: "channels",
    pathPrefixes: ["/channels", "/api/channels"],
    allowedRoles: [...ROLES_EXCEPT_PARENT],
    dashboard: {
      id: 11,
      name: "Salons",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/channels.jpg",
      link: "/channels",
      external: false,
    },
  },
  {
    id: "absences",
    pathPrefixes: ["/absences", "/api/absences"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "education",
      "comptabilite",
      "professeur",
      "maintenance",
    ],
    dashboard: {
      id: 13,
      name: "Absences",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/planning+abs.jpg",
      link: "/absences",
      external: false,
      variant: "absences",
    },
  },
  {
    id: "organigramme",
    pathPrefixes: ["/organigramme"],
    allowedRoles: ["administratif"],
    dashboard: {
      id: 14,
      name: "Organigramme interne",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Organigramme.jpg",
      link: "/organigramme",
      external: false,
    },
  },
  {
    id: "requests-staff",
    pathPrefixes: ["/requests", "/mes-demandes", "/api/requests"],
    excludePrefixes: ["/api/requests/create", "/api/requests/confirm"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "comptabilite",
      "education",
      "professeur",
      "maintenance",
    ],
    dashboard: {
      id: 3,
      name: "Demandes",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/demandes.jpg",
      link: "/requests",
      external: false,
    },
  },
  {
    id: "chatbot-knowledge",
    pathPrefixes: ["/chatbot-knowledge", "/api/chatbot/ingest"],
    allowedRoles: ["administratif"],
    dashboard: {
      id: 17,
      name: "Brain AI (training engine)",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Brain+iA.jpg",
      link: "/chatbot-knowledge",
      external: false,
    },
  },
  {
    id: "photocopies-couleur",
    pathPrefixes: ["/photocopies-couleur", "/api/photocopies-couleur"],
    allowedRoles: [...DIRECTIONS, "administratif", "professeur"],
    dashboard: {
      id: 19,
      name: "Photocopies couleur",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Demande+impression.jpg",
      link: "/photocopies-couleur",
      external: false,
      variant: "photocopies-couleur",
    },
  },
  {
    id: "demandes-hse",
    pathPrefixes: ["/demandes-hse", "/api/demandes-hse"],
    allowedRoles: [...DIRECTIONS, "administratif", "professeur"],
    dashboard: {
      id: 20,
      name: "Demandes HSE",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Demande+HSE.jpg",
      link: "/demandes-hse",
      external: false,
    },
  },
  {
    id: "admin-settings",
    pathPrefixes: ["/parametres", "/api/settings"],
    allowedRoles: [],
    orgAdminOnly: true,
    dashboard: {
      id: 21,
      name: "Paramètres généraux",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/classeur.jpg",
      link: "/parametres",
      external: false,
    },
  },
  {
    id: "admin-members",
    pathPrefixes: ["/membres", "/api/members"],
    allowedRoles: [],
    orgAdminOnly: true,
    dashboard: {
      id: 22,
      name: "Utilisateurs",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/classeur.jpg",
      link: "/membres",
      external: false,
    },
  },
  {
    id: "rh",
    pathPrefixes: ["/rh", "/personnel", "/api/personnel"],
    allowedRoles: [
      ...DIRECTIONS,
      "administratif",
      "comptabilite",
      "education",
      "maintenance",
    ],
    dashboard: {
      id: 23,
      name: "Module RH",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Organigramme.jpg",
      link: "/rh",
      external: false,
      variant: "personnel-ogec",
    },
  },
  {
    id: "internat",
    pathPrefixes: ["/gestion-internat", "/api/internat"],
    allowedRoles: [...DIRECTIONS, "administratif", "education"],
    dashboard: {
      id: 24,
      name: "Internat",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Internat.jpg",
      link: "/gestion-internat",
      external: false,
      variant: "internat",
    },
  },
  {
    id: "covoiturage",
    pathPrefixes: ["/covoiturage", "/api/covoiturage"],
    allowedRoles: ["parent"],
    dashboard: {
      id: 26,
      name: "Covoiturage",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Covoiturage.jpg",
      link: "/covoiturage",
      external: false,
      variant: "default",
    },
  },
  {
    id: "assistance",
    pathPrefixes: ["/assistance", "/api/assistance"],
    allowedRoles: [...ROLES_EXCEPT_PARENT],
    dashboard: {
      id: 27,
      name: "Assistance",
      img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/demandes.jpg",
      link: "/assistance",
      external: false,
      description: "Signaler un problème technique",
    },
  },
  {
    id: "dashboard-academic-deadlines",
    pathPrefixes: ["/api/academic-deadlines", "/api/dashboard/academic-deadlines"],
    allowedRoles: [...DIRECTIONS, "administratif"],
    dashboard: {
      id: 9002,
      name: "Échéances académiques",
      img: "",
      link: "#",
      description: "Mutations, examens, Parcoursup, affectations — Académie de Normandie",
      variant: "academic-deadlines",
    },
  },
  {
    id: "dashboard-week-sheet",
    pathPrefixes: ["/api/dashboard/week-sheet"],
    allowedRoles: [...ROLES_EXCEPT_PARENT],
    dashboard: {
      id: 9001,
      name: "Feuille de semaine",
      img: "",
      link: "#",
      description: "Planning de la semaine",
      variant: "week-sheet",
    },
  },
];

/** Raccourcis externes sous le slider (mêmes règles de rôles, pas de route interne). */
export const INTRANET_EXTERNAL_QUICK_LINKS: ExternalQuickLink[] = [
  {
    id: "ecole-directe",
    name: "École Directe",
    img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/Ecole+direct.png",
    link: "https://www.ecoledirecte.com/login?cameFrom=%2FAccueil",
    allowedRoles: [
      "direction_college",
      "administratif",
      "professeur",
      "direction_ecole",
      "direction_lycee",
      "maintenance",
      "comptabilite",
      "infirmerie",
      "education",
    ],
  },
  {
    id: "zeendoc",
    name: "ZeenDoc",
    img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/zeendoc.png",
    link: "https://armoires.zeendoc.com/_Login/Login.php",
    allowedRoles: [
      "administratif",
      "comptabilite",
      "direction_college",
      "direction_ecole",
      "direction_lycee",
    ],
  },
  {
    id: "arena",
    name: "Arena Ac-Normandie",
    img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/categories/MIN_Education_Nationale_et_Jeunesse_RVB.jpg",
    link: "https://arena.ac-normandie.fr/arena/",
    allowedRoles: ["administratif", "direction_college", "direction_ecole", "direction_lycee"],
  },
];

export function getDashboardCategories(): DashboardCategory[] {
  return INTRANET_MODULES.filter((m) => m.dashboard)
    .map((m) => ({
      ...m.dashboard!,
      moduleId: m.id,
      allowedRoles: m.allowedRoles,
      orgAdminOnly: m.orgAdminOnly,
    }))
    .sort((a, b) => a.id - b.id);
}

export function getExternalQuickLinks(): ExternalQuickLink[] {
  return INTRANET_EXTERNAL_QUICK_LINKS;
}

function normalizePathname(pathname: string): string {
  const p = pathname.split("?")[0] || "/";
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

function isExcluded(pathname: string, excludePrefixes?: string[]): boolean {
  if (!excludePrefixes?.length) return false;
  return excludePrefixes.some((ex) => pathname === ex || pathname.startsWith(`${ex}/`));
}

function moduleMatchesPath(module: IntranetModule, pathname: string): boolean {
  if (!module.pathPrefixes?.length) return false;
  if (isExcluded(pathname, module.excludePrefixes)) return false;
  return module.pathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function findMatchingModules(pathname: string): IntranetModule[] {
  const normalized = normalizePathname(pathname);
  return INTRANET_MODULES.filter((m) => moduleMatchesPath(m, normalized));
}

export function rolesAllowModule(
  roles: string[],
  module: IntranetModule,
  isOrgAdmin: boolean,
): boolean {
  if (module.orgAdminOnly) return isOrgAdmin;
  if (hasGlobalAdminRole(roles)) return true;
  if (!module.allowedRoles.length) return false;
  return module.allowedRoles.some((r) => hasRole(roles, r));
}

export function canAccessIntranetPath(
  pathname: string,
  roles: string[],
  isOrgAdmin: boolean,
): boolean {
  const normalized = normalizePathname(pathname);

  if (
    INTRANET_ALWAYS_ALLOWED_PREFIXES.some(
      (p) => normalized === p || normalized.startsWith(`${p}/`),
    )
  ) {
    return true;
  }

  const modules = findMatchingModules(normalized);
  if (modules.length === 0) return true;

  return modules.some((m) => rolesAllowModule(roles, m, isOrgAdmin));
}

export function isOrgAdminFromSession(
  orgRole: string | null | undefined,
  publicMetadata: Record<string, unknown> | undefined,
): boolean {
  const roleArr = Array.isArray(publicMetadata?.role)
    ? publicMetadata.role.map(String)
    : publicMetadata?.role
      ? [String(publicMetadata.role)]
      : [];
  return (
    orgRole === "org:admin" ||
    roleArr.includes("admin") ||
    publicMetadata?.org_admin === true ||
    publicMetadata?.platform_admin === true
  );
}
