"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import RhMyLeavesPanel from "@/app/components/personnel/RhMyLeavesPanel";
import StaffDossier from "@/app/components/personnel/StaffDossier";
import {
  canViewPersonnelDashboard,
  type PersonnelRecord,
  type SharedPersonnelDocument,
} from "@/app/lib/personnel-types";
import { computeEntretienNextDue } from "@/app/lib/personnel-rh-cycles";

export default function RhMoiPage() {
  const { user, isLoaded } = useUser();
  const [record, setRecord] = useState<PersonnelRecord | null>(null);
  const [sharedDocs, setSharedDocs] = useState<SharedPersonnelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rolesRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.map(String) : rolesRaw ? [String(rolesRaw)] : [];
  const isRh = canViewPersonnelDashboard(roles);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/personnel/moi", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Chargement impossible");
      setRecord(j.record);
      setSharedDocs(j.sharedDocs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) void load();
  }, [isLoaded]);

  if (!isLoaded || loading) {
    return <p className="p-10 text-center text-slate-500">Chargement de votre dossier…</p>;
  }

  if (error) return <p className="p-10 text-center text-rose-600">{error}</p>;

  if (!record) {
    return (
      <div className="max-w-lg mx-auto p-10 text-center space-y-4">
        <p className="text-slate-600">
          Aucun dossier n&apos;est encore associé à votre compte ({user?.primaryEmailAddress?.emailAddress}).
        </p>
        <p className="text-sm text-slate-400">Contactez la RH pour la création de votre dossier.</p>
        {isRh && (
          <Link href="/rh" className="inline-block text-indigo-600 font-bold underline">
            Module RH
          </Link>
        )}
      </div>
    );
  }

  const entretienNext = computeEntretienNextDue(record);
  const medNext = record.medecineTravail?.nextVisitAt;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Mon dossier RH</p>
        {isRh && (
          <Link href="/rh" className="text-sm font-bold text-indigo-600 hover:underline">
            Module RH →
          </Link>
        )}
      </div>

      {(medNext || entretienNext) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {medNext && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Médecine du travail</p>
              <p className="font-bold text-slate-900 mt-1">Prochaine visite : {new Date(medNext).toLocaleDateString("fr-FR")}</p>
            </div>
          )}
          {entretienNext && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm">
              <p className="text-[10px] font-bold uppercase text-violet-800">Entretien professionnel</p>
              <p className="font-bold text-slate-900 mt-1">Prochain cycle : {new Date(entretienNext).toLocaleDateString("fr-FR")}</p>
            </div>
          )}
        </div>
      )}

      <RhMyLeavesPanel personnelId={record.id} />

      <StaffDossier record={record} canManage={false} sharedDocs={sharedDocs} onRefresh={load} />
    </div>
  );
}
