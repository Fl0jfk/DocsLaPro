import { getJson, putJson } from "@/app/lib/s3-storage";
import {
  parseRequestsRouting,
  type RequestsRoutingConfig,
  type RoutingAssignment,
  type RoutingTask,
} from "@/app/lib/app-config-schemas";
import { saveStaffDirectory } from "@/app/lib/app-config";
import { defaultRequestsRouting } from "@/app/lib/requests-routing-defaults";
import { SCHOOL } from "@/app/lib/school";
import { getMistralApiKey } from "@/app/lib/tenant-config";
import type { ResolvedRequestRouting } from "@/app/lib/requests";

const MANUAL_ONLY_DIRECTION_IDS = new Set(["direction_ecole", "direction_college", "direction_lycee"]);

const ROUTING_KEY = "settings/requests-routing.json";
const CACHE_MS = 45_000;
const ROUTING_CONFIDENCE_MIN = 0.52;
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

let cache: { at: number; config: RequestsRoutingConfig } | null = null;

export function invalidateRequestsRoutingCache() {
  cache = null;
}

export async function getRequestsRoutingConfig(): Promise<RequestsRoutingConfig> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.config;
  const raw = await getJson<{ data?: unknown }>(ROUTING_KEY);
  const config = raw?.data ? parseRequestsRouting(raw.data) : defaultRequestsRouting();
  cache = { at: Date.now(), config };
  return config;
}

function routingToStaffDirectoryRows(config: RequestsRoutingConfig) {
  const rows: { email: string; branchId: string; role: "leader" | "executor" }[] = [
    { email: "florian@h-me.fr", branchId: "corbeille", role: "leader" },
  ];
  const seen = new Set<string>();
  for (const a of getActiveAssignments(config)) {
    const key = `${a.email.toLowerCase()}::${a.taskId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ email: a.email, branchId: a.taskId, role: "leader" });
  }
  for (const d of config.directionQueues.filter((q) => q.active)) {
    rows.push({ email: d.email, branchId: d.id, role: "leader" });
  }
  return rows as import("@/app/lib/app-config-schemas").StaffDirectoryRow[];
}

export async function saveRequestsRoutingConfig(config: RequestsRoutingConfig): Promise<void> {
  const parsed = parseRequestsRouting(config);
  await putJson(ROUTING_KEY, { version: 1, updatedAt: new Date().toISOString(), data: parsed });
  await saveStaffDirectory(routingToStaffDirectoryRows(parsed));
  invalidateRequestsRoutingCache();
}

export function getActiveTasks(config: RequestsRoutingConfig): RoutingTask[] {
  return config.tasks.filter((t) => t.active);
}

export function getActiveAssignments(config: RequestsRoutingConfig): RoutingAssignment[] {
  const activeTaskIds = new Set(getActiveTasks(config).map((t) => t.id));
  return config.assignments.filter((a) => a.active && activeTaskIds.has(a.taskId));
}

export function getAllStaffEmailsFromRouting(config: RequestsRoutingConfig): string[] {
  const emails = new Set<string>();
  for (const a of getActiveAssignments(config)) emails.add(a.email.toLowerCase());
  for (const d of config.directionQueues.filter((q) => q.active)) emails.add(d.email.toLowerCase());
  return [...emails];
}

export function isListedInRouting(config: RequestsRoutingConfig, email: string): boolean {
  const e = email.trim().toLowerCase();
  return getAllStaffEmailsFromRouting(config).includes(e);
}

export function getAssignmentsForEmail(config: RequestsRoutingConfig, email: string): RoutingAssignment[] {
  const e = email.trim().toLowerCase();
  return getActiveAssignments(config).filter((a) => a.email.toLowerCase() === e);
}

type AiRoutingPick = {
  assignmentId: string;
  confidence: number;
  reason: string;
  directionHint?: string;
};

function buildCatalogPayload(config: RequestsRoutingConfig) {
  const activeAssignments = getActiveAssignments(config);
  const taskById = new Map(config.tasks.map((t) => [t.id, t]));
  const serviceById = new Map(config.services.map((s) => [s.id, s]));

  const catalog = activeAssignments.map((a) => {
    const task = taskById.get(a.taskId);
    const service = serviceById.get(a.serviceId);
    return {
      assignmentId: a.id,
      taskId: a.taskId,
      taskLabel: task?.label || a.taskId,
      taskHint: task?.hint || "",
      taskKeywords: task?.keywords || [],
      personName: a.personName,
      email: a.email,
      serviceId: a.serviceId,
      serviceLabel: service?.label || a.serviceId,
      serviceCategory: service?.category || "",
    };
  });

  const directionHints = config.directionQueues
    .filter((q) => q.active)
    .map((q) => ({ id: q.id, label: q.label, email: q.email }));

  return { catalog, directionHints };
}

function keywordFallback(
  config: RequestsRoutingConfig,
  subject: string,
  description: string,
): AiRoutingPick | null {
  const text = `${subject} ${description}`.toLowerCase();
  const activeAssignments = getActiveAssignments(config);
  const taskById = new Map(config.tasks.map((t) => [t.id, t]));

  let best: { assignment: RoutingAssignment; score: number } | null = null;

  for (const a of activeAssignments) {
    const task = taskById.get(a.taskId);
    if (!task) continue;
    let score = 0;
    for (const kw of task.keywords) {
      if (kw && text.includes(kw.toLowerCase())) score += +2;
    }
    if (score > 0 && (!best || score > best.score)) best = { assignment: a, score };
  }

  if (!best) {
    const corbeille = activeAssignments.find((a) => a.taskId === "corbeille");
    if (corbeille) {
      return {
        assignmentId: corbeille.id,
        confidence: 0.35,
        reason: "Aucun mot-clé correspondant — corbeille établissement.",
      };
    }
    return null;
  }

  return {
    assignmentId: best.assignment.id,
    confidence: Math.min(0.75, 0.4 + best.score * 0.05),
    reason: `Correspondance mots-clés (${best.score} points).`,
  };
}

async function callMistralRouting(
  subject: string,
  description: string,
  config: RequestsRoutingConfig,
): Promise<AiRoutingPick | null> {
  const apiKey = await getMistralApiKey();
  if (!apiKey) return null;

  const { catalog, directionHints } = buildCatalogPayload(config);
  if (catalog.length === 0) return null;

  const system = `Tu es le routeur de demandes internes d'un établissement scolaire.
On te donne un catalogue JSON d'affectations (chaque entrée = une tâche + une personne).
Choisis UNE SEULE affectation (assignmentId) la plus pertinente pour traiter la demande.
Les files direction (direction_ecole, direction_college, direction_lycee) ne sont PAS dans le catalogue : si la demande concerne clairement la direction, renvoie directionHint avec l'id approprié mais choisis quand même une affectation non-direction du catalogue pour le traitement initial.
Réponds UNIQUEMENT en JSON valide : {"assignmentId":"...","confidence":0.0-1.0,"reason":"...","directionHint":null ou "direction_..."}`;

  const user = JSON.stringify({
    subject,
    description,
    catalog,
    directionHints,
    school: {
      ecole: SCHOOL.ecole.label,
      college: SCHOOL.college.label,
      lycee: SCHOOL.lycee.label,
    },
  });

  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as AiRoutingPick;
    if (!parsed.assignmentId) return null;
    const exists = catalog.some((c) => c.assignmentId === parsed.assignmentId);
    if (!exists) return null;
    return {
      assignmentId: parsed.assignmentId,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reason: parsed.reason || "Routage IA",
      directionHint: parsed.directionHint || undefined,
    };
  } catch {
    return null;
  }
}

function pickToResolved(
  config: RequestsRoutingConfig,
  pick: AiRoutingPick,
  source: "ai" | "fallback",
): ResolvedRequestRouting {
  const assignmentById = new Map(config.assignments.map((a) => [a.id, a]));
  const taskById = new Map(config.tasks.map((t) => [t.id, t]));
  const serviceById = new Map(config.services.map((s) => [s.id, s]));

  const assignment = assignmentById.get(pick.assignmentId);
  if (!assignment) {
    return corbeilleFallback(config, "Affectation introuvable.", source);
  }

  const task = taskById.get(assignment.taskId);
  const service = serviceById.get(assignment.serviceId);
  const poolEmails = [
    ...new Set(
      getActiveAssignments(config)
        .filter((a) => a.taskId === assignment.taskId)
        .map((a) => a.email),
    ),
  ];

  let confidence = pick.confidence;
  let reason = pick.reason;
  let suggestedRouteId = pick.directionHint;
  let chosenAssignment = assignment;

  const corbeilleAssignment = getActiveAssignments(config).find((a) => a.taskId === "corbeille");

  if (
    confidence < ROUTING_CONFIDENCE_MIN &&
    assignment.taskId !== "corbeille" &&
    corbeilleAssignment
  ) {
    suggestedRouteId = suggestedRouteId || assignment.taskId;
    chosenAssignment = corbeilleAssignment;
    reason = `Confiance ${Math.round(confidence * 100)}% < seuil : corbeille. Hypothèse : ${assignment.taskId}. ${pick.reason}`.trim();
    confidence = Math.min(confidence, 0.45);
  }

  const chosenTask = taskById.get(chosenAssignment.taskId);
  const chosenService = serviceById.get(chosenAssignment.serviceId);
  const chosenPool = [
    ...new Set(
      getActiveAssignments(config)
        .filter((a) => a.taskId === chosenAssignment.taskId)
        .map((a) => a.email),
    ),
  ];

  return {
    category: chosenService?.category || "Général",
    assignedTo: {
      routeId: chosenAssignment.taskId,
      unit: chosenAssignment.taskId,
      roleLabel: `${chosenTask?.label || chosenAssignment.taskId} — ${chosenAssignment.personName}`,
      email: chosenAssignment.email,
      claimedBy: null,
      ...(chosenPool.length > 1 ? { poolEmails: chosenPool } : {}),
    },
    source,
    confidence,
    reason,
    ...(suggestedRouteId ? { suggestedRouteId } : {}),
    routingMeta: { assignmentId: chosenAssignment.id, taskId: chosenAssignment.taskId },
  };
}

function corbeilleFallback(
  config: RequestsRoutingConfig,
  reason: string,
  source: "ai" | "fallback",
): ResolvedRequestRouting {
  const corbeille = getActiveAssignments(config).find((a) => a.taskId === "corbeille");
  const task = config.tasks.find((t) => t.id === "corbeille");
  const service = config.services.find((s) => s.id === "etablissement");
  const email = corbeille?.email || SCHOOL.ecole.email;
  return {
    category: service?.category || "Établissement",
    assignedTo: {
      routeId: "corbeille",
      unit: "corbeille",
      roleLabel: task?.label || "Corbeille établissement",
      email,
      claimedBy: null,
    },
    source,
    confidence: 0.32,
    reason,
  };
}

export async function resolveRoutingFromCatalog(
  subject: string,
  description: string,
): Promise<ResolvedRequestRouting> {
  const config = await getRequestsRoutingConfig();

  const aiPick = await callMistralRouting(subject, description, config);
  if (aiPick) return pickToResolved(config, aiPick, "ai");

  const kwPick = keywordFallback(config, subject, description);
  if (kwPick) return pickToResolved(config, kwPick, "fallback");

  return corbeilleFallback(config, "Catalogue vide ou sans correspondance — corbeille par défaut.", "fallback");
}

export async function getAllBranchStaffEmailsFromRouting(): Promise<string[]> {
  const config = await getRequestsRoutingConfig();
  return getAllStaffEmailsFromRouting(config);
}

export function listActiveTasksForPicker(config: RequestsRoutingConfig) {
  return getActiveTasks(config).map((t) => {
    const service = config.services.find((s) =>
      getActiveAssignments(config).some((a) => a.taskId === t.id && a.serviceId === s.id),
    );
    return {
      id: t.id,
      label: t.label,
      category: service?.category || "Général",
    };
  });
}

export function listDirectionQueuesForTransmit(config: RequestsRoutingConfig) {
  return config.directionQueues
    .filter((q) => q.active && MANUAL_ONLY_DIRECTION_IDS.has(q.id))
    .map((q) => ({ id: q.id, label: q.label, category: "Direction" }));
}
