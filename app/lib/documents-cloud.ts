import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3Key } from "@/app/lib/tenant";
import {
  getTenantJson,
  getTenantS3Client,
  getBucketName,
  putTenantJson,
  putTenantObject,
} from "@/app/lib/tenant-s3-storage";
import { listClerkMembers, type ClerkMemberRow } from "@/app/lib/clerk-users";

export const DOCUMENTS_QUOTA_BYTES = 2 * 1024 * 1024 * 1024;

export type DocumentScope = "personal" | "shared";

export type ShareMeta = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type DocumentItem = {
  type: "folder" | "file";
  name: string;
  relPath: string;
  ext?: string;
  size?: number;
};

const MARKER_SUFFIXES = [".keep", ".folder"];

function personalRoot(userId: string): string {
  return `documents/users/${userId}/`;
}

function sharedRoot(shareId: string): string {
  return `documents/shared/${shareId}/`;
}

function shareMetaRel(shareId: string): string {
  return `documents/shares/${shareId}.json`;
}

function normalizeRelPath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\/+/g, "/");
}

function joinRel(base: string, segment: string): string {
  const b = normalizeRelPath(base);
  const s = normalizeRelPath(segment);
  if (!b) return s;
  if (!s) return b;
  return `${b.replace(/\/$/, "")}/${s}`;
}

function isMarkerFile(name: string): boolean {
  return MARKER_SUFFIXES.some((s) => name.endsWith(s));
}

export function resolveStoragePrefix(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
  relPath: string,
): { ok: true; prefix: string } | { ok: false; error: string } {
  const rel = normalizeRelPath(relPath);
  if (rel.includes("..")) return { ok: false, error: "Chemin invalide." };

  if (scope === "personal") {
    const prefix = joinRel(personalRoot(userId), rel);
    return { ok: true, prefix: prefix.endsWith("/") ? prefix : `${prefix}/` };
  }

  if (!shareId) return { ok: false, error: "Dossier partagé introuvable." };
  const prefix = joinRel(sharedRoot(shareId), rel);
  return { ok: true, prefix: prefix.endsWith("/") ? prefix : `${prefix}/` };
}

export async function getShareMeta(shareId: string): Promise<ShareMeta | null> {
  const hit = await getTenantJson<ShareMeta>(null, shareMetaRel(shareId));
  return hit?.data ?? null;
}

export async function listAccessibleShares(userId: string): Promise<ShareMeta[]> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  const prefix = s3Key("documents/shares/");
  const out: ShareMeta[] = [];
  let token: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key?.endsWith(".json")) continue;
      const rel = obj.Key.replace(/^tenants\/[^/]+\//, "").replace(/^documents\/shares\//, "").replace(/\.json$/, "");
      const meta = await getShareMeta(rel);
      if (!meta) continue;
      if (meta.ownerId === userId || meta.memberIds.includes(userId)) {
        out.push(meta);
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return out.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
}

export async function canAccessShare(userId: string, shareId: string): Promise<ShareMeta | null> {
  const meta = await getShareMeta(shareId);
  if (!meta) return null;
  if (meta.ownerId === userId || meta.memberIds.includes(userId)) return meta;
  return null;
}

export async function assertShareWrite(
  userId: string,
  shareId: string,
): Promise<{ ok: true; meta: ShareMeta } | { ok: false; error: string }> {
  const meta = await canAccessShare(userId, shareId);
  if (!meta) return { ok: false, error: "Accès refusé à ce dossier partagé." };
  return { ok: true, meta };
}

export async function sumPrefixBytes(relativePrefix: string): Promise<number> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  const prefix = s3Key(relativePrefix.replace(/^\/+/, ""));
  let total = 0;
  let token: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      const name = obj.Key.split("/").pop() ?? "";
      if (isMarkerFile(name)) continue;
      total += obj.Size ?? 0;
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return total;
}

export async function getUserStorageBytes(userId: string): Promise<number> {
  let total = await sumPrefixBytes(personalRoot(userId));
  const shares = await listAccessibleShares(userId);
  for (const share of shares) {
    if (share.ownerId === userId) {
      total += await sumPrefixBytes(sharedRoot(share.id));
    }
  }
  return total;
}

export async function assertQuotaForUpload(
  ownerUserId: string,
  additionalBytes: number,
): Promise<{ ok: true } | { ok: false; error: string; used: number; quota: number }> {
  const used = await getUserStorageBytes(ownerUserId);
  if (used + additionalBytes > DOCUMENTS_QUOTA_BYTES) {
    return {
      ok: false,
      error: `Quota dépassé (${formatBytes(used)} / ${formatBytes(DOCUMENTS_QUOTA_BYTES)}).`,
      used,
      quota: DOCUMENTS_QUOTA_BYTES,
    };
  }
  return { ok: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

export async function browseDocuments(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
  relPath: string,
): Promise<{ ok: true; items: DocumentItem[] } | { ok: false; error: string }> {
  if (scope === "shared") {
    const access = await assertShareWrite(userId, shareId ?? "");
    if (!access.ok) return { ok: false, error: access.error };
  }

  const resolved = resolveStoragePrefix(userId, scope, shareId, relPath);
  if (!resolved.ok) return { ok: false, error: resolved.error };

  const client = getTenantS3Client();
  const bucket = getBucketName();
  const prefix = s3Key(resolved.prefix);

  const res = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
    }),
  );

  const baseLen = prefix.length;
  const folders: DocumentItem[] =
    res.CommonPrefixes?.map((p) => {
      const full = p.Prefix ?? "";
      const segment = full.slice(baseLen).replace(/\/$/, "");
      const name = segment.split("/").pop() ?? segment;
      return {
        type: "folder" as const,
        name,
        relPath: joinRel(relPath, name),
      };
    }) ?? [];

  const files: DocumentItem[] = (res.Contents ?? [])
    .filter((file) => {
      if (!file.Key || file.Key === prefix || file.Key.endsWith("/")) return false;
      const name = file.Key.slice(baseLen);
      if (!name || name.includes("/")) return false;
      if (isMarkerFile(name)) return false;
      return true;
    })
    .map((file) => {
      const name = file.Key!.slice(baseLen);
      const dot = name.lastIndexOf(".");
      const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : undefined;
      const displayName = dot > 0 ? name.slice(0, dot) : name;
      return {
        type: "file" as const,
        name: displayName,
        relPath: joinRel(relPath, name),
        ext,
        size: file.Size,
      };
    });

  const items = [...folders, ...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  return { ok: true, items };
}

export async function createFolder(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
  parentRelPath: string,
  folderName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const safeName = folderName.trim().replace(/[/\\]/g, "-");
  if (!safeName) return { ok: false, error: "Nom de dossier invalide." };

  if (scope === "shared") {
    const access = await assertShareWrite(userId, shareId ?? "");
    if (!access.ok) return { ok: false, error: access.error };
  }

  const resolved = resolveStoragePrefix(userId, scope, shareId, joinRel(parentRelPath, safeName));
  if (!resolved.ok) return { ok: false, error: resolved.error };

  await putTenantObject(null, `${resolved.prefix}.folder`, "", "text/plain");
  return { ok: true };
}

export async function uploadDocumentFile(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
  parentRelPath: string,
  fileName: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ ok: true } | { ok: false; error: string; used?: number; quota?: number }> {
  const safeName = fileName.replace(/[/\\]/g, "-").trim();
  if (!safeName) return { ok: false, error: "Nom de fichier invalide." };

  let quotaOwnerId = userId;
  if (scope === "shared") {
    const access = await assertShareWrite(userId, shareId ?? "");
    if (!access.ok) return { ok: false, error: access.error };
    quotaOwnerId = access.meta.ownerId;
  }

  const quota = await assertQuotaForUpload(quotaOwnerId, buffer.length);
  if (!quota.ok) {
    return { ok: false, error: quota.error, used: quota.used, quota: quota.quota };
  }

  const resolved = resolveStoragePrefix(userId, scope, shareId, parentRelPath);
  if (!resolved.ok) return { ok: false, error: resolved.error };

  const key = `${resolved.prefix}${safeName}`;
  await putTenantObject(null, key, buffer, contentType || "application/octet-stream");
  return { ok: true };
}

export function storageKeyForItem(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
  relPath: string,
): { ok: true; key: string } | { ok: false; error: string } {
  const rel = normalizeRelPath(relPath);
  if (!rel || rel.endsWith("/")) return { ok: false, error: "Fichier invalide." };
  if (rel.includes("..")) return { ok: false, error: "Chemin invalide." };

  if (scope === "personal") {
    return { ok: true, key: joinRel(personalRoot(userId), rel) };
  }
  if (!shareId) return { ok: false, error: "Dossier partagé introuvable." };
  return { ok: true, key: joinRel(sharedRoot(shareId), rel) };
}

export async function assertCanReadFile(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (scope === "personal") return { ok: true };
  const access = await canAccessShare(userId, shareId ?? "");
  if (!access) return { ok: false, error: "Accès refusé." };
  return { ok: true };
}

export async function createSharedFolder(
  ownerId: string,
  name: string,
  memberIds: string[],
): Promise<ShareMeta> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const uniqueMembers = [...new Set(memberIds.filter((m) => m && m !== ownerId))];
  const meta: ShareMeta = {
    id,
    name: name.trim() || "Dossier partagé",
    ownerId,
    memberIds: uniqueMembers,
    createdAt: now,
    updatedAt: now,
  };
  await putTenantJson(null, shareMetaRel(id), meta);
  await putTenantObject(null, `${sharedRoot(id)}.folder`, "", "text/plain");
  return meta;
}

export async function updateSharedMembers(
  ownerId: string,
  shareId: string,
  memberIds: string[],
): Promise<{ ok: true; meta: ShareMeta } | { ok: false; error: string }> {
  const meta = await getShareMeta(shareId);
  if (!meta) return { ok: false, error: "Dossier partagé introuvable." };
  if (meta.ownerId !== ownerId) return { ok: false, error: "Seul le propriétaire peut modifier le partage." };

  const uniqueMembers = [...new Set(memberIds.filter((m) => m && m !== ownerId))];
  const updated: ShareMeta = {
    ...meta,
    memberIds: uniqueMembers,
    updatedAt: new Date().toISOString(),
  };
  await putTenantJson(null, shareMetaRel(shareId), updated);
  return { ok: true, meta: updated };
}

export async function listDocumentPeers(excludeUserId: string): Promise<ClerkMemberRow[]> {
  const members = await listClerkMembers();
  return members.filter((m) => m.clerkUserId && m.clerkUserId !== excludeUserId && !m.pending);
}

async function assertWriteAccess(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (scope === "shared") {
    const access = await assertShareWrite(userId, shareId ?? "");
    if (!access.ok) return access;
  }
  return { ok: true };
}

function parentRelPath(relPath: string, isFolder: boolean): string {
  const p = normalizeRelPath(relPath);
  const parts = p.split("/").filter(Boolean);
  if (isFolder) {
    parts.pop();
  } else {
    parts.pop();
  }
  return parts.length ? `${parts.join("/")}/` : "";
}

function fileNameFromRelPath(relPath: string, isFolder: boolean): string {
  const p = normalizeRelPath(relPath);
  const parts = p.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? p;
}

function normalizeDestParent(destParentRelPath: string): string {
  const p = normalizeRelPath(destParentRelPath);
  if (!p) return "";
  return p.endsWith("/") ? p : `${p}/`;
}

function isInsideFolder(folderRelPath: string, candidateParent: string): boolean {
  const folder = normalizeRelPath(folderRelPath).replace(/\/$/, "");
  const parent = normalizeRelPath(candidateParent).replace(/\/$/, "");
  if (!folder) return false;
  return parent === folder || parent.startsWith(`${folder}/`);
}

async function storageObjectExists(relativeKey: string): Promise<boolean> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  const key = s3Key(relativeKey);
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function copyStorageObject(relativeSourceKey: string, relativeDestKey: string): Promise<void> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  const sourceKey = s3Key(relativeSourceKey);
  const destKey = s3Key(relativeDestKey);
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destKey,
    }),
  );
}

async function deleteStorageObject(relativeKey: string): Promise<void> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: s3Key(relativeKey),
    }),
  );
}

async function listAllStorageKeysUnderPrefix(relativePrefix: string): Promise<string[]> {
  const client = getTenantS3Client();
  const bucket = getBucketName();
  const prefix = s3Key(relativePrefix.replace(/^\/+/, ""));
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return keys;
}

function storageKeyToRelative(storageKey: string): string {
  return storageKey.replace(/^tenants\/[^/]+\//, "");
}

export async function moveDocumentItem(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
  sourceRelPath: string,
  destParentRelPath: string,
  itemType: "folder" | "file",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertWriteAccess(userId, scope, shareId);
  if (!access.ok) return access;

  const destParent = normalizeDestParent(destParentRelPath);
  const sourceParent = parentRelPath(sourceRelPath, itemType === "folder");
  if (destParent === sourceParent) {
    return { ok: false, error: "L'élément est déjà dans ce dossier." };
  }

  const itemName = fileNameFromRelPath(sourceRelPath, itemType === "folder");
  if (!itemName) return { ok: false, error: "Élément invalide." };

  if (itemType === "folder" && isInsideFolder(sourceRelPath, destParent)) {
    return { ok: false, error: "Impossible de déplacer un dossier dans lui-même." };
  }

  if (itemType === "file") {
    const sourceKey = storageKeyForItem(userId, scope, shareId, sourceRelPath);
    if (!sourceKey.ok) return { ok: false, error: sourceKey.error };

    const fileFullName = fileNameFromRelPath(sourceRelPath, false);
    const destRelPath = joinRel(destParent, fileFullName);
    const destKey = storageKeyForItem(userId, scope, shareId, destRelPath);
    if (!destKey.ok) return { ok: false, error: destKey.error };

    if (destKey.key === sourceKey.key) {
      return { ok: false, error: "L'élément est déjà dans ce dossier." };
    }
    if (await storageObjectExists(destKey.key)) {
      return { ok: false, error: "Un fichier du même nom existe déjà à cet emplacement." };
    }
    if (!(await storageObjectExists(sourceKey.key))) {
      return { ok: false, error: "Fichier introuvable." };
    }
    await copyStorageObject(sourceKey.key, destKey.key);
    await deleteStorageObject(sourceKey.key);
    return { ok: true };
  }

  const folderRel = normalizeRelPath(sourceRelPath);
  const sourceFolderKey = storageKeyForItem(userId, scope, shareId, folderRel);
  if (!sourceFolderKey.ok) return { ok: false, error: sourceFolderKey.error };

  const destFolderRel = joinRel(destParent, itemName);
  const destFolderKey = storageKeyForItem(userId, scope, shareId, destFolderRel);
  if (!destFolderKey.ok) return { ok: false, error: destFolderKey.error };

  const sourcePrefixSlash = `${sourceFolderKey.key}/`;
  const destPrefixSlash = `${destFolderKey.key}/`;

  if (destPrefixSlash === sourcePrefixSlash || destPrefixSlash.startsWith(sourcePrefixSlash)) {
    return { ok: false, error: "Impossible de déplacer un dossier dans lui-même." };
  }

  const existingDest = await listAllStorageKeysUnderPrefix(destPrefixSlash);
  if (existingDest.length > 0) {
    return { ok: false, error: "Un dossier du même nom existe déjà à cet emplacement." };
  }

  const sourceKeys = await listAllStorageKeysUnderPrefix(sourcePrefixSlash);
  if (sourceKeys.length === 0) {
    return { ok: false, error: "Dossier introuvable." };
  }

  const sourceBase = s3Key(sourcePrefixSlash);
  for (const fullKey of sourceKeys) {
    const rel = storageKeyToRelative(fullKey);
    if (!rel.startsWith(sourceBase)) continue;
    const suffix = rel.slice(sourceBase.length);
    await copyStorageObject(rel, `${destPrefixSlash}${suffix}`);
  }

  for (const fullKey of sourceKeys) {
    await deleteStorageObject(storageKeyToRelative(fullKey));
  }

  return { ok: true };
}

export async function deleteDocumentItem(
  userId: string,
  scope: DocumentScope,
  shareId: string | null,
  sourceRelPath: string,
  itemType: "folder" | "file",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertWriteAccess(userId, scope, shareId);
  if (!access.ok) return access;

  const sourceKey = storageKeyForItem(
    userId,
    scope,
    shareId,
    itemType === "folder" ? sourceRelPath : sourceRelPath,
  );
  if (!sourceKey.ok) return { ok: false, error: sourceKey.error };

  if (itemType === "file") {
    if (!(await storageObjectExists(sourceKey.key))) {
      return { ok: false, error: "Fichier introuvable." };
    }
    await deleteStorageObject(sourceKey.key);
    return { ok: true };
  }

  const sourcePrefixSlash = `${sourceKey.key}/`;
  const keys = await listAllStorageKeysUnderPrefix(sourcePrefixSlash);
  if (keys.length === 0) {
    return { ok: false, error: "Dossier introuvable." };
  }

  for (const fullKey of keys) {
    await deleteStorageObject(storageKeyToRelative(fullKey));
  }

  return { ok: true };
}
