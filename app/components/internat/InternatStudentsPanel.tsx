"use client";

import { useMemo, useState } from "react";
import type { EleveConfig } from "@/app/lib/eleves-config";
import { etablissementFromSecteur } from "@/app/lib/internat-types";
import type { InternatRoom, InternatStudent } from "@/app/lib/internat-types";
import { studentDisplayName } from "@/app/lib/internat-types";

export default function InternatStudentsPanel({
  students,
  rooms,
  canManage,
  onRefresh,
}: {
  students: InternatStudent[];
  rooms: InternatRoom[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [showImport, setShowImport] = useState(false);
  const [eleves, setEleves] = useState<EleveConfig[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingParentsId, setEditingParentsId] = useState<string | null>(null);
  const [parentDraft, setParentDraft] = useState({
    p1nom: "",
    p1email: "",
    p1tel: "",
    p2nom: "",
    p2email: "",
    p2tel: "",
  });

  const [manual, setManual] = useState({
    nom: "",
    prenom: "",
    classe: "",
    sexe: "M" as "M" | "F",
    etablissement: "Lycée" as "Collège" | "Lycée",
    roomId: "",
  });

  const interneKeys = useMemo(
    () =>
      new Set(
        students.map((s) => s.eleveRef.folderName || s.eleveRef.ine || "").filter(Boolean),
      ),
    [students],
  );

  const loadEleves = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/eleves");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chargement impossible");
      const list = (data.eleves || []) as EleveConfig[];
      const filtered = list.filter((e) => {
        const s = String(e.secteur || e.mef || "").toLowerCase();
        return s.includes("college") || s.includes("coll") || s.includes("lycee") || s.includes("lyc");
      });
      setEleves(filtered);
      setShowImport(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const importSelected = async () => {
    const picks = eleves.filter((e) => selected[e.folderName]);
    if (!picks.length) return alert("Sélectionnez au moins un élève.");
    setBusy(true);
    try {
      const res = await fetch("/api/internat/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", eleves: picks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Import impossible");
      setShowImport(false);
      setSelected({});
      await onRefresh();
      alert(`${data.added?.length || 0} interne(s) importé(s).`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const createManual = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/internat/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manual,
          roomId: manual.roomId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Création impossible");
      setManual({ nom: "", prenom: "", classe: "", sexe: "M", etablissement: "Lycée", roomId: "" });
      await onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const openParentEdit = (s: InternatStudent) => {
    setEditingParentsId(s.id);
    setParentDraft({
      p1nom: s.parent1?.nom || "",
      p1email: s.parent1?.email || "",
      p1tel: s.parent1?.telephone || "",
      p2nom: s.parent2?.nom || "",
      p2email: s.parent2?.email || "",
      p2tel: s.parent2?.telephone || "",
    });
  };

  const saveParents = async (id: string) => {
    await updateStudent(id, {
      parent1: {
        nom: parentDraft.p1nom,
        email: parentDraft.p1email,
        telephone: parentDraft.p1tel,
      },
      parent2: {
        nom: parentDraft.p2nom,
        email: parentDraft.p2email,
        telephone: parentDraft.p2tel,
      },
      note: "Contacts parents",
    });
    setEditingParentsId(null);
  };

  const updateStudent = async (id: string, patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/internat/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Mise à jour impossible");
      await onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={loadEleves}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            Importer depuis eleves.json
          </button>
        </div>
      )}

      {showImport && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 max-h-[24rem] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-black">Élèves collège / lycée</h3>
            <button type="button" className="text-sm font-bold text-slate-500" onClick={() => setShowImport(false)}>
              Fermer
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {eleves.map((e) => {
              const taken = interneKeys.has(e.folderName) || (e.ine && interneKeys.has(e.ine));
              return (
                <li key={e.folderName} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={taken}
                    checked={!!selected[e.folderName]}
                    onChange={(ev) =>
                      setSelected((prev) => ({ ...prev, [e.folderName]: ev.target.checked }))
                    }
                  />
                  <span className={taken ? "text-slate-400 line-through" : ""}>
                    {e.prenom} {e.nom} — {e.folderName} ({etablissementFromSecteur(e.secteur)})
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={importSelected}
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            Importer la sélection
          </button>
        </div>
      )}

      {canManage && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-slate-900">Ajout manuel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Nom" value={manual.nom} onChange={(e) => setManual({ ...manual, nom: e.target.value })} />
            <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Prénom" value={manual.prenom} onChange={(e) => setManual({ ...manual, prenom: e.target.value })} />
            <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Classe" value={manual.classe} onChange={(e) => setManual({ ...manual, classe: e.target.value })} />
            <select className="border rounded-xl px-3 py-2 text-sm" value={manual.sexe} onChange={(e) => setManual({ ...manual, sexe: e.target.value as "M" | "F" })}>
              <option value="M">Garçon</option>
              <option value="F">Fille</option>
            </select>
            <select className="border rounded-xl px-3 py-2 text-sm" value={manual.etablissement} onChange={(e) => setManual({ ...manual, etablissement: e.target.value as "Collège" | "Lycée" })}>
              <option value="Lycée">Lycée</option>
              <option value="Collège">Collège</option>
            </select>
            <select className="border rounded-xl px-3 py-2 text-sm" value={manual.roomId} onChange={(e) => setManual({ ...manual, roomId: e.target.value })}>
              <option value="">Chambre —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <button type="button" disabled={busy} onClick={createManual} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm">
            Créer l&apos;interne
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3 font-bold">Interne</th>
              <th className="p-3 font-bold">Classe</th>
              <th className="p-3 font-bold">Établ.</th>
              <th className="p-3 font-bold">Sexe</th>
              <th className="p-3 font-bold">Chambre</th>
              <th className="p-3 font-bold">Parents</th>
              {canManage && <th className="p-3 font-bold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {students.filter((s) => s.actif).map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{studentDisplayName(s)}</td>
                <td className="p-3">{s.classe}</td>
                <td className="p-3">{s.etablissement}</td>
                <td className="p-3">{s.sexe === "M" ? "G" : "F"}</td>
                <td className="p-3">
                  {canManage ? (
                    <select
                      className="border rounded-lg px-2 py-1 text-xs"
                      value={s.roomId || ""}
                      onChange={(e) => updateStudent(s.id, { roomId: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  ) : (
                    rooms.find((r) => r.id === s.roomId)?.label || "—"
                  )}
                </td>
                <td className="p-3 text-xs">
                  {s.parent1?.email || s.parent2?.email ? (
                    <span className="text-slate-600">
                      {[s.parent1?.email, s.parent2?.email].filter(Boolean).join(" · ")}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">À compléter</span>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      className="block mt-1 text-indigo-600 font-bold"
                      onClick={() => openParentEdit(s)}
                    >
                      Modifier
                    </button>
                  )}
                </td>
                {canManage && (
                  <td className="p-3">
                    <button
                      type="button"
                      className="text-xs text-red-600 font-bold"
                      onClick={() => updateStudent(s.id, { actif: false })}
                    >
                      Désactiver
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingParentsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-black text-slate-900">Contacts parents</h3>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-slate-500">Parent 1</p>
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Nom" value={parentDraft.p1nom} onChange={(e) => setParentDraft({ ...parentDraft, p1nom: e.target.value })} />
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="E-mail *" type="email" value={parentDraft.p1email} onChange={(e) => setParentDraft({ ...parentDraft, p1email: e.target.value })} />
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Téléphone" value={parentDraft.p1tel} onChange={(e) => setParentDraft({ ...parentDraft, p1tel: e.target.value })} />
              <p className="text-xs font-bold uppercase text-slate-500 pt-2">Parent 2 (optionnel)</p>
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Nom" value={parentDraft.p2nom} onChange={(e) => setParentDraft({ ...parentDraft, p2nom: e.target.value })} />
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="E-mail" type="email" value={parentDraft.p2email} onChange={(e) => setParentDraft({ ...parentDraft, p2email: e.target.value })} />
              <input className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Téléphone" value={parentDraft.p2tel} onChange={(e) => setParentDraft({ ...parentDraft, p2tel: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600" onClick={() => setEditingParentsId(null)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white"
                onClick={() => saveParents(editingParentsId)}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
