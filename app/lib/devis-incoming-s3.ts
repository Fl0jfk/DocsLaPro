import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const INCOMING_PREFIX = "devis-incoming/";

export function isAllowedIncomingKey(key: string): boolean {
  if (!key.startsWith(INCOMING_PREFIX) || key.includes("..")) return false;
  return key.length <= 2048;
}

export type IncomingPdfInfo = {
  key: string;
  lastModified: string;
  size: number;
};

export type IncomingMailGroup = {
  messageId: string;
  messageIdShort: string;
  pdfs: IncomingPdfInfo[];
};

/**
 * Liste les PDF sous devis-incoming/ (y compris devis-incoming/&lt;gmailMessageId&gt;/…).
 */
export async function listIncomingPdfs(
  client: S3Client,
  bucket: string,
  maxPages = 8
): Promise<{ pdfs: IncomingPdfInfo[]; groups: IncomingMailGroup[]; latest: IncomingPdfInfo | null }> {
  const collected: IncomingPdfInfo[] = [];
  let token: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: INCOMING_PREFIX,
        ContinuationToken: token,
        MaxKeys: 1000,
      })
    );
    for (const c of res.Contents || []) {
      const key = c.Key;
      if (!key || !/\.pdf$/i.test(key) || key.includes("..")) continue;
      collected.push({
        key,
        lastModified: c.LastModified?.toISOString() || "",
        size: c.Size ?? 0,
      });
    }
    if (!res.IsTruncated || !res.NextContinuationToken) break;
    token = res.NextContinuationToken;
  }

  const pdfs = collected.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  const groupsMap = new Map<string, IncomingPdfInfo[]>();
  for (const p of pdfs) {
    const parts = p.key.split("/").filter(Boolean);
    let folder: string;
    if (parts.length >= 3) {
      folder = parts[1];
    } else if (parts.length === 2) {
      folder = "_à_la_racine";
    } else {
      folder = "_inconnu";
    }
    if (!groupsMap.has(folder)) groupsMap.set(folder, []);
    groupsMap.get(folder)!.push(p);
  }

  const groups: IncomingMailGroup[] = [...groupsMap.entries()].map(([messageId, files]) => ({
    messageId,
    messageIdShort: messageId.length > 14 ? `…${messageId.slice(-12)}` : messageId,
    pdfs: files,
  }));
  groups.sort((a, b) => {
    const ta = Math.max(0, ...a.pdfs.map((x) => new Date(x.lastModified).getTime()));
    const tb = Math.max(0, ...b.pdfs.map((x) => new Date(x.lastModified).getTime()));
    return tb - ta;
  });

  return { pdfs, groups, latest: pdfs[0] ?? null };
}

export async function resolveIncomingPdfKey(
  client: S3Client,
  bucket: string,
  s3Key: string | undefined,
  useLatest: boolean
): Promise<{ key: string } | { error: string }> {
  const trimmed = (s3Key || "").trim();
  if (trimmed) {
    if (!isAllowedIncomingKey(trimmed)) {
      return { error: "Clé S3 non autorisée (uniquement devis-incoming/…)" };
    }
    return { key: trimmed };
  }
  if (!useLatest) {
    return { error: "Indiquez une clé ou utilisez le PDF le plus récent." };
  }
  const { latest } = await listIncomingPdfs(client, bucket);
  if (!latest) {
    return { error: "Aucun PDF trouvé sous devis-incoming/ (lance le polling Gmail puis actualise)." };
  }
  return { key: latest.key };
}
