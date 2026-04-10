import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import { SCHOOL } from "@/app/lib/school";
import {
  LEGACY_ROUTE_TO_BRANCH,
  normalizeRequestBranchId,
  normalizeRequestEmail,
  isCorbeilleBranchId,
} from "@/app/lib/requests-board";
import {
  getFirstBranchForStaffEmailFromDirectory,
  getStaffExecutorsForBranch,
  getStaffLeadersForBranch,
} from "@/app/lib/staff-directory";

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export type RequestStatus = "NOUVELLE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE";

/** Pièce jointe stockée sur S3 sous requests/{requestId}/files/… */
export type RequestAttachment = {
  id: string;
  key: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

export const MAX_REQUEST_ATTACHMENT_BYTES = 12 * 1024 * 1024;
export const MAX_REQUEST_ATTACHMENTS_PER_UPLOAD = 12;

const ATTACHMENT_EXT_OK = /\.(pdf|png|jpe?g|gif|webp|heic|doc|docx|xls|xlsx)$/i;

const ATTACHMENT_MIME_OK = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function assertEligibleRequestAttachment(
  fileName: string,
  contentType: string,
  size: number,
): { ok: true } | { ok: false; error: string } {
  if (size > MAX_REQUEST_ATTACHMENT_BYTES) {
    return { ok: false, error: `Chaque fichier doit faire au plus ${MAX_REQUEST_ATTACHMENT_BYTES / 1024 / 1024} Mo.` };
  }
  if (size <= 0) return { ok: false, error: "Fichier vide." };
  const mime = (contentType || "").toLowerCase().split(";")[0].trim();
  if (ATTACHMENT_MIME_OK.has(mime)) return { ok: true };
  if (mime === "" || mime === "application/octet-stream") {
    if (ATTACHMENT_EXT_OK.test(fileName)) return { ok: true };
  }
  return {
    ok: false,
    error: "Type non autorisé : images, PDF, Word (.doc, .docx) ou Excel (.xls, .xlsx).",
  };
}

export function sanitizeRequestFileName(name: string): string {
  const base = name
    .replace(/[/\\?*]/g, "_")
    .replace(/[^\w.\- ()éàèùïöüÄÉÀÈçÇ]+/gi, "_")
    .trim()
    .slice(0, 180);
  return base || "fichier";
}

export async function uploadBuffersAsRequestAttachments(
  requestId: string,
  items: { buffer: Buffer; fileName: string; contentType: string }[],
): Promise<RequestAttachment[]> {
  if (items.length > MAX_REQUEST_ATTACHMENTS_PER_UPLOAD) {
    throw new Error(`Trop de fichiers (max ${MAX_REQUEST_ATTACHMENTS_PER_UPLOAD}).`);
  }
  const out: RequestAttachment[] = [];
  const now = new Date().toISOString();
  for (const item of items) {
    const check = assertEligibleRequestAttachment(item.fileName, item.contentType, item.buffer.length);
    if (!check.ok) throw new Error(check.error);
    const attId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const safe = sanitizeRequestFileName(item.fileName);
    const key = `requests/${requestId}/files/${attId}_${safe}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: item.buffer,
        ContentType: item.contentType || "application/octet-stream",
      }),
    );
    out.push({
      id: attId,
      key,
      fileName: item.fileName,
      contentType: item.contentType || "application/octet-stream",
      size: item.buffer.length,
      uploadedAt: now,
    });
  }
  return out;
}

export type RequestComment = {
  id: string;
  at: string;
  by: string;
  byEmail?: string;
  toRequester: boolean;
  content: string;
  attachments?: RequestAttachment[];
};

export type RequestHistoryItem = {
  at: string;
  by: string;
  action: string;
  note?: string;
};

export type RequestRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  category: string;
  subject: string;
  description: string;
  requester: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    userId?: string | null;
  };
  assignedTo: {
    routeId?: string;
    unit: string;
    roleLabel: string;
    /** Boîte « principale » (compat notifications) — souvent le 1er du pool */
    email: string;
    ccEmails?: string[];
    /** File partagée : plusieurs personnes voient la même tâche jusqu'à prise en charge */
    poolEmails?: string[];
    /** Quand un membre du pool prend la main, les autres ne la voient plus dans « Ma file » */
    claimedBy?: {
      email: string;
      name: string;
      userId: string | null;
      at: string;
    } | null;
  };
  routing: {
    source: "ai" | "fallback";
    confidence: number;
    reason: string;
    suggestedRouteId?: string;
  };
  /** Fichiers joints à la création de la demande */
  attachments?: RequestAttachment[];
  comments: RequestComment[];
  history: RequestHistoryItem[];
  /** Après cette date ISO, la fiche terminée est purgée (index + fichier détail). */
  purgeAt?: string | null;
};

export function findRequestAttachment(record: RequestRecord, attachmentId: string): RequestAttachment | null {
  for (const a of record.attachments ?? []) {
    if (a.id === attachmentId) return a;
  }
  for (const c of record.comments) {
    for (const a of c.attachments ?? []) {
      if (a.id === attachmentId) return a;
    }
  }
  return null;
}

export type RequestCreateInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  userId?: string | null;
};

const INDEX_KEY = "requests/index.json";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export const REQUEST_STATUSES: RequestStatus[] = ["NOUVELLE", "EN_COURS", "EN_ATTENTE", "TERMINEE"];

/** Durée de conservation des demandes clôturées avant suppression automatique */
export const REQUEST_TERMINATED_RETENTION_DAYS = 30;

export function computePurgeAtForTerminated(fromIso: string): string {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() + REQUEST_TERMINATED_RETENTION_DAYS);
  return d.toISOString();
}

/** À appeler avant sauvegarde : purge programmée à la clôture, effacée si la fiche n’est plus terminée. */
export function finalizeRequestPurgeMetadata(prev: RequestRecord, next: RequestRecord, nowIso: string): RequestRecord {
  if (next.status === "TERMINEE") {
    if (prev.status !== "TERMINEE") {
      return { ...next, purgeAt: computePurgeAtForTerminated(nowIso) };
    }
    return next;
  }
  return { ...next, purgeAt: null };
}

export function requestShouldBePurged(record: RequestRecord, now = new Date()): boolean {
  if (record.status !== "TERMINEE") return false;
  if (record.purgeAt) return now >= new Date(record.purgeAt);
  const legacy = new Date(record.updatedAt);
  legacy.setUTCDate(legacy.getUTCDate() + REQUEST_TERMINATED_RETENTION_DAYS);
  return now >= legacy;
}

/** Retire de l’index les fiches terminées expirées et supprime le JSON détail sur S3. */
export async function purgeExpiredRequests(): Promise<{ removed: number }> {
  const index = await getRequestsIndex();
  const now = new Date();
  const keep: RequestRecord[] = [];
  const remove: RequestRecord[] = [];
  for (const r of index) {
    if (requestShouldBePurged(r, now)) remove.push(r);
    else keep.push(r);
  }
  if (remove.length === 0) return { removed: 0 };
  const bucket = process.env.BUCKET_NAME!;
  for (const r of remove) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: `requests/${r.id}.json`,
        }),
      );
    } catch (e) {
      console.error(`purge request file ${r.id}:`, e);
    }
    try {
      let token: string | undefined;
      const prefix = `requests/${r.id}/`;
      do {
        const list = await s3Client.send(
          new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
        );
        const keys = (list.Contents ?? []).map((c) => c.Key).filter(Boolean) as string[];
        if (keys.length > 0) {
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: keys.map((Key) => ({ Key })) },
            }),
          );
        }
        token = list.IsTruncated ? list.NextContinuationToken : undefined;
      } while (token);
    } catch (e) {
      console.error(`purge request folder ${r.id}:`, e);
    }
  }
  await saveRequestsIndex(keep);
  return { removed: remove.length };
}

function compact(value: string) { return value.trim().replace(/\s+/g, " ")}

export function validateRequestInput(input: Partial<RequestCreateInput>) {
  const firstName = compact(String(input.firstName || ""));
  const lastName = compact(String(input.lastName || ""));
  const email = compact(String(input.email || "")).toLowerCase();
  const phone = compact(String(input.phone || ""));
  const subject = compact(String(input.subject || ""));
  const description = compact(String(input.description || ""));
  if (!firstName || !lastName || !email || !phone || !subject || !description) { return { ok: false as const, error: "Tous les champs sont obligatoires." }}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { return { ok: false as const, error: "Email invalide." }}
  if (phone.length < 8) { return { ok: false as const, error: "Téléphone invalide." }}
  if (description.length < 15) { return { ok: false as const, error: "Merci de détailler un peu plus votre demande." }}
  return {
    ok: true as const,
    value: { firstName, lastName, email, phone, subject, description, userId: input.userId ?? null },
  };
}

export async function getRequestsIndex(): Promise<RequestRecord[]> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: INDEX_KEY,
      }),
    );
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : [];
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err?.name === "NoSuchKey") return [];
    throw error;
  }
}

export async function saveRequestsIndex(index: RequestRecord[]) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: INDEX_KEY,
      Body: JSON.stringify(index),
      ContentType: "application/json",
    }),
  );
}

export async function saveRequestFile(record: RequestRecord) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `requests/${record.id}.json`,
      Body: JSON.stringify(record),
      ContentType: "application/json",
    }),
  );
}

function normalizeForMatch(input: string) {
  return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const ROUTING_CONFIDENCE_MIN = 0.52;

export type RequestRouteDef = {
  id: string;
  category: string;
  roleLabel: string;
  leaderEmails: () => string[];
  executorEmails: () => string[];
  primaryEmail: () => string;
  ccEmails: () => string[];
  poolEmails: () => string[];
  promptLine: string;
  keywords: string[];
};

type BranchId = keyof typeof SCHOOL.requestsBranches;

function buildRouteFromBranch(id: BranchId): RequestRouteDef {
  const b = SCHOOL.requestsBranches[id];
  const leaders = getStaffLeadersForBranch(id);
  const execs = getStaffExecutorsForBranch(id);
  const pool = [...new Set([...leaders, ...execs].map((e) => normalizeRequestEmail(String(e))).filter(Boolean))];
  const primary = pool[0] || leaders[0] || "";
  return {
    id,
    category: b.category,
    roleLabel: b.roleLabel,
    leaderEmails: () => [...leaders],
    executorEmails: () => [...execs],
    primaryEmail: () => primary,
    ccEmails: () => [],
    poolEmails: () => (pool.length > 0 ? pool : primary ? [primary] : []),
    promptLine: b.promptLine,
    keywords: [...b.keywords],
  };
}

const ROUTE_BRANCH_IDS: BranchId[] = [
  "corbeille",
  "maintenance",
  "admin_ecole",
  "admin_college",
  "admin_lycee",
  "cpe_lycee",
  "cpe_3e4e",
  "cpe_5e6e",
  "vie_scolaire_infirmerie",
  "accueil",
  "comptabilite",
];

const REQUEST_ROUTES: RequestRouteDef[] = ROUTE_BRANCH_IDS.map((id) => buildRouteFromBranch(id));

const ROUTE_BY_ID = new Map(REQUEST_ROUTES.map((r) => [r.id, r]));

export function getAllBranchStaffEmails(): string[] {
  const s = new Set<string>();
  for (const r of REQUEST_ROUTES) {
    if (r.id === "corbeille") continue;
    for (const e of r.poolEmails()) {
      s.add(normalizeRequestEmail(e));
    }
  }
  return [...s];
}

function materializeAssigned(def: RequestRouteDef): RequestRecord["assignedTo"] {
  if (def.id === "corbeille") {
    const email = normalizeRequestEmail(def.primaryEmail());
    return {
      routeId: "corbeille",
      unit: "corbeille",
      roleLabel: def.roleLabel,
      email,
      claimedBy: null,
    };
  }
  const effectivePool = [...new Set(def.poolEmails().map(normalizeRequestEmail).filter(Boolean))];
  const email = effectivePool[0]!;
  const poolEmails = effectivePool.length > 1 ? effectivePool : undefined;
  return {
    routeId: def.id,
    unit: def.id,
    roleLabel: def.roleLabel,
    email,
    claimedBy: null,
    ...(poolEmails ? { poolEmails } : {}),
  };
}

export function listRequestRoutesForPicker(): Array<{ id: string; label: string; category: string }> {
  return REQUEST_ROUTES.filter((r) => r.id !== "corbeille").map((r) => ({
    id: r.id,
    label: r.roleLabel,
    category: r.category,
  }));
}

/** Responsable de la branche actuelle de la fiche : peut réaffecter vers un autre service ou renvoyer à la corbeille. */
export function isLeaderForRequestBranch(routeId: string | undefined, unit: string | undefined, actorEmail: string): boolean {
  if (!actorEmail) return false;
  const b = normalizeRequestBranchId(routeId, unit);
  const def = ROUTE_BY_ID.get(b);
  if (!def) return false;
  const u = normalizeRequestEmail(actorEmail);
  return def.leaderEmails().map(normalizeRequestEmail).includes(u);
}

/** Première branche dont l’utilisateur fait partie (prise en charge depuis la corbeille). */
export function getDefaultRequestBranchForStaffEmail(actorEmail: string): string | null {
  return getFirstBranchForStaffEmailFromDirectory(actorEmail);
}

/** Destinataires de la file (pool ou email principal seul). Corbeille = tout le personnel des branches. */
export function getRequestPoolEmails(record: RequestRecord): string[] {
  const branch = normalizeRequestBranchId(record.assignedTo.routeId, record.assignedTo.unit);
  if (isCorbeilleBranchId(branch)) {
    return getAllBranchStaffEmails();
  }
  const a = record.assignedTo;
  if (a.poolEmails && a.poolEmails.length > 0) {
    return [...new Set(a.poolEmails.map(normalizeRequestEmail).filter(Boolean))];
  }
  return [normalizeRequestEmail(a.email)];
}

/** Cibles possibles pour une délégation (membres de la file sur la fiche, hors responsable connecté). */
export function getDelegateTargetEmailsForRequest(record: RequestRecord, leaderEmail: string): string[] {
  const u = normalizeRequestEmail(leaderEmail);
  return getRequestPoolEmails(record)
    .map(normalizeRequestEmail)
    .filter((e) => e && e !== u)
    .sort();
}

export function isUserInRequestPool(record: RequestRecord, userEmail: string) {
  return getRequestPoolEmails(record).includes(normalizeRequestEmail(userEmail));
}

export function isSharedRequestPool(record: RequestRecord): boolean {
  return (record.assignedTo.poolEmails?.length ?? 0) > 1;
}

export function isVisibleInMyQueue(record: RequestRecord, userEmail: string) {
  if (!userEmail) return false;
  const u = normalizeRequestEmail(userEmail);
  const c = record.assignedTo.claimedBy;
  if (c?.email && normalizeRequestEmail(c.email) === u) return true;
  if (isSharedRequestPool(record)) return false;
  if (!isUserInRequestPool(record, userEmail)) return false;
  if (!c?.email) return true;
  return normalizeRequestEmail(c.email) === u;
}

function staffMailTargets(record: RequestRecord): { to: string; cc: string | undefined } {
  const branch = normalizeRequestBranchId(record.assignedTo.routeId, record.assignedTo.unit);
  if (isCorbeilleBranchId(branch)) {
    const def = ROUTE_BY_ID.get("corbeille");
    const to = (def?.leaderEmails() ?? [record.assignedTo.email]).map(normalizeRequestEmail).filter(Boolean).join(", ");
    return { to, cc: undefined };
  }
  const pool = getRequestPoolEmails(record);
  const to = pool.join(", ");
  const ccParts = (record.assignedTo.ccEmails || []).map(normalizeRequestEmail).filter((e) => e && !pool.map(normalizeRequestEmail).includes(e));
  return { to, cc: ccParts.length > 0 ? ccParts.join(", ") : undefined };
}

function computeFallbackRouting(subject: string, description: string) {
  const text = normalizeForMatch(`${subject} ${description}`);
  const candidates = REQUEST_ROUTES.filter((r) => r.id !== "corbeille");
  const corb = ROUTE_BY_ID.get("corbeille")!;
  let best = corb;
  let bestScore = -1;
  for (const rule of candidates) {
    const score = rule.keywords.reduce((acc, kw) => (text.includes(normalizeForMatch(kw)) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }
  const chosen = bestScore > 0 ? best : corb;
  return {
    category: chosen.category,
    assignedTo: materializeAssigned(chosen),
    source: "fallback" as const,
    confidence: bestScore > 0 ? Math.min(0.75, 0.45 + bestScore * 0.08) : 0.32,
    reason:
      bestScore > 0
        ? `Routage par mots-clés (score ${bestScore}) vers ${chosen.id}.`
        : "Aucun mot-clé fort : file de tri.",
  };
}

type MistralRouteResult = {
  category: string;
  assignedTo: RequestRecord["assignedTo"];
  source: "ai";
  confidence: number;
  reason: string;
  suggestedRouteId?: string;
};

async function routeWithMistral(subject: string, description: string): Promise<MistralRouteResult | null> {
  if (!process.env.MISTRAL_API_KEY) return null;
  const routeList = REQUEST_ROUTES.map((r) => `- ${r.id}: ${r.promptLine}`).join("\n");
  const prompt = `Tu es un classificateur pour un établissement scolaire. Choisis UNE SEULE routeId parmi la liste (identifiant exact).

Routes possibles:
${routeList}

Réponds uniquement en JSON:
{
  "routeId": "l'identifiant exact",
  "confidence": 0.0,
  "reason": "une courte phrase en français"
}

Règles (identifiants exacts):
- papier, toner, lampe, fuite, salle, bricolage, PC, mot de passe, Wi‑Fi, imprimante => maintenance
- facture, paiement, compta => comptabilite
- absence, justificatif, appel, infirmerie => vie_scolaire_infirmerie
- discipline CPE collège 5e/6e => cpe_5e6e ; 3e/4e => cpe_3e4e ; lycée => cpe_lycee
- secrétariat / bulletins école => admin_ecole ; collège => admin_college ; lycée => admin_lycee
- accueil, photocopieur panne côté accueil => accueil
- inscription / réinscription globale => admin_ecole ou admin_lycee selon le texte ; doute => corbeille
- si doute ou texte trop vague => corbeille avec confidence <= 0.4

Sujet: ${subject}
Demande: ${description}`;

  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  try {
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}") as {
      routeId?: string;
      reason?: string;
      confidence?: number;
    };
    const rawId = typeof parsed.routeId === "string" ? parsed.routeId.trim() : "";
    const routeId = LEGACY_ROUTE_TO_BRANCH[rawId] ?? rawId;
    const def = ROUTE_BY_ID.get(routeId);
    if (!def) return null;
    const confidence =
      typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.65;
    const corb = ROUTE_BY_ID.get("corbeille")!;
    let chosen = def;
    let suggestedRouteId: string | undefined;
    let reason = parsed.reason || "Routage IA Mistral.";
    if (confidence < ROUTING_CONFIDENCE_MIN && def.id !== "corbeille") {
      suggestedRouteId = def.id;
      chosen = corb;
      reason = `Confiance ${Math.round(confidence * 100)}% < seuil : corbeille. Hypothèse IA : ${suggestedRouteId}. ${parsed.reason || ""}`.trim();
    }
    return {
      category: chosen.category,
      assignedTo: materializeAssigned(chosen),
      source: "ai",
      confidence,
      reason,
      ...(suggestedRouteId ? { suggestedRouteId } : {}),
    };
  } catch {
    return null;
  }
}

export type ResolvedRequestRouting = {
  category: string;
  assignedTo: RequestRecord["assignedTo"];
  source: "ai" | "fallback";
  confidence: number;
  reason: string;
  suggestedRouteId?: string;
};

export async function resolveRequestRouting(subject: string, description: string): Promise<ResolvedRequestRouting> {
  const ai = await routeWithMistral(subject, description);
  if (ai) {
    return {
      category: ai.category,
      assignedTo: ai.assignedTo,
      source: "ai",
      confidence: ai.confidence,
      reason: ai.reason,
      suggestedRouteId: ai.suggestedRouteId,
    };
  }
  return computeFallbackRouting(subject, description);
}

export function resolveRequestRouteById(routeId: string): ResolvedRequestRouting | null {
  const raw = routeId.trim();
  const canonical = LEGACY_ROUTE_TO_BRANCH[raw] ?? raw;
  const def = ROUTE_BY_ID.get(canonical);
  if (!def) return null;
  return {
    category: def.category,
    assignedTo: materializeAssigned(def),
    source: "fallback",
    confidence: 1,
    reason: `Réassignation manuelle vers ${canonical}.`,
  };
}

function getMailer() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/** URL publique du site (liens dans les e-mails, redirections). */
export function getPublicAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const v = process.env.VERCEL_URL?.trim();
  if (v) return `https://${v.replace(/^https?:\/\//, "")}`;
  return "";
}

/** E-mail avec lien à cliquer avant création définitive de la demande (visiteurs non connectés). */
export async function notifyRequestPendingVerification(
  email: string,
  firstName: string,
  confirmUrl: string,
): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP non configuré");
  }
  const transporter = getMailer();
  await transporter.sendMail({
    from: `"Demandes La Providence" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Confirmez votre demande — un clic sur le lien",
    text: [
      firstName ? `Bonjour ${firstName},` : "Bonjour,",
      "",
      "Merci de votre demande. Pour la transmettre à l'équipe, nous devons valider votre adresse e-mail.",
      "",
      "Ouvrez ce lien dans votre navigateur (une seule fois) :",
      confirmUrl,
      "",
      "Le lien est valable environ 72 heures. Si vous n'êtes pas à l'origine de ce message, vous pouvez l'ignorer.",
    ].join("\n"),
  });
}

export async function notifyRequestCreated(record: RequestRecord) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const transporter = getMailer();
  const { to, cc } = staffMailTargets(record);
  await transporter.sendMail({
    from: `"Demandes" <${process.env.SMTP_USER}>`,
    to,
    ...(cc ? { cc } : {}),
    subject: `Nouvelle demande (${record.category}) - ${record.requester.fullName}`,
    text: [
      `Une nouvelle demande a été créée.`,
      `ID: ${record.id}`,
      `Route: ${record.assignedTo.routeId ?? record.assignedTo.unit}`,
      record.routing.suggestedRouteId ? `Hypothèse IA (file de tri): ${record.routing.suggestedRouteId}` : "",
      `Demandeur: ${record.requester.fullName} (${record.requester.email}, ${record.requester.phone})`,
      `Sujet: ${record.subject}`,
      `Description: ${record.description}`,
      `Routage: ${record.assignedTo.roleLabel} (${record.routing.source}, confiance ${Math.round(record.routing.confidence * 100)}%)`,
      record.assignedTo.poolEmails?.length
        ? `File partagée: ${record.assignedTo.poolEmails.join(", ")} — premier qui prend la main la retire de la file des autres.`
        : "",
      `Motif: ${record.routing.reason}`,
      record.attachments?.length
        ? `Pièces jointes (${record.attachments.length}): ${record.attachments.map((a) => a.fileName).join(", ")}`
        : "",
      `Tableau des demandes: ${(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/requests`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
  await transporter.sendMail({
    from: `"Demandes" <${process.env.SMTP_USER}>`,
    to: record.requester.email,
    subject: `Votre demande a été enregistrée (${record.id})`,
    text: [
      `Bonjour ${record.requester.fullName},`,
      `Votre demande a bien été enregistrée.`,
      `ID: ${record.id}`,
      `Statut initial: ${record.status}`,
      `Service destinataire: ${record.assignedTo.roleLabel}`,
      `Sujet: ${record.subject}`,
      record.attachments?.length
        ? `Pièces jointes: ${record.attachments.length} fichier(s) — consultables par l’équipe sur la fiche demande.`
        : "",
      `Vous serez informé aux étapes importantes (mise en attente, clôture) ou si l’équipe vous répond directement.`,
    ].join("\n"),
  });
}

const NOTIFY_STATUSES: RequestStatus[] = ["EN_ATTENTE", "TERMINEE"];

export async function notifyRequestStatusMilestone(
  record: RequestRecord,
  previousStatus: RequestStatus,
  extraNote?: string,
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const now = record.status;
  if (now === previousStatus) return;
  if (!NOTIFY_STATUSES.includes(now)) return;
  const transporter = getMailer();
  const base = [
    `Demande : ${record.id}`,
    `Évolution : ${previousStatus.replace("_", " ")} → ${now.replace("_", " ")}`,
    `Sujet : ${record.subject}`,
    extraNote ? `Précision : ${extraNote}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  await transporter.sendMail({
    from: `"Demandes" <${process.env.SMTP_USER}>`,
    to: record.requester.email,
    subject: `Votre demande — ${now === "TERMINEE" ? "clôture" : "en attente"} (${record.id})`,
    text: `Bonjour ${record.requester.fullName},\n\n${base}\n\nL’équipe vous informe à l’occasion de cette étape.`,
  });
  const { to: staffTo, cc: staffCc } = staffMailTargets(record);
  await transporter.sendMail({
    from: `"Demandes" <${process.env.SMTP_USER}>`,
    to: staffTo,
    ...(staffCc ? { cc: staffCc } : {}),
    subject: `[Demande ${record.id}] ${now.replace("_", " ")}`,
    text: base,
  });
}

export async function notifyRequesterOnly(record: RequestRecord, note: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  if (!note.trim()) return;
  const transporter = getMailer();
  await transporter.sendMail({
    from: `"Demandes" <${process.env.SMTP_USER}>`,
    to: record.requester.email,
    subject: `Message concernant votre demande (${record.id})`,
    text: [
      `Bonjour ${record.requester.fullName},`,
      "",
      `Demande : ${record.id} — ${record.subject}`,
      "",
      note.trim(),
    ].join("\n"),
  });
}

