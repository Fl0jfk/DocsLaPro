"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";

type Etablissement = "École" | "Collège" | "Lycée";
type HseStatus = "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";

type HseItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: HseStatus;
  createdBy: { userId: string; name: string; email: string };
  etablissement: Etablissement;
  resumeDemande: string;
  motif: string;
  classe: string;
  details: string;
  decidedBy?: { userId: string; name: string };
  decidedAt?: string;
  directionNote?: string;
};

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");

function rolesFromUser(roleRaw: unknown): string[] {
  return Array.isArray(roleRaw) ? (roleRaw as string[]) : roleRaw ? [String(roleRaw)] : [];
}

function getRoleFlags(roles: string[]) {
  const n = roles.map(norm);
  return {
    isDirectionEcole: n.some((r) => r.includes("direction") && r.includes("ecole")),
    isDirectionCollege: n.some((r) => r.includes("direction") && r.includes("college")),
    isDirectionLycee: n.some((r) => r.includes("direction") && r.includes("lycee")),
    isProfesseur: n.some((r) => r.includes("professeur")),
  };
}

function canCreateDemand(roles: string[]) {
  return getRoleFlags(roles).isProfesseur;
}

function canManageItem(item: HseItem, roles: string[]) {
  const f = getRoleFlags(roles);
  if (item.etablissement === "École") return f.isDirectionEcole;
  if (item.etablissement === "Collège") return f.isDirectionCollege;
  if (item.etablissement === "Lycée") return f.isDirectionLycee;
  return false;
}

function statusBadgeClass(s: HseStatus) {
  if (s === "ACCEPTEE") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "REFUSEE") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

function statusLabel(s: HseStatus) {
  if (s === "ACCEPTEE") return "Acceptée";
  if (s === "REFUSEE") return "Refusée";
  return "En attente";
}

export default function DemandesHsePage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<HseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etablissement, setEtablissement] = useState<Etablissement>("Collège");
  const [resumeDemande, setResumeDemande] = useState("");
  const [motif, setMotif] = useState("");
  const [classe, setClasse] = useState("");
  const [details, setDetails] = useState("");
  const [directionNotes, setDirectionNotes] = useState<Record<string, string>>({});
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const roles = rolesFromUser(user?.publicMetadata?.role);
  const creator = canCreateDemand(roles);
  const dirFlags = getRoleFlags(roles);
  const directionAny = dirFlags.isDirectionEcole || dirFlags.isDirectionCollege || dirFlags.isDirectionLycee;
  const userEmail = user?.primaryEmailAddress?.emailAddress?.trim() ?? "";

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/demandes-hse");
      if (res.status === 403) {
        setItems([]);
        setError("Accès réservé aux enseignants et aux directions.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Chargement impossible.");
      }
      const list = Array.isArray(data?.items) ? (data.items as HseItem[]) : [];
      setItems(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de chargement.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) void fetchItems();
  }, [isLoaded, user, fetchItems]);

  const mine = useMemo(
    () =>
      [...items].filter((i) => i.createdBy.userId === user?.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [items, user?.id],
  );

  const directionPending = useMemo(
    () =>
      [...items]
        .filter((i) => i.status === "EN_ATTENTE" && canManageItem(i, roles))
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [items, roles],
  );

  const directionHistory = useMemo(
    () =>
      [...items]
        .filter((i) => i.status !== "EN_ATTENTE" && canManageItem(i, roles))
        .sort((a, b) => +new Date(b.decidedAt || b.updatedAt) - +new Date(a.decidedAt || a.updatedAt)),
    [items, roles],
  );

  const submit = async () => {
    setError(null);
    if (!resumeDemande.trim()) {
      setError("Renseignez un résumé de votre demande HSE.");
      return;
    }
    if (!motif.trim()) {
      setError("Le motif est obligatoire.");
      return;
    }
    if (!classe.trim()) {
      setError("Indiquez la classe ou le contexte.");
      return;
    }
    if (!details.trim()) {
      setError("Décrivez le contexte (remplacement, modalités, etc.).");
      return;
    }
    if (!userEmail) {
      setError("Votre compte ne comporte pas d’adresse e-mail : impossible de recevoir la décision de la direction.");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/demandes-hse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etablissement,
          resumeDemande: resumeDemande.trim(),
          motif: motif.trim(),
          classe: classe.trim(),
          details: details.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Enregistrement impossible.");
      }
      setResumeDemande("");
      setMotif("");
      setClasse("");
      setDetails("");
      await fetchItems();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l’envoi.");
    } finally {
      setSaving(false);
    }
  };

  const patchStatus = async (id: string, status: "ACCEPTEE" | "REFUSEE") => {
    const confirmed = window.confirm(
      status === "ACCEPTEE"
        ? "Marquer cette demande comme acceptée et notifier le demandeur ?"
        : "Marquer cette demande comme refusée et notifier le demandeur ?",
    );
    if (!confirmed) return;
    try {
      setPatchingId(id);
      setError(null);
      const note = (directionNotes[id] ?? "").trim();
      const res = await fetch("/api/demandes-hse", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, directionNote: note || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Décision impossible.");
      setDirectionNotes((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
      await fetchItems();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setPatchingId(null);
    }
  };

  if (!isLoaded || !user) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900">HSE — heures supplémentaires exceptionnelles</h1>
        <p className="text-slate-500 font-medium mt-2">
          Déposez votre demande d’heures supplémentaires exceptionnelles à la validation de votre direction d’établissement (champs libres).
        </p>
      </div>

      {creator && !userEmail && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 mb-6">
          Compte sans e-mail principal : vous ne pouvez pas déposer une demande tant que Clerk n’a pas d’adresse joignable pour vous (réception de la décision).
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {creator ? (
          <div className="xl:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 h-fit">
            <h2 className="text-xl font-black text-slate-900 mb-4">Nouvelle demande</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">Établissement</label>
                <select
                  value={etablissement}
                  onChange={(e) => setEtablissement(e.target.value as Etablissement)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                >
                  <option>École</option>
                  <option>Collège</option>
                  <option>Lycée</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                  Votre demande (résumé)
                </label>
                <textarea
                  value={resumeDemande}
                  onChange={(e) => setResumeDemande(e.target.value)}
                  rows={3}
                  placeholder="Ex. : HSE pour remplacement le…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">Motif</label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  rows={3}
                  placeholder="Pourquoi de cette demande…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                  Classe / groupe / contexte
                </label>
                <textarea
                  value={classe}
                  onChange={(e) => setClasse(e.target.value)}
                  rows={2}
                  placeholder="Texte libre : classe, niveau, matière…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                  Précisions (contexte, remplacement, modalités…)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={5}
                  placeholder="Tout ce qui aide la direction à comprendre : remplacement, horaires, circonstances…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
              {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving || !userEmail}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              >
                {saving ? "Envoi..." : "Envoyer la demande"}
              </button>
            </div>
          </div>
        ) : (
          error &&
          !directionAny && (
            <div className="xl:col-span-3 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-3">{error}</div>
          )
        )}

        <div className={`space-y-6 ${creator ? "xl:col-span-2" : "xl:col-span-3"}`}>
          {creator && (
            <>
              <div className="bg-white border border-slate-200 rounded-3xl p-4">
                <h3 className="font-black text-slate-900">Mes demandes</h3>
                <p className="text-xs text-slate-500 mt-1">Historique personnel (y compris en attente de traitement).</p>
              </div>
              {loading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-500">Chargement…</div>
              ) : mine.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-slate-500">Aucune demande encore.</div>
              ) : (
                mine.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-5">
                    <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                      <div>
                        <p className="font-black text-slate-900">{item.etablissement} · {item.resumeDemande.slice(0, 80)}{item.resumeDemande.length > 80 ? "…" : ""}</p>
                        <p className="text-xs text-slate-500">
                          Créée le {new Date(item.createdAt).toLocaleString("fr-FR")} — {item.createdBy.email}
                        </p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${statusBadgeClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">
                      <span className="font-bold">Motif :</span> {item.motif}
                    </p>
                    <p className="text-sm text-slate-700 mb-1">
                      <span className="font-bold">Classe / contexte :</span> {item.classe}
                    </p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      <span className="font-bold">Précisions :</span> {item.details}
                    </p>
                    {item.directionNote && (
                      <p className="text-sm text-indigo-800 mt-2">
                        <span className="font-bold">Message direction :</span> {item.directionNote}
                      </p>
                    )}
                    {item.decidedBy && (
                      <p className="text-xs text-slate-500 mt-2">
                        Décision par {item.decidedBy.name} le {item.decidedAt ? new Date(item.decidedAt).toLocaleString("fr-FR") : "—"}
                      </p>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {directionAny && (
            <>
              <div className="bg-white border border-slate-200 rounded-3xl p-4">
                <h3 className="font-black text-slate-900">File de votre pôle</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Demandes HSE pour l’établissement dont vous assurez la direction — en attente ou déjà traitées sur votre périmètre.
                </p>
                {error && !creator && (
                  <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 mt-3">{error}</p>
                )}
              </div>

              {loading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-500">Chargement…</div>
              ) : (
                <>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide px-1">À traiter</h4>
                  {directionPending.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-6 text-slate-500 text-sm">
                      Aucune demande en attente pour votre périmètre.
                    </div>
                  ) : (
                    directionPending.map((item) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-5">
                        <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                          <div>
                            <p className="font-black text-slate-900">
                              {item.createdBy.name} — {item.etablissement}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.createdBy.email} · le {new Date(item.createdAt).toLocaleString("fr-FR")}
                            </p>
                          </div>
                          <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${statusBadgeClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 font-semibold mb-1">{item.resumeDemande}</p>
                        <p className="text-sm text-slate-700 mb-1">
                          <span className="font-bold">Motif :</span> {item.motif}
                        </p>
                        <p className="text-sm text-slate-700 mb-3">
                          <span className="font-bold">Classe / contexte :</span> {item.classe}
                        </p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{item.details}</p>
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                          Note pour le demandeur (optionnel)
                        </label>
                        <textarea
                          rows={2}
                          value={directionNotes[item.id] ?? ""}
                          onChange={(e) => setDirectionNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mb-3"
                          placeholder="Ex. : précision RH, motif du refus…"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={patchingId === item.id}
                            onClick={() => void patchStatus(item.id, "ACCEPTEE")}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-60"
                          >
                            {patchingId === item.id ? "…" : "Accepter"}
                          </button>
                          <button
                            type="button"
                            disabled={patchingId === item.id}
                            onClick={() => void patchStatus(item.id, "REFUSEE")}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm disabled:opacity-60"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide px-1 pt-4">Traitées (pôle)</h4>
                  {directionHistory.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-6 text-slate-500 text-sm">
                      Pas encore d’historique de décision sur votre périmètre.
                    </div>
                  ) : (
                    directionHistory.map((item) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-5 opacity-95">
                        <div className="flex flex-wrap gap-3 items-center justify-between mb-2">
                          <p className="font-black text-slate-900">
                            {item.createdBy.name} — {item.etablissement}
                          </p>
                          <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${statusBadgeClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
                        <p className="text-sm font-semibold text-slate-800 mb-2">{item.resumeDemande}</p>
                        <p className="text-sm text-slate-700">{item.motif}</p>
                        {item.directionNote && (
                          <p className="text-sm text-indigo-800 mt-2">
                            <span className="font-bold">Note :</span> {item.directionNote}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </>
          )}

          {!creator && !directionAny && !loading && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-600">
              Votre profil ne permet pas d’accéder à cette page. Les demandes HSE sont réservées aux enseignants et à leur direction ; contactez
              l’administrateur si vous pensez qu’il s’agit d’une erreur.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
