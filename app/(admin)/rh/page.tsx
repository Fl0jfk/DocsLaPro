"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import PersonnelDashboard from "@/app/components/personnel/PersonnelDashboard";
import PersonnelDepositTab from "@/app/components/personnel/PersonnelDepositTab";
import PersonnelDropZone from "@/app/components/personnel/PersonnelDropZone";
import PersonnelStaffCard from "@/app/components/personnel/PersonnelStaffCard";
import RhNewStaffModal from "@/app/components/personnel/RhNewStaffModal";
import type { PersonnelDashboardData } from "@/app/lib/personnel-dashboard";
import {
  type PersonnelIndexEntry,
  type SharedPersonnelDocument,
} from "@/app/lib/personnel-types";
import { PERSONNEL_DROP_ACCEPT } from "@/app/lib/personnel-upload-client";

export default function RhModulePage() {
  const router = useRouter();
  const { isLoaded } = useUser();
  const [dashboard, setDashboard] = useState<PersonnelDashboardData | null>(null);
  const [index, setIndex] = useState<PersonnelIndexEntry[]>([]);
  const [sharedDocs, setSharedDocs] = useState<SharedPersonnelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "deposit">("dashboard");
  const [quickDepositBusy, setQuickDepositBusy] = useState(false);
  const load = useCallback(async () => {
    setError(null);
    try {
      const [dRes, lRes] = await Promise.all([
        fetch("/api/personnel/dashboard", { cache: "no-store" }),
        fetch("/api/personnel", { cache: "no-store" }),
      ]);
      const dJson = await dRes.json();
      const lJson = await lRes.json();
      if (!dRes.ok) throw new Error(dJson.error || "Dashboard indisponible");
      if (!lRes.ok) throw new Error(lJson.error || "Liste indisponible");
      setDashboard(dJson);
      setIndex(lJson.index || []);
      setSharedDocs(lJson.sharedDocs || []);
      setCanManage(!!lJson.canManage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void load();
  }, [isLoaded, load]);

  const quickDeposit = async (file: File) => {
    setQuickDepositBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/personnel/deposit", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Dépôt impossible");
      await load();
      if (j.matched?.id) router.push(`/rh/${j.matched.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setQuickDepositBusy(false);
    }
  };

  if (!isLoaded || (loading && !dashboard)) {
    return <p className="p-10 text-center text-slate-500">Chargement du module RH…</p>;
  }

  if (error) return <p className="p-10 text-center text-rose-600">{error}</p>;
  if (!dashboard) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {canManage && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["dashboard", "Tableau de bord"],
              ["deposit", "Dépôt IA (détaillé)"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                tab === k ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "deposit" && canManage ? (
        <PersonnelDepositTab onDone={() => void load()} />
      ) : (
        <>
          {canManage && (
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 shadow-sm">
              <p className="text-sm font-black text-indigo-900 mb-1">Déposer un document (IA)</p>
              <p className="text-xs text-indigo-700/80 mb-3">
                Glissez un PDF ou un fichier Office : le collaborateur est identifié automatiquement et le document est rangé dans son dossier.
              </p>
              <PersonnelDropZone
                title={quickDepositBusy ? "Analyse en cours…" : "Glisser-déposer ici"}
                hint="PDF · Excel · Word"
                disabled={quickDepositBusy}
                accept={PERSONNEL_DROP_ACCEPT}
                onFile={quickDeposit}
              />
            </div>
          )}

          <PersonnelDashboard data={dashboard} onNewStaff={() => setShowNew(true)} />

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-black text-slate-800 mb-1">Annuaire RH</h2>
            {canManage && (
              <p className="text-xs text-indigo-600 font-medium mb-4">
                Vous pouvez aussi glisser un fichier directement sur la fiche d&apos;un collaborateur.
              </p>
            )}
            {index.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucun dossier. Créez une première entrée.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {index.map((p) => (
                  <PersonnelStaffCard key={p.id} person={p} canDrop={canManage} onUploaded={() => void load()} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-black text-slate-800 mb-2">Documents utiles (tous les collaborateurs)</h2>
            <p className="text-xs text-slate-500 mb-4">Règlement intérieur, convention collective, notes de service…</p>
            {sharedDocs.length > 0 && (
              <ul className="space-y-2 mb-4">
                {sharedDocs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 underline">
                      {d.name}
                    </a>
                    {canManage && (
                      <button
                        type="button"
                        className="text-xs text-rose-600 font-bold underline"
                        onClick={async () => {
                          if (!confirm("Supprimer ce document partagé ?")) return;
                          await fetch("/api/personnel", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "delete-shared-doc", docId: d.id }),
                          });
                          void load();
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canManage && (
              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const prep = await fetch("/api/personnel/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
                      });
                      const pj = await prep.json();
                      if (!prep.ok) throw new Error(pj.error);
                      await fetch(pj.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
                      await fetch("/api/personnel", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "shared-doc",
                          document: { name: file.name, fileUrl: pj.fileUrl },
                        }),
                      });
                      void load();
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Erreur");
                    }
                    e.target.value = "";
                  }}
                />
                <span className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">+ Ajouter un document utile</span>
              </label>
            )}
          </div>
        </>
      )}

      <RhNewStaffModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={async (recordId) => {
          setShowNew(false);
          await load();
          router.push(`/rh/${recordId}`);
        }}
      />
    </div>
  );
}
