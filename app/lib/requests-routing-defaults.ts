import { SCHOOL } from "@/app/lib/school";
import { STAFF_DIRECTORY } from "@/app/lib/staff-directory";
import type { RequestsRoutingConfig, RoutingAssignment, RoutingTask } from "@/app/lib/app-config-schemas";

const BRANCH_TO_SERVICE: Record<string, string> = {
  corbeille: "etablissement",
  maintenance: "maintenance",
  admin_ecole: "administratif",
  admin_college: "administratif",
  admin_lycee: "administratif",
  cpe_lycee: "vie_scolaire",
  cpe_3e4e: "vie_scolaire",
  cpe_5e6e: "vie_scolaire",
  vie_scolaire_infirmerie: "vie_scolaire",
  accueil: "accueil",
  comptabilite: "comptabilite",
  direction_ecole: "direction",
  direction_college: "direction",
  direction_lycee: "direction",
};

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultRequestsRouting(): RequestsRoutingConfig {
  const branches = SCHOOL.requestsBranches;
  const tasks: RoutingTask[] = Object.entries(branches).map(([id, b]) => ({
    id,
    label: b.roleLabel,
    hint: b.promptLine,
    keywords: [...b.keywords],
    active: !id.startsWith("direction_"),
  }));

  const assignments: RoutingAssignment[] = STAFF_DIRECTORY.filter((r) => r.branchId !== "corbeille").map((r) => ({
    id: uid("asg"),
    taskId: r.branchId,
    email: r.email,
    personName: r.email.split("@")[0] || r.email,
    serviceId: BRANCH_TO_SERVICE[r.branchId] || "administratif",
    active: true,
  }));

  return {
    version: 1,
    services: [
      { id: "etablissement", label: "Établissement (corbeille)", category: "Établissement" },
      { id: "maintenance", label: "Maintenance", category: "Établissement" },
      { id: "administratif", label: "Administratif", category: "Scolarité" },
      { id: "vie_scolaire", label: "Vie scolaire", category: "Vie scolaire" },
      { id: "accueil", label: "Accueil", category: "Établissement" },
      { id: "comptabilite", label: "Comptabilité", category: "Finances" },
      { id: "direction", label: "Direction", category: "Direction", manualOnly: true },
    ],
    tasks,
    assignments,
    directionQueues: [
      { id: "direction_ecole", label: "Direction — école", email: SCHOOL.ecole.email, active: true },
      { id: "direction_college", label: "Direction — collège", email: SCHOOL.college.email, active: true },
      { id: "direction_lycee", label: "Direction — lycée", email: SCHOOL.lycee.email, active: true },
    ],
  };
}
