"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CertificatePendingSignaturesPanel from "@/app/components/certificates/CertificatePendingSignaturesPanel";
import { currentCertificateSchoolYear } from "@/app/lib/certificates-types";

type ProgramEntry = {
  id: string;
  title: string;
  schoolYear: string;
  ownerName: string;
  status: string;
  updatedAt: string;
};

export default function CertificatesListPage() {
  const [mine, setMine] = useState<ProgramEntry[]>([]);
  const [shared, setShared] = useState<ProgramEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/certificates/programs", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setMine(j.mine || []);
        setShared(j.shared || []);
      })
      .catch(() => {
        setMine([]);
        setShared([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-20 text-center font-bold text-slate-600">Chargement…</div>;
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Parcours & certificats</h1>
          <p className="text-slate-600 mt-2 text-sm">
            Créez des parcours, ajoutez des élèves, des lignes personnalisées et signez en fin d&apos;année.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/certificates/my-signature"
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-700"
          >
            Ma signature
          </Link>
          <Link
            href="/certificates/new"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg"
          >
            Nouveau parcours
          </Link>
        </div>
      </div>

      <CertificatePendingSignaturesPanel />

      <section>
        <h2 className="text-lg font-black text-slate-900 mb-3">Mes parcours</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun parcours créé.</p>
        ) : (
          <div className="grid gap-3">
            {mine.map((p) => (
              <Link
                key={p.id}
                href={`/certificates/${p.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-300 transition"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-black text-slate-900">{p.title}</p>
                  <span className="text-xs text-slate-500">{p.schoolYear}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Créateur : {p.ownerName}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {shared.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-slate-900 mb-3">Parcours partagés avec moi</h2>
          <div className="grid gap-3">
            {shared.map((p) => (
              <Link
                key={p.id}
                href={`/certificates/${p.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-violet-300 transition"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-black text-slate-900">{p.title}</p>
                  <span className="text-xs text-slate-500">{p.schoolYear}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Créateur : {p.ownerName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-slate-400">Année scolaire en cours : {currentCertificateSchoolYear()}</p>
    </div>
  );
}
