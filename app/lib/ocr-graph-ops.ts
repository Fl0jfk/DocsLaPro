import "server-only";

import { ensureFolderPath } from "@/app/lib/graph-onedrive-folders";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export function parseGraphRetryAfterMs(res: Response, attempt: number): number {
  const raw = res.headers.get("Retry-After");
  if (raw) {
    const sec = Number(raw);
    if (!Number.isNaN(sec) && sec > 0) return sec * 1000;
  }
  return Math.min(60_000, 4000 * 2 ** attempt);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function uploadBytesToOneDrive(
  accessToken: string,
  itemPath: string,
  bytes: Uint8Array | Buffer,
  contentType = "application/pdf",
): Promise<{ ok: true } | { ok: false; status: number; detail: string }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${GRAPH_BASE}/me/drive/root:/${itemPath}:/content`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
      },
      body: bytes,
    });
    if (res.status === 429) {
      await sleep(parseGraphRetryAfterMs(res, attempt));
      continue;
    }
    if (!res.ok) {
      return { ok: false, status: res.status, detail: (await res.text()).slice(0, 300) };
    }
    return { ok: true };
  }
  return { ok: false, status: 429, detail: "Limite OneDrive atteinte" };
}

export async function deleteOneDrivePath(accessToken: string, itemPath: string) {
  try {
    const res = await fetch(`${GRAPH_BASE}/me/drive/root:/${itemPath}:`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 404) {
      console.warn("[ocr-graph] delete", itemPath, res.status);
    }
  } catch (e) {
    console.warn("[ocr-graph] delete", itemPath, e);
  }
}

export async function moveOneDriveFile(
  accessToken: string,
  sourcePath: string,
  targetFolderPath: string,
  newFileName?: string,
): Promise<{ ok: true; finalFileName: string } | { ok: false; status: number; detail: string }> {
  const sourceRes = await fetch(`${GRAPH_BASE}/me/drive/root:/${sourcePath}:`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!sourceRes.ok) {
    return { ok: false, status: sourceRes.status, detail: await sourceRes.text() };
  }
  const sourceItem = await sourceRes.json();
  const sourceItemId = sourceItem.id as string | undefined;
  const driveId = sourceItem.parentReference?.driveId as string | undefined;
  if (!sourceItemId || !driveId) {
    return { ok: false, status: 500, detail: "ID source ou drive manquant" };
  }

  await ensureFolderPath(accessToken, targetFolderPath);

  const targetFolderRes = await fetch(`${GRAPH_BASE}/me/drive/root:/${targetFolderPath}:`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!targetFolderRes.ok) {
    return { ok: false, status: targetFolderRes.status, detail: await targetFolderRes.text() };
  }
  const targetFolder = await targetFolderRes.json();
  const targetFolderId = targetFolder.id as string | undefined;
  if (!targetFolderId) {
    return { ok: false, status: 500, detail: "ID dossier cible manquant" };
  }

  const finalFileName =
    newFileName && newFileName.trim().length > 0 ? newFileName.trim() : (sourceItem.name as string);

  const childrenRes = await fetch(`${GRAPH_BASE}/drives/${driveId}/items/${targetFolderId}/children`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let children: any[] = [];
  if (childrenRes.ok) {
    const childrenJson = await childrenRes.json();
    children = childrenJson.value || [];
  }

  const dotIndex = finalFileName.lastIndexOf(".");
  const base = dotIndex > 0 ? finalFileName.slice(0, dotIndex) : finalFileName;
  const ext = dotIndex > 0 ? finalFileName.slice(dotIndex) : "";
  let safeName = finalFileName;
  let suffix = 2;
  while (children.some((c) => c.name === safeName)) {
    safeName = `${base} (${suffix})${ext}`;
    suffix++;
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const moveRes = await fetch(`${GRAPH_BASE}/drives/${driveId}/items/${sourceItemId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parentReference: { id: targetFolderId },
        name: safeName,
      }),
    });
    if (moveRes.status === 429) {
      await sleep(parseGraphRetryAfterMs(moveRes, attempt));
      continue;
    }
    if (!moveRes.ok) {
      return { ok: false, status: moveRes.status, detail: await moveRes.text() };
    }
    return { ok: true, finalFileName: safeName };
  }
  return { ok: false, status: 429, detail: "Limite OneDrive lors du déplacement" };
}
