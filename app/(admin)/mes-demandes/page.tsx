"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import MesDemandesSuivi from "@/app/(admin)/requests/MesDemandesSuivi";

type RequestStatus = "NOUVELLE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE";

type SubmittedRequest = {
  id: string;
  status: RequestStatus;
  category: string;
  subject: string;
  description: string;
  assignedTo: { routeId?: string; unit: string; roleLabel: string };
};

export default function MesDemandesPage() {
  const { isLoaded, user } = useUser();
  const [items, setItems] = useState<SubmittedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/requests/list?scope=submitted", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data)) setItems(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  if (!isLoaded) return <main className="max-w-3xl mx-auto px-4 py-10 mt-[9vh]">Chargement…</main>;
  if (!user) return <main className="max-w-3xl mx-auto px-4 py-10 mt-[9vh]">Connexion requise.</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 mt-[9vh] pb-24">
      <h1 className="text-2xl font-black text-slate-900">Suivi de vos demandes</h1>
      <p className="text-sm text-slate-600 mt-1">
        Réservé à votre compte : vous ne voyez pas les demandes des autres. Pour en créer une nouvelle, utilisez la bulle d’assistant
        (chatbot) puis <strong>Créer une demande</strong>.
      </p>
      <div className="mt-8">
        <MesDemandesSuivi
          items={items}
          loading={loading}
          id="mes-demandes"
          title="Vos demandes"
          intro="État d’avancement et service en charge (libellé lisible, pas de code technique)."
        />
      </div>
    </main>
  );
}
