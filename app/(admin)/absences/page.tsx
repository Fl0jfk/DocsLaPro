"use client";

import { useMemo, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

type AbsenceScope = "professeur" | "ogec";
type Etablissement = "École" | "Collège" | "Lycée";
type AbsenceWorkflowStatus = "OUVERTE" | "JUSTIFICATIF_DEPOSE" | "CLOTUREE";
type AbsenceDecision = "EN_ATTENTE" | "VALIDEE" | "REFUSEE";

type AbsenceItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    userId: string;
    name: string;
    email: string;
    roles: string[];
  };
  data: {
    scope: AbsenceScope;
    etablissement: Etablissement | null;
    startDate: string;
    endDate: string;
    reason: string;
    details: string;
  };
  workflowStatus: AbsenceWorkflowStatus;
  managerDecision: AbsenceDecision;
  closedAt?: string | null;
  justification?: {
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null;
  managerNote?: string;
};

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");

export default function AbsencesPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<AbsenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etablissement, setEtablissement] = useState<Etablissement>("Collège");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [justificationFile, setJustificationFile] = useState<File | null>(null);
  const [managerNotes, setManagerNotes] = useState<Record<string, string>>({});
  const [uploadingJustificationId, setUploadingJustificationId] = useState<string | null>(null);
  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : rolesRaw ? [String(rolesRaw)] : [];
  const isDirectionEcole = roles.some((r) => norm(r).includes("directionecole"));
  const isDirectionCollege = roles.some((r) => norm(r).includes("directioncollege"));
  const isDirectionLycee = roles.some((r) => norm(r).includes("directionlycee"));
  const isCompta = roles.some((r) => norm(r).includes("comptabilite"));
  const isTeacher = roles.some((r) => norm(r).includes("professeur"));
  const scope: AbsenceScope = isTeacher ? "professeur" : "ogec";
  const canManageSome = isDirectionEcole || isDirectionCollege || isDirectionLycee || isCompta;
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/absences");
      if (!res.ok) throw new Error("Chargement impossible");
      const data = await res.json();
      setItems(data || []);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) fetchItems();
  }, [isLoaded, user]);

  const submitAbsence = async () => {
    setError(null);
    if (!startDate || !endDate || !reason.trim()) {
      setError("Merci de remplir les champs obligatoires.");
      return;
    }
    if (scope === "professeur" && !etablissement) {
      setError("Merci de choisir un établissement.");
      return;
    }
    try {
      setSaving(true);
      let justification: { fileName: string; fileUrl: string } | null = null;
      if (justificationFile) {
        const presignRes = await fetch("/api/travels/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: justificationFile.name,
            fileType: justificationFile.type || "application/octet-stream",
          }),
        });
        const presignPayload = await presignRes.json();
        if (!presignRes.ok || !presignPayload?.uploadUrl || !presignPayload?.fileUrl) {
          throw new Error("Impossible de préparer l'upload du justificatif.");
        }
        await fetch(presignPayload.uploadUrl, {
          method: "PUT",
          body: justificationFile,
          headers: { "Content-Type": justificationFile.type || "application/octet-stream" },
        });
        justification = {
          fileName: justificationFile.name,
          fileUrl: presignPayload.fileUrl,
        };
      }

      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            etablissement: scope === "professeur" ? etablissement : null,
            startDate,
            endDate,
            reason: reason.trim(),
            details: details.trim(),
            justification,
          },
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Échec création");
      setStartDate("");
      setEndDate("");
      setReason("");
      setDetails("");
      setJustificationFile(null);
      await fetchItems();
    } catch (e: any) {
      setError(e?.message || "Erreur de création.");
    } finally {
      setSaving(false);
    }
  };

  const canManageItem = (item: AbsenceItem) => {
    if (item.data.scope === "ogec") return canManageSome;
    if (item.data.etablissement === "École") return isDirectionEcole;
    if (item.data.etablissement === "Collège") return isDirectionCollege;
    if (item.data.etablissement === "Lycée") return isDirectionLycee;
    return false;
  };

  const updateWorkflow = async (id: string, action: "VALIDER" | "REFUSER" | "RELANCER_JUSTIFICATIF") => {
    try {
      const res = await fetch("/api/absences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          managerNote: managerNotes[id] || "",
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Échec mise à jour");
      await fetchItems();
    } catch (e: any) {
      alert(e?.message || "Erreur mise à jour.");
    }
  };

  const uploadJustification = async (id: string, file: File) => {
    try {
      setUploadingJustificationId(id);
      const presignRes = await fetch("/api/travels/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type || "application/octet-stream" }),
      });
      const presignPayload = await presignRes.json();
      if (!presignRes.ok || !presignPayload?.uploadUrl || !presignPayload?.fileUrl) {
        throw new Error("Impossible de préparer l'upload du justificatif.");
      }

      await fetch(presignPayload.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      const patchRes = await fetch("/api/absences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "DEPOSER_JUSTIFICATIF",
          justification: {
            fileName: file.name,
            fileUrl: presignPayload.fileUrl,
          },
        }),
      });
      const payload = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) throw new Error(payload?.error || "Échec dépôt justificatif.");
      await fetchItems();
    } catch (e: any) {
      alert(e?.message || "Erreur dépôt justificatif.");
    } finally {
      setUploadingJustificationId(null);
    }
  };

  const openSecureFile = async (fileUrl: string) => {
    const newWindow = window.open("", "_blank");
    try {
      const res = await fetch("/api/travels/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data?.signedUrl) throw new Error("Impossible d'ouvrir le justificatif.");
      if (newWindow) {
        newWindow.location.href = data.signedUrl;
      } else {
        window.location.href = data.signedUrl;
      }
    } catch (e: any) {
      if (newWindow) newWindow.close();
      alert(e?.message || "Erreur d'accès au justificatif.");
    }
  };

  const statusStyle = (s: AbsenceWorkflowStatus) =>
    s === "CLOTUREE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "JUSTIFICATIF_DEPOSE"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  const decisionStyle = (d: AbsenceDecision) =>
    d === "VALIDEE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : d === "REFUSEE"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  const sorted = useMemo(() => [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [items]);
  const openItems = sorted.filter((i) => i.workflowStatus !== "CLOTUREE");
  const closedItems = sorted.filter((i) => i.workflowStatus === "CLOTUREE");

  if (!isLoaded) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900">Déclaration des absences</h1>
        <p className="text-slate-500 font-medium mt-2">Une absence reste ouverte jusqu'au dépôt du justificatif puis clôture par direction/comptabilité.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 h-fit">
          <h2 className="text-xl font-black text-slate-900 mb-4">Nouvelle absence</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-black text-slate-700">Type détecté automatiquement :</span>{" "}
              <span className="font-semibold text-slate-800">{scope === "professeur" ? "Professeur" : "Personnel OGEC"}</span>
            </div>

            {scope === "professeur" && (
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
            )}

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">Date début</label>
              <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">Date fin</label>
              <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">Motif</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                type="text"
                placeholder="Ex: Rendez-vous médical"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">Détails (optionnel)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                Pièce justificative (optionnel)
              </label>
              <input
                type="file"
                onChange={(e) => setJustificationFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
              />
              {justificationFile && (
                <p className="text-xs text-slate-500 mt-1">
                  Fichier sélectionné: <span className="font-semibold">{justificationFile.name}</span>
                </p>
              )}
            </div>

            {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}

            <button
              type="button"
              onClick={submitAbsence}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Déclarer l'absence"}
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4">
            <h3 className="font-black text-slate-900">Absences ouvertes</h3>
            <p className="text-xs text-slate-500">Visibles tant qu'elles ne sont pas clôturées (utile pour voir qui est encore absent).</p>
          </div>
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-500">Chargement des absences...</div>
          ) : openItems.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-slate-500">Aucune absence visible pour le moment.</div>
          ) : (
            openItems.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-5">
                <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                  <div>
                    <p className="font-black text-slate-900">
                      {item.createdBy.name} — {item.data.scope === "ogec" ? "Personnel OGEC" : `Professeur (${item.data.etablissement})`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Du {new Date(item.data.startDate).toLocaleDateString("fr-FR")} au {new Date(item.data.endDate).toLocaleDateString("fr-FR")} • {item.createdBy.email || "email non renseigné"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${statusStyle(item.workflowStatus)}`}>
                      {item.workflowStatus === "OUVERTE"
                        ? "OUVERTE"
                        : item.workflowStatus === "JUSTIFICATIF_DEPOSE"
                        ? "JUSTIFICATIF DÉPOSÉ"
                        : "CLOTURÉE"}
                    </span>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${decisionStyle(item.managerDecision || "EN_ATTENTE")}`}>
                      {item.managerDecision === "VALIDEE" ? "VALIDÉE" : item.managerDecision === "REFUSEE" ? "REFUSÉE" : "DÉCISION EN ATTENTE"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mb-1">
                  <span className="font-bold">Motif:</span> {item.data.reason}
                </p>
                {item.data.details && (
                  <p className="text-sm text-slate-600 mb-3">
                    <span className="font-bold">Détails:</span> {item.data.details}
                  </p>
                )}
                {item.managerNote && (
                  <p className="text-sm text-indigo-700 mb-3">
                    <span className="font-bold">Note direction/compta:</span> {item.managerNote}
                  </p>
                )}
                {item.justification?.fileUrl ? (
                  <p className="text-sm text-slate-700 mb-3">
                    <span className="font-bold">Justificatif:</span>{" "}
                    <button
                      type="button"
                      onClick={() => openSecureFile(item.justification!.fileUrl)}
                      className="text-indigo-700 underline font-semibold"
                    >
                      {item.justification.fileName || "Voir le fichier"}
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-amber-700 mb-3 font-semibold">Justificatif en attente</p>
                )}

                {item.createdBy.userId === user?.id && !item.justification?.fileUrl && (
                  <div className="mb-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-50">
                      {uploadingJustificationId === item.id ? "Upload..." : "Déposer justificatif"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          uploadJustification(item.id, f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}

                {canManageItem(item) && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <textarea
                      rows={2}
                      placeholder="Note interne (optionnel)"
                      value={managerNotes[item.id] ?? item.managerNote ?? ""}
                      onChange={(e) => setManagerNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => updateWorkflow(item.id, "VALIDER")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => updateWorkflow(item.id, "REFUSER")}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm"
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => updateWorkflow(item.id, "RELANCER_JUSTIFICATIF")}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
                      >
                        Relancer justificatif
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {closedItems.length > 0 && (
            <div className="mt-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 mb-3">
                <h3 className="font-black text-slate-900">Historique clôturé</h3>
              </div>
              <div className="space-y-3">
                {closedItems.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                    <p className="font-bold text-slate-800">
                      {item.createdBy.name} — {item.data.scope === "ogec" ? "Personnel OGEC" : `Professeur (${item.data.etablissement})`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Du {new Date(item.data.startDate).toLocaleDateString("fr-FR")} au {new Date(item.data.endDate).toLocaleDateString("fr-FR")}
                      {item.closedAt ? ` • Clôturée le ${new Date(item.closedAt).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

