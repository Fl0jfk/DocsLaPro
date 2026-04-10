"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const MESSAGES: Record<string, string> = {
  lien_invalide: "Ce lien de confirmation n’est pas valide ou a déjà été utilisé.",
  lien_expire: "Ce lien a expiré. Merci de refaire une demande depuis l’assistant.",
  serveur: "Une erreur technique s’est produite. Merci de réessayer plus tard ou de contacter l’établissement.",
};

function Contenu() {
  const sp = useSearchParams();
  const ok = sp.get("ok") === "1";
  const id = sp.get("id") || "";
  const erreur = sp.get("erreur") || "";

  if (ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-6 py-8 text-center shadow-sm">
        <h1 className="text-xl font-black text-emerald-900">Demande enregistrée</h1>
        <p className="text-sm text-emerald-900/85 mt-3 leading-relaxed">
          Votre adresse e-mail est confirmée et votre demande a bien été transmise à l’équipe.
          {id ? (
            <>
              {" "}
              Référence : <span className="font-mono font-semibold">{id}</span>.
            </>
          ) : null}{" "}
          Vous recevrez un e-mail de suivi sur la boîte indiquée lors du dépôt.
        </p>
        <Link href="/" className="inline-block mt-6 text-sm font-bold text-emerald-800 underline-offset-2 hover:underline">
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  const msg = MESSAGES[erreur] || MESSAGES.serveur;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-6 py-8 text-center shadow-sm">
      <h1 className="text-xl font-black text-amber-900">Confirmation impossible</h1>
      <p className="text-sm text-amber-900/85 mt-3 leading-relaxed">{msg}</p>
      <Link href="/chatbot" className="inline-block mt-6 text-sm font-bold text-amber-900 underline-offset-2 hover:underline">
        Retour à l’assistant
      </Link>
    </div>
  );
}

export default function DemandeMerciPage() {
  return (
    <main className="min-h-[60vh] max-w-lg mx-auto px-4 py-16">
      <Suspense
        fallback={<p className="text-center text-sm text-slate-500">Chargement…</p>}
      >
        <Contenu />
      </Suspense>
    </main>
  );
}
