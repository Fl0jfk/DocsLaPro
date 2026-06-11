import { Suspense } from "react";
import AbsencesPageClient from "./AbsencesPageClient";

function AbsencesPageFallback() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="text-slate-500 text-sm">Chargement des absences…</p>
    </div>
  );
}

export default function AbsencesPage() {
  return (
    <Suspense fallback={<AbsencesPageFallback />}>
      <AbsencesPageClient />
    </Suspense>
  );
}
