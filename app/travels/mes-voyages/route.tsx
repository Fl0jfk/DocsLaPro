"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

type VoyageEntry = {
  id: string;
  date_depart: string;
  date_retour: string;
  lieu: string;
  classes: string;
  etat: string;
};

const ETAPES = {
  en_attente: "Validation direction",
  etape_2_en_attente: "Compléter besoins (repas, devis…) — Étape 2",
  etape_3_en_attente: "Déposer devis transporteurs — Étape 3",
  validee: "Validé",
  refusee: "Refusé"
};

export default function MesVoyages() {
  const { user, isLoaded } = useUser();
  const [voyages, setVoyages] = useState<VoyageEntry[]>([]);
  useEffect(() => {
    if (!user) return;
    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      "";
    fetch("/api/travels/by-user?email=" + encodeURIComponent(email))
      .then(r => r.json())
      .then(setVoyages);
  }, [user]);
  if (!isLoaded) return <div>Chargement…</div>;
  if (!user) return <div>Vous devez être connecté.</div>;
  return (
    <div style={{ maxWidth: 600, margin: "6vh auto", padding: 2 }}>
      <h2>Mes voyages en cours</h2>
      {!voyages.length && <div>Aucun voyage en cours ou passé.</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {voyages.map(v => (
          <li key={v.id} style={{ border: "1px solid #eee", borderRadius: 8, margin: "16px 0", padding: 16 }}>
            <div><b>{v.lieu}</b> ({v.classes})</div>
            <div>{v.date_depart} – {v.date_retour}</div>
            <div><b>Statut :</b> {ETAPES[v.etat as keyof typeof ETAPES] || v.etat}</div>
            {v.etat === "etape_2_en_attente" && (
              <Link href={`/travels/steptwo?id=${v.id}`}>Poursuivre l’étape 2</Link>
            )}
            {v.etat === "etape_3_en_attente" && (
              <Link href={`/travels/stepthree?id=${v.id}`}>Déposer devis reçus (étape 3)</Link>
            )}
            {v.etat === "en_attente" && <span>En attente d’accord direction</span>}
            {v.etat === "validee" && <span>Terminé</span>}
            {v.etat === "refusee" && <span>Refusé</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}