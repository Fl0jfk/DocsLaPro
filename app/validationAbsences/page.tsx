"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";

type AbsenceEntry = {
  id: string;
  type: "prof" | "salarie";
  cible: "ecole" | "college" | "lycee";
  nom: string;
  email: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  commentaire?: string;
  justificatif_filename?: string;
  etat: "en_attente" | "validee" | "refusee";
  date_declaration: string;
};

const CIBLE_MAP: Record<string, "lycee" | "college" | "ecole"> = {
  direction_lycee: "lycee",
  direction_college: "college",
  direction_ecole: "ecole",
};

export default function ValidationAbsences() {
  const { user, isLoaded } = useUser();
  const [absences, setAbsences] = useState<AbsenceEntry[]>([]);
  const [choix, setChoix] = useState<Record<string, "validee" | "refusee" | "">>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  function getCibleFromRole(user: UserResource | null | undefined): "lycee" | "college" | "ecole" | null {
    if (!user) return null;
    const role = (user.publicMetadata?.role as string | undefined) || "";
    return (role && CIBLE_MAP[role]) ? CIBLE_MAP[role] : null;
  }
  const cible = getCibleFromRole(user);
  useEffect(() => {
    if (!cible) return;
    async function fetchAbsences() {
      try {
        const res = await fetch("/api/absence");
        const arr = await res.json();
        const entries: AbsenceEntry[] = Array.isArray(arr) ? arr : [];
        setAbsences(entries.filter(a => a.cible === cible && a.etat === "en_attente"));
      } catch (e) {
        console.error("Erreur lors du chargement des absences :", e);
        setMsg("Erreur lors du chargement des absences.");
      }
    }
    fetchAbsences();
  }, [cible]);

  const handleValidation = async (id: string, statut: "validee" | "refusee") => {
    setLoading(true);
    setMsg("");
    setChoix((old) => ({ ...old, [id]: statut }));
    try {
      const res = await fetch("/api/absence/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut }),
      });
      const result = await res.json();
      setMsg(result.message || result.error);
      setAbsences((old) => old.filter((a) => a.id !== id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMsg(error?.message || "Erreur lors de la validation.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div>Chargement utilisateur…</div>;
  if (!user) return <div>Vous devez être connecté(e).</div>;
  if (!cible) return <div>Vous n’avez pas accès à la gestion des absences.<br />Rôle non reconnu.</div>;

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", background: "#fff", borderRadius: 12, padding: 30, boxShadow: "0 0 12px #eee" }}>
      <h2 style={{ fontSize: "1.4rem", marginBottom: 18 }}>
        Demandes d’absence à valider ({cible})
      </h2>
      {msg && <div style={{ color: msg.toLowerCase().includes("succès") || msg.toLowerCase().includes("envoyé") ? "green" : "red", marginBottom: 18 }}>{msg}</div>}
      {!absences.length && <div>Aucune absence à traiter pour l’instant.</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {absences.map((a) => (
          <li key={a.id} style={{ border: "1px solid #ececec", borderRadius: 8, marginBottom: 20, padding: 18 }}>
            <strong>{a.nom}</strong> — <em>{a.email}</em>
            <div>
              <b>Type :</b> {a.type === "prof" ? "Professeur" : "Personnel / salarié"}
            </div>
            <div>
              <b>Période :</b> {a.date_debut} au {a.date_fin}
            </div>
            <div>
              <b>Motif :</b> {a.motif}
            </div>
            {a.commentaire && (
              <div>
                <b>Commentaire :</b> {a.commentaire}
              </div>
            )}
            {a.justificatif_filename && (
              <div>
                <b>Justificatif :</b> <span style={{ color: "#0070f3" }}>{a.justificatif_filename}</span> (envoyé automatiquement en PJ après validation)
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button onClick={() => handleValidation(a.id, "validee")} disabled={loading || choix[a.id] === "validee"} style={{ marginRight: 10, padding: "8px 14px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Valider</button>
              <button onClick={() => handleValidation(a.id, "refusee")} disabled={loading || choix[a.id] === "refusee"} style={{ padding: "8px 14px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Refuser</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
