"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import MesDemandesSuivi from "@/app/(admin)/requests/MesDemandesSuivi";

type RequestStatus = "NOUVELLE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE";

type BoardColumnKey = "CORBEILLE" | "NOUVELLES" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE";

type RequestRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  category: string;
  subject: string;
  description: string;
  requester: {
    fullName: string;
    email: string;
    phone: string;
  };
  assignedTo: {
    routeId?: string;
    unit: string;
    roleLabel: string;
    email: string;
    ccEmails?: string[];
    poolEmails?: string[];
    claimedBy?: { email: string; name: string; userId?: string | null; at: string } | null;
  };
  routing?: {
    source?: string;
    confidence?: number;
    reason?: string;
    suggestedRouteId?: string;
  };
  attachments?: Array<{ id: string; fileName: string; size: number }>;
  comments: Array<{
    id: string;
    at: string;
    by: string;
    toRequester: boolean;
    content: string;
    attachments?: Array<{ id: string; fileName: string; size: number }>;
  }>;
  boardColumn?: BoardColumnKey;
  boardCanReassign?: boolean;
  boardCanDelegate?: boolean;
  delegateTargets?: string[];
  purgeAt?: string | null;
};

type SubmittedRequest = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  category: string;
  subject: string;
  description: string;
  assignedTo: {
    routeId?: string;
    unit: string;
    roleLabel: string;
  };
};

const BOARD_COLUMNS: { key: BoardColumnKey; title: string; hint: string; acceptDrop: boolean }[] = [
  {
    key: "CORBEILLE",
    title: "Corbeille",
    hint: "Demandes sans personne assignée — visibles par toute l’équipe. Glissez vers « En cours » pour vous les attribuer.",
    acceptDrop: true,
  },
  {
    key: "NOUVELLES",
    title: "À traiter (mon service)",
    hint: "Votre service : personne n’a encore pris la main. (Pas de dépôt ici.)",
    acceptDrop: false,
  },
  {
    key: "EN_COURS",
    title: "En cours",
    hint: "Déposer ici → vous prenez la demande en charge.",
    acceptDrop: true,
  },
  {
    key: "EN_ATTENTE",
    title: "En attente",
    hint: "Glisser ici → statut en attente.",
    acceptDrop: true,
  },
  {
    key: "TERMINEE",
    title: "Terminée",
    hint: "Glisser ici → clôturer.",
    acceptDrop: true,
  },
];

function normEmail(e: string) { return e.trim().toLowerCase()}

function requesterShort(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 12);
  return `${parts[0]!.charAt(0)}. ${parts[parts.length - 1]!.slice(0, 10)}`;
}

function RequestAttachmentLinks({
  requestId,
  items,
}: {
  requestId: string;
  items?: Array<{ id: string; fileName: string; size: number }>;
}) {
  if (!items?.length) return null;
  const open = async (attachmentId: string) => {
    const res = await fetch(`/api/requests/attachment-url?requestId=${encodeURIComponent(requestId)}&attachmentId=${encodeURIComponent(attachmentId)}`);
    const data = (await res.json()) as { url?: string };
    if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="mt-1 rounded-md bg-white/80 border border-slate-200/80 px-1.5 py-1">
      <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">PJ</p>
      <ul className="space-y-1">
        {items.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="text-[10px] text-sky-800 hover:underline text-left font-medium"
              onClick={() => void open(a.id)}
            >
              {a.fileName}
            </button>
            <span className="text-slate-400 text-[9px]">
              {" "}
              {a.size >= 1024 ? `${Math.round(a.size / 1024)} Ko` : `${a.size} o`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RequestsPage() {
  const { isLoaded, user } = useUser();
  const [items, setItems] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalNoteById, setInternalNoteById] = useState<Record<string, string>>({});
  const [requesterNoteById, setRequesterNoteById] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [routeOptions, setRouteOptions] = useState<Array<{ id: string; label: string; category: string }>>([]);
  const [submittedItems, setSubmittedItems] = useState<SubmittedRequest[]>([]);
  const didScrollToMesDemandes = useRef(false);
  const [dropTarget, setDropTarget] = useState<BoardColumnKey | null>(null);
  const [commentFilesInternalById, setCommentFilesInternalById] = useState<Record<string, File[]>>({});
  const [commentFilesRequesterById, setCommentFilesRequesterById] = useState<Record<string, File[]>>({});
  const [pinnedCardId, setPinnedCardId] = useState<string | null>(null);
  const draggedRequestIdRef = useRef<string | null>(null);
  const [hasStaffBoard, setHasStaffBoard] = useState(false);
  const [delegateEmailById, setDelegateEmailById] = useState<Record<string, string>>({});
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const { isProfesseur } = useMemo(() => {
    if (!user) { return { isProfesseur: false }}
    const roleRaw = user.publicMetadata?.role;
    const rawRoles = Array.isArray(roleRaw) ? roleRaw.map(String) : roleRaw ? [String(roleRaw)] : [];
    const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]+/g, "_");
    const normalized = rawRoles.map(norm);
    const isProfesseur = normalized.includes("professeur");
    return { isProfesseur };
  }, [user]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resSubmitted = await fetch("/api/requests/list?scope=submitted", { cache: "no-store" });
      const dataSubmitted = await resSubmitted.json();
      if (resSubmitted.ok) setSubmittedItems(Array.isArray(dataSubmitted) ? dataSubmitted : []);
      const resTeam = await fetch("/api/requests/list?scope=board", { cache: "no-store" });
      const dataTeam = await resTeam.json();
      if (resTeam.ok) {
        setHasStaffBoard(true);
        setItems(Array.isArray(dataTeam) ? dataTeam : []);
      } else {
        setHasStaffBoard(false);
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!isLoaded || !user) return;
    void load();
  }, [isLoaded, user, load]);
  useEffect(() => {
    if (!isLoaded || loading || didScrollToMesDemandes.current) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#mes-demandes") return;
    didScrollToMesDemandes.current = true;
    requestAnimationFrame(() => {
      document.getElementById("mes-demandes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [isLoaded, loading]);

  useEffect(() => {
    if (!isLoaded || !user || !hasStaffBoard || loading) return;
    const loadRoutes = async () => {
      try {
        const res = await fetch("/api/requests/routes", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setRouteOptions(data);
      } catch {
        /* ignore */
      }
    };
    loadRoutes();
  }, [isLoaded, user, hasStaffBoard, loading]);
  const BOARD_MOVE_MIN_VISIBLE_MS = 520;
  const waitBoardMutationMinVisible = async (startedAt: number) => {
    const elapsed = Date.now() - startedAt;
    const rest = BOARD_MOVE_MIN_VISIBLE_MS - elapsed;
    if (rest > 0) await new Promise((r) => setTimeout(r, rest));
  };
  const moveStatus = async (id: string, status: RequestStatus) => {
    const t0 = Date.now();
    setSubmittingId(id);
    try {
      await fetch("/api/requests/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      await waitBoardMutationMinVisible(t0);
      setSubmittingId(null);
    }
  };
  const reassign = async (id: string, assignRouteId: string) => {
    if (!assignRouteId) return;
    setSubmittingId(id);
    try {
      await fetch("/api/requests/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, assignRouteId }),
      });
      await load();
    } finally {
      setSubmittingId(null);
    }
  };
  const claimAction = async (id: string, action: "claim" | "release_claim", toCorbeille?: boolean) => {
    const t0 = Date.now();
    setSubmittingId(id);
    try {
      await fetch("/api/requests/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...(toCorbeille ? { toCorbeille: true } : {}) }),
      });
      await load();
    } finally {
      await waitBoardMutationMinVisible(t0);
      setSubmittingId(null);
    }
  };
  const delegateClaim = async (id: string) => {
    const targetEmail = (delegateEmailById[id] || "").trim();
    if (!targetEmail) return;
    const t0 = Date.now();
    setSubmittingId(id);
    try {
      await fetch("/api/requests/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delegate_claim", targetEmail }),
      });
      setDelegateEmailById((prev) => ({ ...prev, [id]: "" }));
      await load();
    } finally {
      await waitBoardMutationMinVisible(t0);
      setSubmittingId(null);
    }
  };
  const claimSelf = async (id: string, status?: RequestStatus) => {
    const t0 = Date.now();
    setSubmittingId(id);
    try {
      await fetch("/api/requests/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "claim_self", ...(status ? { status } : {}) }),
      });
      await load();
    } finally {
      await waitBoardMutationMinVisible(t0);
      setSubmittingId(null);
    }
  };
  const onBoardColumnDrop = (targetCol: BoardColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (targetCol === "CORBEILLE") {
      if (!item.boardCanReassign) return;
      void claimAction(id, "release_claim", true);
      return;
    }
    if (targetCol === "NOUVELLES") return;
    void (async () => {
      if (targetCol === "EN_COURS") {
        if (item.status === "EN_COURS" || item.status === "NOUVELLE") {
          const claimedByMe =
            Boolean(userEmail && item.assignedTo.claimedBy?.email && normEmail(item.assignedTo.claimedBy.email) === normEmail(userEmail));
          if (claimedByMe) return;
        }
        await claimSelf(id, "EN_COURS");
        return;
      }
      if (targetCol === "EN_ATTENTE") await moveStatus(id, "EN_ATTENTE");
      if (targetCol === "TERMINEE") await moveStatus(id, "TERMINEE");
    })();
  };
  const sendComment = async (id: string, toRequester: boolean) => {
    const comment = toRequester ? (requesterNoteById[id] || "").trim() : (internalNoteById[id] || "").trim();
    const files = toRequester ? (commentFilesRequesterById[id] ?? []) : (commentFilesInternalById[id] ?? []);
    if (!comment && files.length === 0) return;
    setSubmittingId(id);
    try {
      if (files.length > 0) {
        const fd = new FormData();
        fd.append("id", id);
        fd.append("comment", comment);
        fd.append("toRequester", String(toRequester));
        files.forEach((f) => fd.append("files", f));
        await fetch("/api/requests/update", { method: "PATCH", body: fd });
      } else {
        await fetch("/api/requests/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, comment, toRequester }),
        });
      }
      if (toRequester) {
        setRequesterNoteById((prev) => ({ ...prev, [id]: "" }));
        setCommentFilesRequesterById((prev) => ({ ...prev, [id]: [] }));
      } else {
        setInternalNoteById((prev) => ({ ...prev, [id]: "" }));
        setCommentFilesInternalById((prev) => ({ ...prev, [id]: [] }));
      }
      await load();
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isLoaded) return <main className="max-w-7xl mx-auto p-6">Chargement...</main>;
  if (!user) return <main className="max-w-7xl mx-auto p-6">Connexion requise.</main>;
  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-10 mt-[9vh] text-sm text-slate-600">
        Chargement des demandes…
      </main>
    );
  }
  if (!isProfesseur && !hasStaffBoard) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 mt-[9vh] text-sm text-slate-700">
        Accès refusé. Le suivi des demandes est réservé aux enseignants (leurs dépôts) et au personnel figurant dans la table
        équipe des demandes ou disposant d’un rôle personnel adapté dans Clerk.
      </main>
    );
  }
  if (!hasStaffBoard && isProfesseur) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 mt-[9vh] pb-24">
        <h1 className="text-2xl font-black text-slate-900">Suivi de vos demandes</h1>
        <p className="text-sm text-slate-600 mt-1">
          En tant qu’enseignant, vous voyez uniquement les demandes que vous avez déposées. Le tableau de traitement des demandes
          (équipe OGEC) n’est pas accessible depuis votre compte. Pour créer une demande, utilisez la bulle d’assistant puis{" "}
          <strong>Créer une demande</strong>.
        </p>
        <div className="mt-8">
          <MesDemandesSuivi items={submittedItems} loading={loading} intro="État d’avancement et service en charge (sans codes techniques)."/>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1500px] mx-auto px-4 py-8 mt-[9vh]">
      <h1 className="text-2xl font-black text-slate-900">Récapitulatif des demandes</h1>
     
      {loading ? <p className="mt-6 text-sm text-slate-500">Chargement des demandes...</p> : null}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {BOARD_COLUMNS.map((col) => (
          <section
            key={col.key}
            className={`bg-white border rounded-2xl p-2.5 min-h-[220px] transition-shadow ${
              dropTarget === col.key ? "border-sky-500 ring-2 ring-sky-300 shadow-md" : "border-slate-200"
            }`}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDropTarget(null);
            }}
          >
            <h2 className="text-xs font-black text-slate-900 mb-1 tracking-tight">{col.title}</h2>
            <p className="text-[9px] text-slate-400 mb-2 leading-tight">{col.hint}</p>
            <div
              className="space-y-2 min-h-[120px]"
              onDragOver={(e) => {
                e.preventDefault();
                if (col.acceptDrop) {
                  e.dataTransfer.dropEffect = "move";
                  setDropTarget(col.key);
                } else {
                  e.dataTransfer.dropEffect = "none";
                }
              }}
              onDrop={(e) => {
                if (col.acceptDrop) void onBoardColumnDrop(col.key, e);
                else {
                  e.preventDefault();
                  setDropTarget(null);
                }
              }}
            >
              {items.filter((r) => r.boardColumn === col.key).map((r) => {
                const pool = r.assignedTo.poolEmails && r.assignedTo.poolEmails.length > 0 ? r.assignedTo.poolEmails : [r.assignedTo.email];
                const isCorbeilleCard = r.assignedTo.routeId === "corbeille" || r.assignedTo.unit === "corbeille" || r.assignedTo.unit === "tri.inconnu";
                const sharedPool = isCorbeilleCard || (r.assignedTo.poolEmails?.length ?? 0) > 1;
                const inPool = Boolean(userEmail && pool.some((p) => normEmail(p) === normEmail(userEmail)));
                const claimed = r.assignedTo.claimedBy;
                const claimedByOther = claimed?.email && userEmail && normEmail(claimed.email) !== normEmail(userEmail);
                const claimedByMe = claimed?.email && userEmail && normEmail(claimed.email) === normEmail(userEmail);
                const showPoolClaim = sharedPool && inPool && !claimed;
                const showSelfClaim = !claimedByMe && (!claimed || Boolean(claimedByOther)) && !(sharedPool && inPool && !claimed);
                const isPinned = pinnedCardId === r.id;
                return (
                <article
                  key={r.id}
                  draggable={!submittingId}
                  onDragStart={(e) => {
                    draggedRequestIdRef.current = r.id;
                    e.dataTransfer.setData("text/plain", r.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDropTarget(col.key);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    void onBoardColumnDrop(col.key, e);
                  }}
                  onDragEnd={() => {
                    setDropTarget(null);
                    window.setTimeout(() => {
                      draggedRequestIdRef.current = null;
                    }, 80);
                  }}
                  onClickCapture={(e) => {
                    if (submittingId === r.id) return;
                    if (draggedRequestIdRef.current === r.id) return;
                    const t = e.target;
                    if (!(t instanceof Element)) return;
                    if (t.closest("button, a, input, select, textarea, option")) return;
                    setPinnedCardId((id) => (id === r.id ? null : r.id));
                  }}
                  title="Glisser pour déplacer · Clic n’importe où sur la fiche pour épingler ou réduire le détail"
                  className={`group relative rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/95 p-2 shadow-sm cursor-grab active:cursor-grabbing transition-shadow duration-300 ease-out hover:z-20 hover:shadow-md hover:border-slate-300/90 motion-safe:hover:translate-y-[-1px] motion-reduce:hover:translate-y-0 ${
                    isPinned ? "z-20 shadow-md ring-1 ring-slate-300/80" : ""
                  }`}
                >
                  {submittingId === r.id ? (
                    <div
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-[11px] bg-white/80 backdrop-blur-[2px] motion-reduce:bg-white/92 motion-reduce:backdrop-blur-none"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      <span
                        className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-sky-600 motion-safe:animate-spin motion-reduce:border-slate-400 motion-reduce:border-t-slate-600 motion-reduce:animate-none"
                        aria-hidden
                      />
                      <span className="text-[9px] font-semibold text-slate-600">Enregistrement…</span>
                    </div>
                  ) : null}
                  <div className="flex gap-1 items-start rounded-lg -mx-0.5 px-0.5 pt-0.5 pb-1 hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 truncate max-w-[min(100%,7rem)]">
                          {r.category}
                        </span>
                        {r.attachments?.length ? (
                          <span
                            className="text-[8px] font-bold tabular-nums text-sky-800 bg-sky-100/90 px-1 py-px rounded"
                            title={`${r.attachments.length} pièce(s) jointe(s)`}
                          >
                            {r.attachments.length} PJ
                          </span>
                        ) : null}
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            claimedByMe
                              ? "bg-emerald-500"
                              : claimedByOther
                                ? "bg-amber-500"
                                : sharedPool
                                  ? "bg-indigo-400 ring-2 ring-indigo-200"
                                  : "bg-slate-300"
                          }`}
                          title={
                            claimedByMe
                              ? "Vous traitez"
                              : claimedByOther
                                ? "Collègue sur la fiche"
                                : sharedPool
                                  ? "File équipe"
                                  : "Libre"
                          }
                        />
                      </div>
                      <h3 className="text-[11px] font-bold text-slate-900 leading-snug mt-0.5 line-clamp-2">
                        {r.subject}
                      </h3>
                      <p className="text-[9px] text-slate-500 leading-snug mt-0.5 line-clamp-3 opacity-95">
                        {r.description}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                        {requesterShort(r.requester.fullName)}
                      </p>
                    </div>
                    <button
                      type="button"
                      draggable={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (draggedRequestIdRef.current === r.id) return;
                        setPinnedCardId((id) => (id === r.id ? null : r.id));
                      }}
                      className="shrink-0 -mr-0.5 -mt-0.5 rounded-lg px-1.5 py-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-800 transition-colors"
                      aria-expanded={isPinned}
                      aria-label={isPinned ? "Réduire la fiche" : "Épingler le détail"}
                      title="Épingler / réduire"
                    >
                      <span className="text-sm font-bold leading-none">{isPinned ? "▴" : "⋯"}</span>
                    </button>
                  </div>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] ease-out motion-reduce:transition-opacity motion-reduce:duration-200 ${
                      isPinned
                        ? "grid-rows-[1fr] opacity-100 duration-[950ms] delay-[120ms] motion-reduce:delay-0 motion-reduce:duration-200"
                        : "grid-rows-[0fr] opacity-0 duration-[650ms] delay-0 md:group-hover:grid-rows-[1fr] md:group-hover:opacity-100 md:group-hover:duration-[900ms] md:group-hover:delay-[180ms] motion-reduce:md:group-hover:grid-rows-[0fr] motion-reduce:md:group-hover:opacity-0 motion-reduce:md:group-hover:duration-200 motion-reduce:md:group-hover:delay-0"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mt-2 space-y-2 border-t border-slate-200/50 pt-2">
                    <p className="text-[10px] text-slate-600 leading-relaxed">{r.description}</p>
                    <RequestAttachmentLinks requestId={r.id} items={r.attachments} />
                    <p className="text-[10px] text-slate-700">
                      <span className="font-semibold text-slate-800">{r.requester.fullName}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="break-all">{r.requester.email}</span>
                    </p>
                    <p className="text-[10px] text-slate-700">
                      <span className="font-semibold text-slate-800">Service :</span> {r.assignedTo.roleLabel}
                    </p>
                    {r.assignedTo.routeId ? (
                      <p className="text-[8px] text-slate-400" title="Référence interne (routage)">
                        Réf. {r.assignedTo.routeId.replace(/\./g, " · ")}
                      </p>
                    ) : null}
                    {isCorbeilleCard ? (
                      <p className="text-[9px] text-amber-900 bg-amber-50/90 rounded px-1.5 py-1">
                        Corbeille établissement — toute l’équipe peut prendre la demande.
                      </p>
                    ) : sharedPool ? (
                      <p className="text-[9px] text-indigo-800 bg-indigo-50/80 rounded px-1.5 py-1">
                        File d’attente partagée : {pool.length} membre(s) du service peuvent prendre la demande.
                      </p>
                    ) : null}
                    {claimed?.email ? (
                      <p className={`text-[10px] font-medium ${claimedByOther ? "text-amber-800" : "text-emerald-800"}`}>
                        {claimedByOther
                          ? `→ ${claimed.name || claimed.email}`
                          : "→ Vous"}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {showPoolClaim ? (
                        <button
                          type="button"
                          disabled={submittingId === r.id}
                          onClick={() => void claimAction(r.id, "claim")}
                          className="text-[9px] px-2 py-1 rounded-md bg-indigo-600 text-white disabled:opacity-50 font-bold"
                        >
                          Prendre
                        </button>
                      ) : null}
                      {showSelfClaim ? (
                        <button
                          type="button"
                          disabled={submittingId === r.id}
                          onClick={() => void claimSelf(r.id, "EN_COURS")}
                          className="text-[9px] px-2 py-1 rounded-md bg-emerald-600 text-white disabled:opacity-50 font-bold"
                        >
                          M’attribuer
                        </button>
                      ) : null}
                      {claimedByMe ? (
                        <button
                          type="button"
                          disabled={submittingId === r.id}
                          onClick={() => void claimAction(r.id, "release_claim")}
                          className="text-[9px] px-2 py-1 rounded-md border border-slate-300 text-slate-800 disabled:opacity-50 font-bold"
                        >
                          Libérer
                        </button>
                      ) : null}
                      {r.boardCanReassign ? (
                        <button
                          type="button"
                          disabled={submittingId === r.id}
                          onClick={() => void claimAction(r.id, "release_claim", true)}
                          className="text-[9px] px-2 py-1 rounded-md bg-amber-600 text-white disabled:opacity-50 font-bold"
                          title="Renvoyer à la corbeille établissement (responsable du service)"
                        >
                          Corbeille
                        </button>
                      ) : null}
                    </div>
                    {r.boardCanDelegate && (r.delegateTargets?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1 items-center mt-1">
                        <label htmlFor={`delegate-${r.id}`} className="text-[8px] font-bold text-violet-900 shrink-0">
                          Déléguer
                        </label>
                        <select
                          id={`delegate-${r.id}`}
                          disabled={submittingId === r.id}
                          value={delegateEmailById[r.id] ?? ""}
                          onChange={(e) =>
                            setDelegateEmailById((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                          className="min-w-0 flex-1 max-w-[14rem] rounded-md border border-violet-200 p-1 text-[9px] bg-white"
                        >
                          <option value="">Choisir…</option>
                          {(r.delegateTargets ?? []).map((em) => (
                            <option key={em} value={em}>
                              {em}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={
                            submittingId === r.id || !(delegateEmailById[r.id] || "").trim()
                          }
                          onClick={() => void delegateClaim(r.id)}
                          className="text-[9px] px-2 py-1 rounded-md bg-violet-600 text-white disabled:opacity-50 font-bold shrink-0"
                        >
                          OK
                        </button>
                      </div>
                    ) : null}
                    {r.routing?.suggestedRouteId ? (
                      <p className="text-[9px] text-amber-800 bg-amber-50/80 rounded px-1.5 py-0.5">
                        Suggestion IA :{" "}
                        {(() => {
                          const opt = routeOptions.find((o) => o.id === r.routing?.suggestedRouteId);
                          return opt ? `${opt.category} — ${opt.label}` : r.routing.suggestedRouteId.replace(/\./g, " · ");
                        })()}
                      </p>
                    ) : null}
                    {r.routing?.reason ? (
                      <p className="text-[9px] text-slate-500 leading-snug" title={r.routing.reason}>
                        {r.routing.reason}
                      </p>
                    ) : null}
                    {r.boardCanReassign ? (
                      <>
                        <label className="block text-[9px] font-bold text-slate-500">
                          Renvoyer vers un autre service (réaffectation — responsables uniquement)
                        </label>
                        <select
                          defaultValue=""
                          disabled={submittingId === r.id}
                          onChange={(e) => {
                            const v = e.target.value;
                            e.target.value = "";
                            if (v) void reassign(r.id, v);
                          }}
                          className="w-full rounded-md border border-slate-200 p-1.5 text-[9px] bg-white"
                        >
                          <option value="">Choisir un service…</option>
                          {routeOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.category} — {opt.label}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : null}
                    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2">
                      <div>
                        <p className="text-[9px] font-black text-slate-800 uppercase tracking-wide">1 — Note équipe</p>
                        <p className="text-[8px] text-slate-500 mt-0.5">
                          Réservé au personnel : reste sur la fiche, <span className="font-semibold">aucun e-mail</span> au demandeur.
                        </p>
                      </div>
                      <textarea
                        value={internalNoteById[r.id] || ""}
                        onChange={(e) => setInternalNoteById((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        rows={2}
                        placeholder="Votre note interne…"
                        className="w-full rounded-md border border-slate-200 p-1.5 text-[10px] bg-white"
                      />
                      <label className="block text-[8px] font-bold text-slate-500">Fichiers (optionnel, interne)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                        disabled={submittingId === r.id}
                        className="w-full text-[9px] text-slate-600 file:mr-1 file:rounded file:border-0 file:bg-slate-200 file:px-1.5 file:py-0.5"
                        onChange={(e) => {
                          const list = e.target.files ? Array.from(e.target.files) : [];
                          setCommentFilesInternalById((prev) => ({
                            ...prev,
                            [r.id]: [...(prev[r.id] ?? []), ...list].slice(0, 12),
                          }));
                          e.target.value = "";
                        }}
                      />
                      {(commentFilesInternalById[r.id]?.length ?? 0) > 0 ? (
                        <ul className="space-y-0.5">
                          {(commentFilesInternalById[r.id] ?? []).map((f, i) => (
                            <li
                              key={`${r.id}-int-${f.name}-${i}`}
                              className="flex justify-between gap-2 text-[8px] text-slate-600 bg-white rounded px-1.5 py-0.5 border border-slate-100"
                            >
                              <span className="truncate">{f.name}</span>
                              <button
                                type="button"
                                className="shrink-0 text-red-700 font-bold"
                                onClick={() =>
                                  setCommentFilesInternalById((prev) => ({
                                    ...prev,
                                    [r.id]: (prev[r.id] ?? []).filter((_, j) => j !== i),
                                  }))
                                }
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void sendComment(r.id, false)}
                        disabled={submittingId === r.id}
                        className="w-full text-[9px] px-2 py-1.5 rounded-md bg-slate-700 text-white disabled:opacity-50 font-bold"
                      >
                        Enregistrer la note équipe
                      </button>
                    </div>
                    <div className="mt-2 space-y-2 rounded-lg border border-sky-200 bg-sky-50/60 p-2">
                      <div>
                        <p className="text-[9px] font-black text-sky-900 uppercase tracking-wide">2 — Message au demandeur</p>
                        <p className="text-[8px] text-slate-600 mt-0.5">
                          Part en <span className="font-semibold">e-mail</span> à {r.requester.fullName} ({r.requester.email}), avec les fichiers ci-dessous
                          si vous en ajoutez.
                        </p>
                      </div>
                      <textarea
                        value={requesterNoteById[r.id] || ""}
                        onChange={(e) => setRequesterNoteById((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        rows={2}
                        placeholder="Message que recevra le demandeur…"
                        className="w-full rounded-md border border-sky-200 p-1.5 text-[10px] bg-white"
                      />
                      <label className="block text-[8px] font-bold text-sky-800">Fichiers pour le demandeur (optionnel)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                        disabled={submittingId === r.id}
                        className="w-full text-[9px] text-slate-600 file:mr-1 file:rounded file:border-0 file:bg-sky-200 file:px-1.5 file:py-0.5"
                        onChange={(e) => {
                          const list = e.target.files ? Array.from(e.target.files) : [];
                          setCommentFilesRequesterById((prev) => ({
                            ...prev,
                            [r.id]: [...(prev[r.id] ?? []), ...list].slice(0, 12),
                          }));
                          e.target.value = "";
                        }}
                      />
                      {(commentFilesRequesterById[r.id]?.length ?? 0) > 0 ? (
                        <ul className="space-y-0.5">
                          {(commentFilesRequesterById[r.id] ?? []).map((f, i) => (
                            <li
                              key={`${r.id}-req-${f.name}-${i}`}
                              className="flex justify-between gap-2 text-[8px] text-slate-600 bg-white rounded px-1.5 py-0.5 border border-sky-100"
                            >
                              <span className="truncate">{f.name}</span>
                              <button
                                type="button"
                                className="shrink-0 text-red-700 font-bold"
                                onClick={() =>
                                  setCommentFilesRequesterById((prev) => ({
                                    ...prev,
                                    [r.id]: (prev[r.id] ?? []).filter((_, j) => j !== i),
                                  }))
                                }
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void sendComment(r.id, true)}
                        disabled={submittingId === r.id}
                        className="w-full text-[9px] px-2 py-1.5 rounded-md bg-sky-600 text-white disabled:opacity-50 font-bold"
                      >
                        Envoyer par e-mail au demandeur
                      </button>
                    </div>
                    {r.comments.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                        {r.comments.slice(-3).map((c) => (
                          <div key={c.id} className="rounded-md border border-slate-100 bg-white/90 p-1.5">
                            <p className="text-[9px] text-slate-600">
                              <span className="font-semibold text-slate-800">{c.by}</span> {c.content}
                            </p>
                            <RequestAttachmentLinks requestId={r.id} items={c.attachments} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-14">
        <MesDemandesSuivi
          items={submittedItems}
          loading={loading}
          intro="Demandes que vous avez déposées (chatbot ou autre) : statut et service qui les traite, sans codes techniques."
        />
      </div>
    </main>
  );
}