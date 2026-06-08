"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { INTRANET_ROLE_OPTIONS } from "@/app/lib/intranet-roles";

type DocumentScope = "personal" | "shared";

type DocumentItem = {
  type: "folder" | "file";
  name: string;
  relPath: string;
  ext?: string;
  size?: number;
};

type ShareInfo = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  isOwner: boolean;
};

type Peer = {
  clerkUserId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles: string[];
};

function peerFullName(p: Peer): string {
  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return name || "Nom non renseigné";
}

function peerRoleLabels(p: Peer): string {
  if (!p.roles.length) return "Aucun rôle";
  return p.roles
    .map((slug) => INTRANET_ROLE_OPTIONS.find((o) => o.slug === slug)?.label ?? slug)
    .join(", ");
}

type QuotaInfo = {
  used: number;
  quota: number;
  usedLabel: string;
  quotaLabel: string;
  percent: number;
};

type DropFile = { file: File; relPath: string };

function getFileIcon(ext?: string) {
  switch (ext?.toLowerCase()) {
    case "pdf":
      return "📕";
    case "doc":
    case "docx":
      return "📘";
    case "xls":
    case "xlsx":
      return "📗";
  }
  return "📄";
}

async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<DropFile[]> {
  const items = dataTransfer.items;
  if (!items || items.length === 0) {
    return Array.from(dataTransfer.files).map((file) => ({ file, relPath: file.name }));
  }

  const out: DropFile[] = [];

  const readAllEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
    new Promise((resolve, reject) => {
      const acc: FileSystemEntry[] = [];
      const readBatch = () => {
        reader.readEntries((batch) => {
          if (!batch.length) resolve(acc);
          else {
            acc.push(...batch);
            readBatch();
          }
        }, reject);
      };
      readBatch();
    });

  const walkEntry = async (entry: FileSystemEntry, basePath: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
      const relPath = basePath ? `${basePath}/${file.name}` : file.name;
      out.push({ file, relPath });
      return;
    }
    if (entry.isDirectory) {
      const dirPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const entries = await readAllEntries(reader);
      for (const child of entries) {
        await walkEntry(child, dirPath);
      }
    }
  };

  const tasks: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) {
      tasks.push(walkEntry(entry, ""));
    } else if (items[i].kind === "file") {
      const file = items[i].getAsFile();
      if (file) out.push({ file, relPath: file.name });
    }
  }
  await Promise.all(tasks);

  if (out.length === 0) {
    return Array.from(dataTransfer.files).map((file) => ({ file, relPath: file.name }));
  }
  return out;
}

export default function DocumentsPage() {
  const { isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scope, setScope] = useState<DocumentScope>("personal");
  const [shareId, setShareId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [openingFile, setOpeningFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewShare, setShowNewShare] = useState(false);
  const [newShareName, setNewShareName] = useState("");
  const [newShareMembers, setNewShareMembers] = useState<string[]>([]);
  const [showShareManage, setShowShareManage] = useState(false);
  const [manageMembers, setManageMembers] = useState<string[]>([]);
  const [peerSearch, setPeerSearch] = useState("");
  const [moveItem, setMoveItem] = useState<DocumentItem | null>(null);
  const [moveDestPath, setMoveDestPath] = useState("");
  const [moveDestFolders, setMoveDestFolders] = useState<DocumentItem[]>([]);
  const [moveDestLoading, setMoveDestLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const activeShare = useMemo(
    () => shares.find((s) => s.id === shareId) ?? null,
    [shares, shareId],
  );

  const pathSegments = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.replace(/\/$/, "").split("/").filter(Boolean);
  }, [currentPath]);

  const refreshQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/quota", { cache: "no-store" });
      if (res.ok) setQuota(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  const refreshShares = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/shares", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setShares(data.shares ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (scope === "shared" && !shareId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ scope, path: currentPath });
      if (shareId) params.set("shareId", shareId);
      const res = await fetch(`/api/documents/browse?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setItems([]);
        setError(data.error || "Impossible de charger le dossier.");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setItems([]);
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }, [scope, shareId, currentPath]);

  useEffect(() => {
    if (!isLoaded) return;
    refreshShares();
    refreshQuota();
    fetch("/api/documents/peers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPeers(d.peers ?? []))
      .catch(() => {});
  }, [isLoaded, refreshShares, refreshQuota]);

  useEffect(() => {
    if (isLoaded) fetchDocuments();
  }, [isLoaded, fetchDocuments]);

  const goToPersonalRoot = () => {
    setScope("personal");
    setShareId(null);
    setCurrentPath("");
  };

  const openShare = (share: ShareInfo) => {
    setScope("shared");
    setShareId(share.id);
    setCurrentPath("");
  };

  const enterFolder = (relPath: string) => {
    setCurrentPath(relPath.endsWith("/") ? relPath : `${relPath}/`);
  };

  const enterFolderInMovePicker = (relPath: string) => {
    setMoveDestPath(relPath.endsWith("/") ? relPath : `${relPath}/`);
  };

  const navigateToSegment = (index: number) => {
    if (index < 0) {
      if (scope === "shared" && shareId) {
        setCurrentPath("");
        return;
      }
      goToPersonalRoot();
      return;
    }
    const parts = pathSegments.slice(0, index + 1);
    setCurrentPath(parts.length ? `${parts.join("/")}/` : "");
  };

  const handleOpenFile = async (relPath: string) => {
    setOpeningFile(relPath);
    try {
      const params = new URLSearchParams({ scope, path: relPath });
      if (shareId) params.set("shareId", shareId);
      const res = await fetch(`/api/documents/get-url?${params}`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
      else setError(data.error || "Ouverture impossible.");
    } catch {
      setError("Erreur lors de l'ouverture du fichier.");
    } finally {
      setOpeningFile(null);
    }
  };

  const uploadFiles = async (files: DropFile[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("scope", scope);
      formData.append("path", currentPath);
      if (shareId) formData.append("shareId", shareId);
      for (const { file, relPath } of files) {
        formData.append("file", file);
        formData.append(`relPath:${file.name}`, relPath);
      }
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Échec de l'envoi.");
        return;
      }
      await fetchDocuments();
      await refreshQuota();
    } catch {
      setError("Erreur lors de l'envoi des fichiers.");
    } finally {
      setUploading(false);
    }
  };

  const loadMoveDestFolders = useCallback(
    async (path: string) => {
      if (scope === "shared" && !shareId) return;
      setMoveDestLoading(true);
      try {
        const params = new URLSearchParams({ scope, path });
        if (shareId) params.set("shareId", shareId);
        const res = await fetch(`/api/documents/browse?${params}`, { cache: "no-store" });
        const data = await res.json();
        setMoveDestFolders((data.items ?? []).filter((i: DocumentItem) => i.type === "folder"));
      } catch {
        setMoveDestFolders([]);
      } finally {
        setMoveDestLoading(false);
      }
    },
    [scope, shareId],
  );

  useEffect(() => {
    if (moveItem) {
      setMoveDestPath("");
      loadMoveDestFolders("");
    }
  }, [moveItem, loadMoveDestFolders]);

  useEffect(() => {
    if (moveItem) loadMoveDestFolders(moveDestPath);
  }, [moveDestPath, moveItem, loadMoveDestFolders]);

  const parentPathOf = (relPath: string, isFolder: boolean) => {
    const parts = relPath.replace(/\/$/, "").split("/").filter(Boolean);
    if (!isFolder) parts.pop();
    else parts.pop();
    return parts.length ? `${parts.join("/")}/` : "";
  };

  const handleDeleteItem = async (item: DocumentItem) => {
    const label = item.type === "folder" ? "ce dossier et son contenu" : "ce fichier";
    if (!window.confirm(`Supprimer ${label} ?`)) return;
    setActionLoading(item.relPath);
    setError(null);
    try {
      const params = new URLSearchParams({
        scope,
        path: item.relPath,
        itemType: item.type,
      });
      if (shareId) params.set("shareId", shareId);
      const res = await fetch(`/api/documents/delete?${params}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Suppression impossible.");
        return;
      }
      await fetchDocuments();
      await refreshQuota();
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmMove = async () => {
    if (!moveItem) return;
    setActionLoading(moveItem.relPath);
    setError(null);
    try {
      const res = await fetch("/api/documents/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          shareId,
          sourcePath: moveItem.relPath,
          destParentPath: moveDestPath,
          itemType: moveItem.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Déplacement impossible.");
        return;
      }
      setMoveItem(null);
      await fetchDocuments();
    } catch {
      setError("Erreur lors du déplacement.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading) return;
    const files = await collectDroppedFiles(e.dataTransfer);
    await uploadFiles(files);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setError(null);
    const res = await fetch("/api/documents/mkdir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, shareId, path: currentPath, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Création impossible.");
      return;
    }
    setNewFolderName("");
    setShowNewFolder(false);
    await fetchDocuments();
  };

  const handleCreateShare = async () => {
    const name = newShareName.trim();
    if (!name) return;
    setError(null);
    const res = await fetch("/api/documents/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memberIds: newShareMembers }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Création impossible.");
      return;
    }
    setShowNewShare(false);
    setNewShareName("");
    setNewShareMembers([]);
    await refreshShares();
    if (data.share) openShare({ ...data.share, isOwner: true });
  };

  const handleUpdateShareMembers = async () => {
    if (!activeShare) return;
    setError(null);
    const res = await fetch("/api/documents/shares", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId: activeShare.id, memberIds: manageMembers }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Mise à jour impossible.");
      return;
    }
    setShowShareManage(false);
    await refreshShares();
  };

  const filteredPeers = useMemo(() => {
    const q = peerSearch.trim().toLowerCase();
    if (!q) return peers;
    return peers.filter(
      (p) =>
        peerFullName(p).toLowerCase().includes(q) ||
        peerRoleLabels(p).toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.roles.some((r) => r.toLowerCase().includes(q)),
    );
  }, [peers, peerSearch]);

  const toggleMember = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  if (!isLoaded) return null;

  const isSharePicker = scope === "shared" && !shareId;
  const rootLabel = scope === "personal" ? "Mon cloud" : activeShare?.name ?? "Dossier partagé";

  return (
    <main className="flex flex-col gap-5 p-4 sm:p-6 w-full mx-auto max-w-[1200px] sm:pt-[6vh]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (e) => {
          const list = Array.from(e.target.files ?? []).map((file) => ({ file, relPath: file.name }));
          e.target.value = "";
          await uploadFiles(list);
        }}
      />
      <section className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cloud personnel et dossiers partagés avec le personnel Clerk.
          </p>
          {quota && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Espace utilisé</span>
                <span>
                  {quota.usedLabel} / {quota.quotaLabel}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${quota.percent > 90 ? "bg-red-500" : "bg-blue-600"}`}
                  style={{ width: `${quota.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowNewFolder(true)}
            disabled={isSharePicker}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Dossier
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSharePicker || uploading}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Ajouter un fichier
          </button>
          <button
            type="button"
            onClick={() => setShowNewShare(true)}
            className="px-4 py-2 rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50"
          >
            + Dossier partagé
          </button>
          {activeShare?.isOwner && shareId && (
            <button
              type="button"
              onClick={() => {
                setManageMembers(activeShare.memberIds);
                setShowShareManage(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
            >
              Gérer le partage
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4">
        <aside className="md:w-56 shrink-0 bg-white border border-gray-200 rounded-2xl p-3 h-fit">
          <button
            type="button"
            onClick={goToPersonalRoot}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold mb-1 ${
              scope === "personal" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            Mon cloud
          </button>
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Partagés avec moi
          </p>
          {shares.length === 0 ? (
            <p className="px-3 text-xs text-gray-400 italic">Aucun dossier partagé</p>
          ) : (
            shares.map((share) => (
              <button
                key={share.id}
                type="button"
                onClick={() => openShare(share)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-0.5 truncate ${
                  scope === "shared" && shareId === share.id
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                title={share.name}
              >
                {share.isOwner ? "👑 " : "👥 "}
                {share.name}
              </button>
            ))
          )}
        </aside>

        <section className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 flex-wrap">
            <button type="button" onClick={() => navigateToSegment(-1)} className="hover:text-blue-600 font-medium">
              {rootLabel}
            </button>
            {pathSegments.map((seg, i) => (
              <span key={`${seg}-${i}`} className="flex items-center gap-1">
                <span>/</span>
                <button type="button" onClick={() => navigateToSegment(i)} className="hover:text-blue-600 font-medium">
                  {seg}
                </button>
              </span>
            ))}
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {isSharePicker ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center text-gray-500">
              <p className="text-4xl mb-3">👥</p>
              <p className="font-medium">Sélectionnez un dossier partagé dans la barre latérale.</p>
            </div>
          ) : (
            <div
              className={[
                "relative min-h-[420px] rounded-3xl border-2 border-dashed p-6 transition-colors",
                dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-200 bg-gray-50/40",
                uploading ? "opacity-70 pointer-events-none" : "",
              ].join(" ")}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!uploading) setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!uploading) setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.currentTarget === e.target) setDragActive(false);
              }}
              onDrop={handleDrop}
            >
              {loading && (
                <div className="absolute top-4 right-4">
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-3xl z-10">
                  <p className="text-sm font-semibold text-blue-700">Envoi en cours…</p>
                </div>
              )}

              {dragActive && !uploading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <p className="text-blue-700 font-bold text-lg bg-white/90 px-6 py-3 rounded-2xl shadow">
                    Déposez vos fichiers ou dossiers ici
                  </p>
                </div>
              )}

              {items.length > 0 ? (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {items.map((item) => (
                    <DocumentItemCard
                      key={item.relPath}
                      item={item}
                      busy={actionLoading === item.relPath || openingFile === item.relPath}
                      onOpen={() => {
                        if (item.type === "folder") enterFolder(item.relPath);
                        else handleOpenFile(item.relPath);
                      }}
                      onMove={() => setMoveItem(item)}
                      onDelete={() => handleDeleteItem(item)}
                    />
                  ))}
                </div>
              ) : (
                !loading && (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 pointer-events-none">
                    <span className="text-5xl mb-4">📂</span>
                    <p className="font-medium text-gray-600">Ce dossier est vide</p>
                    <p className="text-sm mt-2 italic">
                      Glissez-déposez des fichiers ou dossiers ici
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {showNewFolder && (
        <Modal title="Nouveau dossier" onClose={() => setShowNewFolder(false)}>
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nom du dossier"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4"
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNewFolder(false)} className="px-4 py-2 text-sm rounded-xl border">
              Annuler
            </button>
            <button type="button" onClick={handleCreateFolder} className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white font-semibold">
              Créer
            </button>
          </div>
        </Modal>
      )}

      {showNewShare && (
        <Modal title="Nouveau dossier partagé" onClose={() => setShowNewShare(false)} wide>
          <input
            autoFocus
            value={newShareName}
            onChange={(e) => setNewShareName(e.target.value)}
            placeholder="Ex. Rentrée collège 2025"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-3"
          />
          <PeerPicker
            peers={filteredPeers}
            search={peerSearch}
            onSearch={setPeerSearch}
            selected={newShareMembers}
            onToggle={(id) => toggleMember(id, newShareMembers, setNewShareMembers)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowNewShare(false)} className="px-4 py-2 text-sm rounded-xl border">
              Annuler
            </button>
            <button type="button" onClick={handleCreateShare} className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white font-semibold">
              Créer et ouvrir
            </button>
          </div>
        </Modal>
      )}

      {moveItem && (
        <Modal title={`Déplacer « ${moveItem.name}${moveItem.ext ? `.${moveItem.ext}` : ""} »`} onClose={() => setMoveItem(null)} wide>
          <p className="text-sm text-gray-500 mb-3">Choisissez le dossier de destination (depuis la racine).</p>
          <MoveDestBreadcrumb
            rootLabel={scope === "personal" ? "Mon cloud" : activeShare?.name ?? "Dossier partagé"}
            path={moveDestPath}
            onNavigate={(path) => setMoveDestPath(path)}
          />
          <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y mb-4">
            {moveDestLoading ? (
              <p className="p-4 text-sm text-gray-400 text-center">Chargement…</p>
            ) : moveDestFolders.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center italic">Aucun sous-dossier</p>
            ) : (
              moveDestFolders.map((folder) => (
                <button
                  key={folder.relPath}
                  type="button"
                  onClick={() => enterFolderInMovePicker(folder.relPath)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-left"
                >
                  <span className="text-xl">📁</span>
                  <span className="font-medium text-gray-800">{folder.name}</span>
                </button>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMoveItem(null)} className="px-4 py-2 text-sm rounded-xl border">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmMove}
              disabled={parentPathOf(moveItem.relPath, moveItem.type === "folder") === moveDestPath}
              className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-40"
            >
              Déplacer ici
            </button>
          </div>
        </Modal>
      )}

      {showShareManage && activeShare && (
        <Modal title={`Partage — ${activeShare.name}`} onClose={() => setShowShareManage(false)} wide>
          <p className="text-sm text-gray-500 mb-3">
            Vous êtes propriétaire. Ajoutez ou retirez des personnes du personnel Clerk.
          </p>
          <PeerPicker
            peers={filteredPeers}
            search={peerSearch}
            onSearch={setPeerSearch}
            selected={manageMembers}
            onToggle={(id) => toggleMember(id, manageMembers, setManageMembers)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowShareManage(false)} className="px-4 py-2 text-sm rounded-xl border">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUpdateShareMembers}
              className="px-4 py-2 text-sm rounded-xl bg-slate-800 text-white font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function DocumentItemCard({
  item,
  busy,
  onOpen,
  onMove,
  onDelete,
}: {
  item: DocumentItem;
  busy?: boolean;
  onOpen: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group relative flex flex-col items-center p-4 rounded-2xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 cursor-pointer"
    >
      <div className="absolute inset-0 rounded-2xl bg-slate-900/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 z-10 transition-opacity p-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="w-full max-w-[120px] px-3 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-bold hover:bg-gray-100"
        >
          Ouvrir
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove();
          }}
          className="w-full max-w-[120px] px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
        >
          Déplacer
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-full max-w-[120px] px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
        >
          Supprimer
        </button>
      </div>
      <div className="text-5xl mb-2 group-hover:scale-105 transition-transform">
        {item.type === "folder" ? "📁" : getFileIcon(item.ext)}
      </div>
      <span className="text-center text-xs font-semibold text-gray-700 line-clamp-2 w-full">
        {item.name}
        {item.ext && <span className="text-gray-400 uppercase text-[9px] block">.{item.ext}</span>}
      </span>
      {busy && <span className="mt-1 text-[10px] text-blue-600 font-bold">…</span>}
    </div>
  );
}

function MoveDestBreadcrumb({
  rootLabel,
  path,
  onNavigate,
}: {
  rootLabel: string;
  path: string;
  onNavigate: (path: string) => void;
}) {
  const segments = path.replace(/\/$/, "").split("/").filter(Boolean);
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 flex-wrap">
      <button type="button" onClick={() => onNavigate("")} className="hover:text-blue-600 font-medium">
        {rootLabel}
      </button>
      {segments.map((seg, i) => (
        <span key={`${seg}-${i}`} className="flex items-center gap-1">
          <span>/</span>
          <button
            type="button"
            onClick={() => onNavigate(`${segments.slice(0, i + 1).join("/")}/`)}
            className="hover:text-blue-600 font-medium"
          >
            {seg}
          </button>
        </span>
      ))}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl p-5 w-full ${wide ? "max-w-lg" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function PeerPicker({
  peers,
  search,
  onSearch,
  selected,
  onToggle,
}: {
  peers: Peer[];
  search: string;
  onSearch: (v: string) => void;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Rechercher une personne…"
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-2"
      />
      <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl divide-y">
        {peers.length === 0 ? (
          <p className="p-3 text-sm text-gray-400 italic">Aucune personne trouvée.</p>
        ) : (
          peers.map((p) => (
            <label key={p.clerkUserId} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.includes(p.clerkUserId)}
                onChange={() => onToggle(p.clerkUserId)}
              />
              <span className="flex-1 min-w-0">
                <span className="font-medium text-gray-800 block truncate">{peerFullName(p)}</span>
                <span className="text-xs text-gray-500 truncate block">{peerRoleLabels(p)}</span>
              </span>
            </label>
          ))
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">{selected.length} personne(s) sélectionnée(s)</p>
    </div>
  );
}
