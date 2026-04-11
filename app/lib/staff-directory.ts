import { normalizeRequestEmail } from "@/app/lib/requests-board";

export type StaffRequestBranchId = | "corbeille" | "maintenance"| "admin_ecole" | "admin_college" | "admin_lycee" | "cpe_lycee" | "cpe_3e4e" | "cpe_5e6e" | "vie_scolaire_infirmerie" | "accueil" | "comptabilite";

export type StaffDirectoryRow = {
  email: string;
  branchId: StaffRequestBranchId;
  role: "leader" | "executor";
  validUntil?: string;
};


export const STAFF_DIRECTORY: StaffDirectoryRow[] = [
  { email: "florian@h-me.fr", branchId: "corbeille", role: "leader" },
  { email: "jerome.laine@laprovidence-nicolasbarre.fr", branchId: "maintenance", role: "leader" },
  { email: "sarah@laprovidence-nicolasbarre.fr", branchId: "maintenance", role: "executor" },
  { email: "m.leblond@laprovidence-nicolasbarre.fr", branchId: "admin_ecole", role: "leader" },
  { email: "0762565a@ac-normandie.fr", branchId: "admin_college", role: "leader" },
  { email: "florian@h-me.fr", branchId: "admin_lycee", role: "leader" },
  { email: "florian@h-me.fr", branchId: "cpe_lycee", role: "leader" },
  { email: "sarah@laprovidence-nicolasbarre.fr", branchId: "cpe_3e4e", role: "leader" },
  { email: "sarah@laprovidence-nicolasbarre.fr", branchId: "cpe_5e6e", role: "leader" },
  { email: "sarah@laprovidence-nicolasbarre.fr", branchId: "vie_scolaire_infirmerie", role: "leader" },
  { email: "florian@h-me.fr", branchId: "vie_scolaire_infirmerie", role: "leader" },
  { email: "m.leblond@laprovidence-nicolasbarre.fr", branchId: "accueil", role: "leader" },
  { email: "florian.hacqueville-mathi@ac-normandie.fr", branchId: "comptabilite", role: "leader" },
  { email: "sarah@laprovidence-nicolasbarre.fr", branchId: "comptabilite", role: "executor" },
  { email: "m.leblond@laprovidence-nicolasbarre.fr", branchId: "comptabilite", role: "executor" },
];

export function isStaffRowActive(row: StaffDirectoryRow, now = new Date()): boolean {
  const v = row.validUntil?.trim();
  if (!v) return true;
  const end = new Date(v);
  if (Number.isNaN(end.getTime())) return true;
  return now.getTime() <= end.getTime();
}

function activeRows(now = new Date()) { return STAFF_DIRECTORY.filter((r) => isStaffRowActive(r, now))}

export function getStaffLeadersForBranch(branchId: string, now = new Date()): string[] {
  const b = branchId.trim();
  return [
    ...new Set(
      activeRows(now)
        .filter((r) => r.branchId === b && r.role === "leader")
        .map((r) => normalizeRequestEmail(r.email))
        .filter(Boolean),
    ),
  ];
}

export function getStaffExecutorsForBranch(branchId: string, now = new Date()): string[] {
  const b = branchId.trim();
  return [
    ...new Set(
      activeRows(now)
        .filter((r) => r.branchId === b && r.role === "executor")
        .map((r) => normalizeRequestEmail(r.email))
        .filter(Boolean),
    ),
  ];
}

export function getStaffPoolForBranch(branchId: string, now = new Date()): string[] {
  const leaders = getStaffLeadersForBranch(branchId, now);
  const execs = getStaffExecutorsForBranch(branchId, now);
  return [...new Set([...leaders, ...execs].filter(Boolean))];
}

export function isStaffLeaderForBranch(branchId: string, actorEmail: string, now = new Date()): boolean {
  if (!actorEmail) return false;
  return getStaffLeadersForBranch(branchId, now).includes(normalizeRequestEmail(actorEmail));
}

export function isStaffInBranchPool(branchId: string, actorEmail: string, now = new Date()): boolean {
  if (!actorEmail) return false;
  return getStaffPoolForBranch(branchId, now).includes(normalizeRequestEmail(actorEmail));
}

export function getAllStaffEmailsFromDirectory(now = new Date()): string[] {
  const s = new Set<string>();
  for (const r of activeRows(now)) {
    if (r.branchId === "corbeille") continue;
    s.add(normalizeRequestEmail(r.email));
  }
  return [...s];
}

export function isListedAsRequestsStaff(actorEmail: string, now = new Date()): boolean {
  if (!actorEmail) return false;
  const u = normalizeRequestEmail(actorEmail);
  return activeRows(now).some((r) => r.branchId !== "corbeille" && normalizeRequestEmail(r.email) === u);
}

export function getFirstBranchForStaffEmailFromDirectory(actorEmail: string, now = new Date()): string | null {
  const u = normalizeRequestEmail(actorEmail);
  for (const r of activeRows(now)) {
    if (r.branchId === "corbeille") continue;
    if (normalizeRequestEmail(r.email) === u) return r.branchId;
  }
  return null;
}
