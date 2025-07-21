"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

type PieceJointe = {
  filename: string;
  buffer: string;
  type: string;
};

type VoyageEntry = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  direction_cible: string;
  date_depart: string;
  date_retour: string;
  lieu: string;
  activite: string;
  classes: string;
  effectif_eleves: number;
  effectif_accompagnateurs: number;
  commentaire?: string;
  pieces_jointes?: PieceJointe[];
  etat: "en_attente" | "validee" | "refusee";
  date_declaration: string;
};

function base64ToUrl({ buffer, type }: { buffer: string; type: string }) {
  if (buffer.startsWith("data:")) return buffer;
  return `${type};base64,${buffer}`;
}

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

export default function ValidationVoyages() {
  const { user, isLoaded } = useUser();
  const [voyages, setVoyages] = useState<VoyageEntry[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function fetchVoyages() {
      try {
        const res = await fetch("/api/voyages/validation");
        const arr = await res.json();
        setVoyages(Array.isArray(arr) ? arr.filter(v => v.etat === "en_attente") : []);
      } catch (e) {
        setMsg("Erreur de récupération des voyages : " + (e as any).message);
      }
    }
    fetchVoyages();
  }, []);

  const handleValidation = async (id: string, statut: "validee" | "refusee") => {
    setLoadingId(id);
    setMsg("");
    try {
      const res = await fetch("/api/voyages/validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut }),
      });
      const result = await res.json();
      setMsg(result.message || result.error);
      setVoyages((old) => old.filter((a) => a.id !== id));
    } catch (error: any) {
      setMsg(error?.message || "Erreur lors de la validation.");
    } finally {
      setLoadingId(null);
    }
  };

  if (!isLoaded) return <div className="pt-[10vh] flex">Chargement…</div>;
  if (!user) return <div className="pt-[10vh] flex">Vous devez être connecté(e).</div>;

  return (
    <div className="pt-[10vh] flex flex-col w-full items-center">
      <h2 style={{ fontSize: "1.4rem", marginBottom: 18 }}>
        Demandes de voyage à valider
      </h2>
      {msg && (
        <div style={{ color: msg.toLowerCase().includes("succès") || msg.toLowerCase().includes("envoyé") ? "green" : "red", marginBottom: 18 }}>{msg}</div>
      )}
      {!voyages.length && <div>Aucun voyage à traiter pour l’instant.</div>}
      <ul style={{ listStyle: "none", padding: 0, width: "100%", maxWidth: 780 }}>
        {voyages.map((v) => (
          <li key={v.id} style={{ border: "1px solid #ececec", borderRadius: 8, marginBottom: 20, padding: 18 }}>
            <b>{v.prenom} {v.nom}</b> — <em>{v.email}</em>
            <div>
              <b>Établissement :</b> {v.direction_cible}
            </div>
            <div>
              <b>Période :</b> {v.date_depart} au {v.date_retour}
            </div>
            <div>
              <b>Lieu/activité :</b> {v.lieu} / {v.activite}
            </div>
            <div>
              <b>Classes :</b> {v.classes}
            </div>
            <div>
              <b>Élèves :</b> {v.effectif_eleves} &nbsp;&nbsp;
              <b>Accompagnateurs :</b> {v.effectif_accompagnateurs}
            </div>
            {v.commentaire && (<div><b>Commentaire :</b> {v.commentaire}</div>)}
            {v.pieces_jointes && v.pieces_jointes.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <b>Pièces jointes :</b>
                <ul style={{ paddingLeft: 18 }}>
                  {v.pieces_jointes.map((f, idx) => {
                    const viewable = f.type.startsWith("image/");
                    const isPdf = f.type === "application/pdf";
                    const url = base64ToUrl(f);
                    return (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        {viewable && (
                          <>
                            <a target="_blank" rel="noopener noreferrer" href={url} style={{ color: "#0070f3", marginRight: 8 }}>Voir l’image</a>
                            <img src={url} alt={f.filename} style={{maxWidth: 120, maxHeight: 80, border: "1px solid #ccc", display:"inline-block", verticalAlign:"middle"}} />
                          </>
                        )}
                        {isPdf && (
                          <a target="_blank" rel="noopener noreferrer" href={url} style={{ color: "#0070f3"}}>Ouvrir PDF : {f.filename}</a>
                        )}
                        {!viewable && !isPdf && (
                          <a href={url} download={f.filename} style={{ color: "#0070f3" }}>Télécharger : {f.filename}</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => handleValidation(v.id, "validee")}
                disabled={!!loadingId}
                style={{
                  marginRight: 10,
                  padding: "8px 14px",
                  background: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: loadingId ? "not-allowed" : "pointer",
                  opacity: loadingId === v.id ? 0.7 : 1,
                }}
              >
                {loadingId === v.id && <Loader />}
                Valider
              </button>
              <button
                onClick={() => handleValidation(v.id, "refusee")}
                disabled={!!loadingId}
                style={{
                  padding: "8px 14px",
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: loadingId ? "not-allowed" : "pointer",
                  opacity: loadingId === v.id ? 0.7 : 1,
                }}
              >
                {loadingId === v.id && <Loader />}
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
