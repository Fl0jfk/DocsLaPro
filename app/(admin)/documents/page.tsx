"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { INTRANET_ROLE_OPTIONS } from "@/app/lib/intranet-roles";
import ReplayModuleTourButton from "@/app/components/module-tour/ReplayModuleTourButton";

type DocumentScope = "personal" | "shared";

type DocumentItem = {
  type: "folder" | "file";
  name: string;
  relPath: string;
  ext?: string;
  size?: number;
  sharedBy?: string;
  isVirtual?: boolean;
};

const INCOMING_SHARED_FILES_FOLDER = "Fichiers partagés";
const FILE_SHARE_REL_PREFIX = "__fileshare__/";

function isVirtualFileSharePath(relPath: string) {
  return relPath.startsWith(FILE_SHARE_REL_PREFIX);
}

function fileShareIdFromPath(relPath: string) {
  return relPath.slice(FILE_SHARE_REL_PREFIX.length).replace(/\/$/, "");
}

const FILE_EXT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pdf: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  doc: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  docx: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  xls: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  xlsx: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  ppt: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  pptx: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  txt: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  jpg: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  jpeg: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  png: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  zip: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
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

function FileTypeBadge({ ext }: { ext?: string }) {
  const key = (ext || "").toLowerCase();
  const style = FILE_EXT_STYLES[key] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  };
  const label = key ? key.toUpperCase() : "FICHIER";
  return (
    <div
      className={`w-12 h-14 rounded-lg border ${style.border} ${style.bg} flex items-center justify-center shadow-sm`}
    >
      <span className={`text-[9px] font-black tracking-wide ${style.text}`}>{label.slice(0, 5)}</span>
    </div>
  );
}

function FolderIcon({ variant }: { variant?: "shared-incoming" | "default" }) {
  const colors =
    variant === "shared-incoming"
      ? "border-indigo-200 bg-indigo-50 text-indigo-600"
      : "border-amber-200 bg-amber-50 text-amber-600";
  return (
    <div
      className={`w-12 h-14 rounded-lg border ${colors} flex items-center justify-center shadow-sm`}
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden>
        <path d="M10 4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6z" />
      </svg>
    </div>
  );
}

function ActionIconButton({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: "indigo" | "blue" | "red" | "amber";
  children: ReactNode;
}) {
  const tones = {
    indigo: "hover:bg-indigo-50 text-indigo-700",
    blue: "hover:bg-blue-50 text-blue-700",
    red: "hover:bg-red-50 text-red-600",
    amber: "hover:bg-amber-50 text-amber-700",
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-2 rounded-lg bg-white/90 text-slate-600 transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMove() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 9l-3 3 3 3M19 15l3-3-3-3M2 12h20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLeave() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const [showDeleteFolder, setShowDeleteFolder] = useState(false);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState("");
  const [showLeaveShare, setShowLeaveShare] = useState(false);
  const [shareFileItem, setShareFileItem] = useState<DocumentItem | null>(null);
  const [shareFileMembers, setShareFileMembers] = useState<string[]>([]);
  const [incomingFileCount, setIncomingFileCount] = useState(0);

  useEffect(() => {
    const pathFromUrl = new URLSearchParams(window.location.search).get("path");
    if (pathFromUrl) {
      setCurrentPath(pathFromUrl.endsWith("/") ? pathFromUrl : `${pathFromUrl}/`);
    }
  }, []);

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

  const refreshIncomingFileCount = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/file-shares", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setIncomingFileCount(Array.isArray(data.shares) ? data.shares.length : 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    refreshShares();
    refreshQuota();
    refreshIncomingFileCount();
    fetch("/api/documents/peers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPeers(d.peers ?? []))
      .catch(() => {});
  }, [isLoaded, refreshShares, refreshQuota, refreshIncomingFileCount]);

  useEffect(() => {
    if (isLoaded) fetchDocuments();
  }, [isLoaded, fetchDocuments]);

  const goToPersonalRoot = () => {
    setScope("personal");
    setShareId(null);
    setCurrentPath("");
  };

  const openIncomingSharedFiles = () => {
    setScope("personal");
    setShareId(null);
    setCurrentPath(`${INCOMING_SHARED_FILES_FOLDER}/`);
  };

  const isInIncomingSharedFolder =
    scope === "personal" &&
    (currentPath === `${INCOMING_SHARED_FILES_FOLDER}/` ||
      currentPath === INCOMING_SHARED_FILES_FOLDER);

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

  const handleDeleteCurrentFolder = async () => {
    if (deleteFolderConfirm.trim().toLowerCase() !== "supprimer") {
      setError('Tapez « supprimer » pour confirmer.');
      return;
    }
    setActionLoading("delete-folder");
    setError(null);
    try {
      const res = await fetch("/api/documents/delete-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          shareId,
          folderPath: currentFolderRel,
          confirm: deleteFolderConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Suppression impossible.");
        return;
      }
      setShowDeleteFolder(false);
      setDeleteFolderConfirm("");
      if (pathSegments.length > 1) {
        navigateToSegment(pathSegments.length - 2);
      } else {
        setCurrentPath("");
      }
      await fetchDocuments();
      await refreshQuota();
    } catch {
      setError("Erreur lors de la suppression du dossier.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleShareFile = async () => {
    if (!shareFileItem) return;
    setError(null);
    const res = await fetch("/api/documents/file-shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourcePath: shareFileItem.relPath,
        memberIds: shareFileMembers,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Partage impossible.");
      return;
    }
    setShareFileItem(null);
    setShareFileMembers([]);
    await refreshIncomingFileCount();
  };

  const handleLeaveFileShare = async (item: DocumentItem) => {
    const id = fileShareIdFromPath(item.relPath);
    if (!id) return;
    setActionLoading(item.relPath);
    setError(null);
    try {
      const res = await fetch("/api/documents/file-shares/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileShareId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de retirer le fichier.");
        return;
      }
      await fetchDocuments();
      await refreshIncomingFileCount();
    } catch {
      setError("Erreur lors du retrait du fichier partagé.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveShare = async () => {
    if (!shareId) return;
    setActionLoading("leave-share");
    setError(null);
    try {
      const res = await fetch("/api/documents/shares/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de quitter le dossier.");
        return;
      }
      setShowLeaveShare(false);
      goToPersonalRoot();
      await refreshShares();
    } catch {
      setError("Erreur lors de la sortie du dossier partagé.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isLoaded) return null;

  const isSharePicker = scope === "shared" && !shareId;
  const rootLabel = isInIncomingSharedFolder
    ? INCOMING_SHARED_FILES_FOLDER
    : scope === "personal"
      ? "Mon cloud"
      : activeShare?.name ?? "Dossier partagé";
  const isShareOwner = Boolean(activeShare?.isOwner);
  const canDeleteCurrentFolder =
    !isSharePicker &&
    !isInIncomingSharedFolder &&
    ((scope === "personal" && currentPath !== "") ||
      (scope === "shared" && isShareOwner && shareId));
  const currentFolderRel = currentPath.replace(/\/$/, "");
  const deleteFolderLabel =
    scope === "shared" && !currentFolderRel
      ? "Supprimer tout le contenu"
      : "Supprimer ce dossier";
  const deleteFolderTargetName =
    scope === "shared" && !currentFolderRel
      ? activeShare?.name ?? "dossier partagé"
      : pathSegments[pathSegments.length - 1] ?? "ce dossier";

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
        <div data-tour="documents-upload" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowNewFolder(true)}
            disabled={isSharePicker || isInIncomingSharedFolder}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Dossier
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSharePicker || isInIncomingSharedFolder || uploading}
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
          {canDeleteCurrentFolder && (
            <button
              type="button"
              onClick={() => {
                setDeleteFolderConfirm("");
                setShowDeleteFolder(true);
              }}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50"
            >
              {deleteFolderLabel}
            </button>
          )}
          {scope === "shared" && shareId && !isShareOwner && (
            <button
              type="button"
              onClick={() => setShowLeaveShare(true)}
              className="px-4 py-2 rounded-xl border border-amber-200 text-amber-800 text-sm font-semibold hover:bg-amber-50"
            >
              Quitter le dossier
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 md:items-stretch">
        <aside data-tour="documents-scope" className="md:w-56 shrink-0 bg-white border border-gray-200 rounded-2xl p-3 flex flex-col max-h-[min(720px,calc(100vh-10rem))] md:min-h-[480px]">
          <button
            type="button"
            onClick={goToPersonalRoot}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold mb-1 ${
              scope === "personal" && !isInIncomingSharedFolder
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            Mon cloud
          </button>
          <button
            type="button"
            onClick={openIncomingSharedFiles}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-1 flex items-center justify-between gap-2 ${
              isInIncomingSharedFolder
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <span className="truncate">Fichiers partagés</span>
            {incomingFileCount > 0 && (
              <span className="shrink-0 text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                {incomingFileCount}
              </span>
            )}
          </button>
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400 shrink-0">
            Dossiers partagés
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
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
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col min-h-[480px] max-h-[min(720px,calc(100vh-10rem))]">
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
                "relative flex flex-col flex-1 min-h-0 rounded-3xl border-2 border-dashed transition-colors",
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

              <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {items.length > 0 ? (
                <div
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 items-start"
                  onClick={(e) => e.stopPropagation()}
                >
                  {items.map((item) => {
                    const virtualFile = isVirtualFileSharePath(item.relPath);
                    const canShareFile =
                      scope === "personal" &&
                      !isInIncomingSharedFolder &&
                      item.type === "file" &&
                      !virtualFile;
                    return (
                      <DocumentItemCard
                        key={item.relPath}
                        item={item}
                        busy={actionLoading === item.relPath || openingFile === item.relPath}
                        onOpen={() => {
                          if (item.type === "folder") {
                            enterFolder(
                              item.relPath.endsWith("/") ? item.relPath : `${item.relPath}/`,
                            );
                          } else handleOpenFile(item.relPath);
                        }}
                        onMove={virtualFile ? undefined : () => setMoveItem(item)}
                        onDelete={virtualFile ? undefined : () => handleDeleteItem(item)}
                        onShare={canShareFile ? () => setShareFileItem(item) : undefined}
                        onLeave={virtualFile ? () => handleLeaveFileShare(item) : undefined}
                        folderVariant={
                          item.name === INCOMING_SHARED_FILES_FOLDER ? "shared-incoming" : "default"
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                !loading && (
                  <div className="flex flex-col items-center justify-center min-h-[240px] h-full text-gray-400 pointer-events-none">
                    <span className="text-4xl mb-3">📂</span>
                    <p className="font-medium text-gray-600 text-sm">Ce dossier est vide</p>
                    <p className="text-xs mt-2 italic text-center px-4">
                      Glissez-déposez des fichiers ou dossiers ici
                    </p>
                  </div>
                )
              )}
              </div>
            </div>
          )}
        </section>
      </div>

      {showDeleteFolder && (
        <Modal title={deleteFolderLabel} onClose={() => setShowDeleteFolder(false)}>
          <p className="text-sm text-gray-600 mb-3">
            Cette action supprime définitivement <strong>{deleteFolderTargetName}</strong> et tout son
            contenu. Elle est irréversible.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Tapez <strong>supprimer</strong> pour confirmer :
          </p>
          <input
            autoFocus
            value={deleteFolderConfirm}
            onChange={(e) => setDeleteFolderConfirm(e.target.value)}
            placeholder="supprimer"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteFolder(false)}
              className="px-4 py-2 text-sm rounded-xl border"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrentFolder}
              disabled={
                deleteFolderConfirm.trim().toLowerCase() !== "supprimer" ||
                actionLoading === "delete-folder"
              }
              className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white font-semibold disabled:opacity-40"
            >
              {actionLoading === "delete-folder" ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </Modal>
      )}

      {showLeaveShare && activeShare && (
        <Modal title="Quitter le dossier partagé" onClose={() => setShowLeaveShare(false)}>
          <p className="text-sm text-gray-600 mb-4">
            Vous ne verrez plus <strong>{activeShare.name}</strong> dans vos dossiers partagés. Le
            propriétaire pourra vous y réintégrer à tout moment via « Gérer le partage ».
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowLeaveShare(false)} className="px-4 py-2 text-sm rounded-xl border">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleLeaveShare}
              disabled={actionLoading === "leave-share"}
              className="px-4 py-2 text-sm rounded-xl bg-amber-600 text-white font-semibold disabled:opacity-40"
            >
              {actionLoading === "leave-share" ? "En cours…" : "Quitter"}
            </button>
          </div>
        </Modal>
      )}

      {shareFileItem && (
        <Modal
          title={`Partager « ${shareFileItem.name}${shareFileItem.ext ? `.${shareFileItem.ext}` : ""} »`}
          onClose={() => {
            setShareFileItem(null);
            setShareFileMembers([]);
          }}
          wide
        >
          <p className="text-sm text-gray-500 mb-3">
            Les personnes choisies verront ce fichier dans leur dossier « Fichiers partagés ».
          </p>
          <PeerPicker
            peers={filteredPeers}
            search={peerSearch}
            onSearch={setPeerSearch}
            selected={shareFileMembers}
            onToggle={(id) => toggleMember(id, shareFileMembers, setShareFileMembers)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setShareFileItem(null);
                setShareFileMembers([]);
              }}
              className="px-4 py-2 text-sm rounded-xl border"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleShareFile}
              disabled={shareFileMembers.length === 0}
              className="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-40"
            >
              Partager
            </button>
          </div>
        </Modal>
      )}

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
      <ReplayModuleTourButton moduleId="documents" />
    </main>
  );
}

function DocumentItemCard({
  item,
  busy,
  onOpen,
  onMove,
  onDelete,
  onShare,
  onLeave,
  folderVariant,
}: {
  item: DocumentItem;
  busy?: boolean;
  onOpen: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onLeave?: () => void;
  folderVariant?: "shared-incoming" | "default";
}) {
  const hasSecondaryActions = Boolean(onShare || onMove || onDelete || onLeave);

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
      className="group relative flex flex-col items-center p-2.5 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 cursor-pointer w-full min-w-0 overflow-visible"
    >
      <div className="absolute -left-2 -right-2 top-0 bottom-0 rounded-xl bg-slate-900/65 opacity-0 group-hover:opacity-100 flex flex-col items-stretch justify-between z-10 transition-opacity px-2.5 py-2 shadow-lg">
        <div className="flex-1 flex items-center justify-center min-h-[3.5rem] px-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="w-full px-2 py-2.5 rounded-lg bg-white text-gray-900 text-xs font-bold hover:bg-gray-50 shadow-sm"
          >
            Ouvrir
          </button>
        </div>
        {hasSecondaryActions && (
          <div className="flex items-center justify-center gap-2 pt-1.5 px-0.5">
            {onShare && (
              <ActionIconButton label="Partager" onClick={onShare} tone="indigo">
                <IconShare />
              </ActionIconButton>
            )}
            {onMove && (
              <ActionIconButton label="Déplacer" onClick={onMove} tone="blue">
                <IconMove />
              </ActionIconButton>
            )}
            {onDelete && (
              <ActionIconButton label="Supprimer" onClick={onDelete} tone="red">
                <IconTrash />
              </ActionIconButton>
            )}
            {onLeave && (
              <ActionIconButton label="Retirer" onClick={onLeave} tone="amber">
                <IconLeave />
              </ActionIconButton>
            )}
          </div>
        )}
      </div>
      <div className="mb-1.5 group-hover:scale-[1.03] transition-transform shrink-0">
        {item.type === "folder" ? (
          <FolderIcon variant={folderVariant} />
        ) : (
          <FileTypeBadge ext={item.ext} />
        )}
      </div>
      <span className="text-center text-[10px] font-medium text-gray-700 w-full leading-snug break-words px-0.5">
        {item.name}
      </span>
      {item.type === "file" && item.ext && (
        <span className="text-[9px] font-bold uppercase text-gray-400 mt-0.5">{item.ext}</span>
      )}
      {item.isVirtual && (
        <span className="text-[8px] text-indigo-500 font-medium mt-0.5 text-center leading-tight">
          Partagé
        </span>
      )}
      {busy && <span className="mt-0.5 text-[9px] text-blue-600 font-bold">…</span>}
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
