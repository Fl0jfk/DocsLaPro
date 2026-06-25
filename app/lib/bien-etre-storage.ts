import "server-only";

import { randomBytes } from "crypto";
import { deleteObject, getJson, putJson } from "@/app/lib/s3-storage";
import type {
  BienEtreSignalement,
  BienEtreSignalementIndexEntry,
  BienEtreSignalementStatus,
} from "@/app/lib/bien-etre-types";

const INDEX_KEY = "bien-etre/signalements/index.json";

function signalementKey(id: string): string {
  return `bien-etre/signalements/${id}.json`;
}

export function newSignalementId(): string {
  return `be-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

async function loadIndex(): Promise<BienEtreSignalementIndexEntry[]> {
  const raw = await getJson<BienEtreSignalementIndexEntry[]>(INDEX_KEY);
  return Array.isArray(raw?.data) ? raw.data : [];
}

async function saveIndex(entries: BienEtreSignalementIndexEntry[]): Promise<void> {
  await putJson(INDEX_KEY, entries);
}

export async function createSignalement(
  record: BienEtreSignalement,
): Promise<BienEtreSignalement> {
  await putJson(signalementKey(record.id), record);
  const index = await loadIndex();
  index.unshift({
    id: record.id,
    createdAt: record.createdAt,
    prenom: record.prenom,
    severity: record.severity,
    status: record.status,
    categories: record.categories,
  });
  await saveIndex(index);
  return record;
}

export async function getSignalement(id: string): Promise<BienEtreSignalement | null> {
  const raw = await getJson<BienEtreSignalement>(signalementKey(id));
  return raw?.data ?? null;
}

export async function listSignalements(): Promise<BienEtreSignalementIndexEntry[]> {
  return loadIndex();
}

export async function purgeExpiredSignalements(now = new Date()): Promise<number> {
  const index = await loadIndex();
  const kept: BienEtreSignalementIndexEntry[] = [];
  let purged = 0;
  for (const entry of index) {
    const full = await getSignalement(entry.id);
    if (full && new Date(full.retentionExpiresAt).getTime() < now.getTime()) {
      await deleteObject(signalementKey(entry.id));
      purged += 1;
    } else {
      kept.push(entry);
    }
  }
  if (purged > 0) await saveIndex(kept);
  return purged;
}

export async function updateSignalementStatus(
  id: string,
  patch: { status?: BienEtreSignalementStatus; referentNote?: string },
): Promise<BienEtreSignalement | null> {
  const record = await getSignalement(id);
  if (!record) return null;
  const updated: BienEtreSignalement = {
    ...record,
    status: patch.status ?? record.status,
    referentNote: patch.referentNote !== undefined ? patch.referentNote : record.referentNote,
  };
  await putJson(signalementKey(id), updated);
  const index = await loadIndex();
  const next = index.map((e) =>
    e.id === id
      ? {
          ...e,
          status: updated.status,
        }
      : e,
  );
  await saveIndex(next);
  return updated;
}

export async function summarizeConversationForSignalement(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
): Promise<string> {
  const { mistralChatText } = await import("@/app/lib/bien-etre-mistral");
  const transcript = messages
    .slice(-16)
    .map((m) => `${m.role === "user" ? "Élève" : "Bot"}: ${m.content}`)
    .join("\n");
  const summary = await mistralChatText(
    apiKey,
    [
      {
        role: "system",
        content:
          "Résume en français (5-8 phrases) une conversation bien-être pour un psychologue scolaire. Pas de jugement. Mentionne les faits et émotions exprimés. Ne invente rien.",
      },
      { role: "user", content: transcript || "Aucun échange enregistré." },
    ],
    0.2,
  );
  return summary || "Résumé non disponible — l'élève a initié un signalement.";
}
