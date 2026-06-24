import { hasRole } from "@/app/lib/intranet-role-utils";

export type HseEtablissement = "École" | "Collège" | "Lycée";
export type HseStatus = "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE" | "ANNULEE";

export type HseRecordLike = {
  status: HseStatus | string;
  etablissement: HseEtablissement;
  createdBy: { userId: string };
};

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");

export function getHseRoleFlags(roles: string[]) {
  const n = roles.map(norm);
  return {
    isDirectionEcole: n.some((r) => r.includes("direction") && r.includes("ecole")),
    isDirectionCollege: n.some((r) => r.includes("direction") && r.includes("college")),
    isDirectionLycee: n.some((r) => r.includes("direction") && r.includes("lycee")),
    isProfesseur: n.some((r) => r.includes("professeur")),
    isAdministratif: hasRole(roles, "administratif"),
  };
}

export function canCreateHseDemand(roles: string[]) {
  return getHseRoleFlags(roles).isProfesseur;
}

export function canManageHseDemand(rec: HseRecordLike, roles: string[]) {
  const f = getHseRoleFlags(roles);
  if (rec.etablissement === "École") return f.isDirectionEcole;
  if (rec.etablissement === "Collège") return f.isDirectionCollege;
  if (rec.etablissement === "Lycée") return f.isDirectionLycee;
  return false;
}

export function canViewAcceptedHseAsAdministratif(rec: HseRecordLike, roles: string[]) {
  return getHseRoleFlags(roles).isAdministratif && rec.status === "ACCEPTEE";
}

export function canViewHseDemand(rec: HseRecordLike, userId: string, roles: string[]) {
  if (rec.createdBy.userId === userId) return true;
  if (canManageHseDemand(rec, roles)) return true;
  return canViewAcceptedHseAsAdministratif(rec, roles);
}

export function canAccessHseModule(roles: string[]) {
  const f = getHseRoleFlags(roles);
  return (
    f.isProfesseur ||
    f.isDirectionEcole ||
    f.isDirectionCollege ||
    f.isDirectionLycee ||
    f.isAdministratif
  );
}

export function isHseAdministratifViewer(roles: string[]) {
  const f = getHseRoleFlags(roles);
  return (
    f.isAdministratif &&
    !f.isProfesseur &&
    !f.isDirectionEcole &&
    !f.isDirectionCollege &&
    !f.isDirectionLycee
  );
}
