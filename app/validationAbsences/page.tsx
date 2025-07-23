"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import Image from "next/image";

type Justificatif = {
  filename: string;
  buffer: string;
  type: string;
};

type AbsenceEntry = {
  id: string;
  type: "prof" | "salarie";
  cible: "direction_ecole" | "direction_college" | "direction_lycee";
  nom: string;
  email: string;
  date_debut: string;
  date_fin: string;
  motif: string;
  commentaire?: string;
  justificatifs?: Justificatif[];
  etat: "en_attente" | "validee" | "refusee";
  date_declaration: string;
};

const CIBLE_MAP: Record<string, "direction_lycee" | "direction_college" | "direction_ecole"> = {
  direction_lycee: "direction_lycee",
  direction_college: "direction_college",
  direction_ecole: "direction_ecole",
};

function Loader() {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" className="inline mr-2 animate-spin" style={{ verticalAlign: "middle" }}>
      <circle
        cx="11" cy="11" r="9"
        stroke="#888" strokeWidth="4"
        fill="none"
        strokeDasharray="28 60"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ValidationAbsences() {
  const { user, isLoaded } = useUser();
  const [absences, setAbsences] = useState<AbsenceEntry[]>([]);
  const [choix, setChoix] = useState<Record<string, "validee" | "refusee" | "">>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  function getCibleFromRole(user: UserResource | null | undefined): "direction_lycee" | "direction_college" | "direction_ecole" | null {
    if (!user) return null;
    const role = (user.publicMetadata?.role as string | undefined) || "";
    return (role && CIBLE_MAP[role]) ? CIBLE_MAP[role] : null;
  }
  const cible = getCibleFromRole(user);
  useEffect(() => {
    if (!cible) return;
    async function fetchAbsences() {
      try {
        const res = await fetch("/api/absence/validate");
        const txt = await res.text();
        const arr = JSON.parse(txt);
        const entries: AbsenceEntry[] = Array.isArray(arr) ? arr : [];
        setAbsences(entries.filter(a => a.cible === cible && a.etat === "en_attente"));
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMsg("Erreur de récupération absences : " + (e as any).message);
        console.error("Erreur parsing JSON ou fetch : ", e);
      }
    }
    fetchAbsences();
  }, [cible]);
  const handleValidation = async (id: string, statut: "validee" | "refusee") => {
    setLoadingId(id);
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
      setLoadingId(null);
    }
  };
  if (!isLoaded) return <div className="pt-[10vh] flex">Chargement utilisateur…</div>;
  if (!user) return <div className="pt-[10vh] flex">Vous devez être connecté(e).</div>;
  if (!cible) return <div className="pt-[10vh] flex">Vous n’avez pas accès à la gestion des absences.<br />Rôle non reconnu.</div>;
  return (
    <div className="pt-[10vh] flex flex-col w-full items-center">
      <h2 style={{ fontSize: "1.4rem", marginBottom: 18 }}>
        Demandes d’absence à valider ({cible})
      </h2>
      {msg && (
        <div style={{
          color: msg.toLowerCase().includes("succès") || msg.toLowerCase().includes("envoyé") ? "green" : "red",
          marginBottom: 18
        }}>{msg}</div>
      )}
      {!absences.length && <div>Aucune absence à traiter pour l’instant.</div>}
      <ul style={{ listStyle: "none", padding: 0, width: "100%", maxWidth: 750 }}>
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
            {a.justificatifs && a.justificatifs.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <b>Justificatifs :</b>
                <ul style={{ paddingLeft: 18 }}>
                  {a.justificatifs.map((f, idx) => {
                    const viewable = f.type.startsWith("image/");
                    const isPdf = f.type === "application/pdf";
                    const url = `/api/pj-pdf?id=${encodeURIComponent(a.id)}&idx=${idx}`;
                    return (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        {viewable && (
                          <>
                            <a target="_blank" rel="noopener noreferrer" href={url} style={{ color: "#0070f3", marginRight: 8 }}>Voir l’image</a>
                            <Image src={url} alt={f.filename} width={120} height={80} style={{maxWidth: 120, maxHeight: 80, border: "1px solid #ccc", display:"inline-block", verticalAlign:"middle"}} />
                          </>
                        )}
                        {isPdf && (
                          <a target="_blank" rel="noopener noreferrer" href={url} style={{ color: "#0070f3"}}>Ouvrir PDF : {f.filename}</a>
                        )}
                        {!viewable && !isPdf && (
                          <a href={url} download={f.filename} style={{ color: "#0070f3" }}>Télécharger : {f.filename}</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => handleValidation(a.id, "validee")}
                disabled={!!loadingId || choix[a.id] === "validee"}
                style={{
                  marginRight: 10,
                  padding: "8px 14px",
                  background: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: (!!loadingId || choix[a.id] === "validee") ? "not-allowed" : "pointer",
                  opacity: loadingId === a.id ? 0.7 : 1,
                }}
              >
                {loadingId === a.id && <Loader />}
                Valider
              </button>
              <button
                onClick={() => handleValidation(a.id, "refusee")}
                disabled={!!loadingId || choix[a.id] === "refusee"}
                style={{
                  padding: "8px 14px",
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: (!!loadingId || choix[a.id] === "refusee") ? "not-allowed" : "pointer",
                  opacity: loadingId === a.id ? 0.7 : 1,
                }}
              >
                {loadingId === a.id && <Loader />}
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}