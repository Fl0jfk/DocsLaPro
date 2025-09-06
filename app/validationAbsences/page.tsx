"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import Image from "next/image";
import type { AbsenceEntry, Justificatif } from "@/app/utils/jsonStore";

function Loader() {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" className="inline mr-2 animate-spin" style={{ verticalAlign: "middle" }}>
      <circle cx="11" cy="11" r="9" stroke="#888" strokeWidth="4" fill="none" strokeDasharray="28 60" strokeLinecap="round"/>
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
    const roleData = user.publicMetadata?.role;
    if (!roleData) return null;
    const roles: string[] = Array.isArray(roleData) ? roleData : typeof roleData === "string" ? roleData.split(",").map(r => r.trim()) : [];
    if (roles.some(r => r === "direction_lycee")) return "direction_lycee";
    if (roles.some(r => r === "direction_college")) return "direction_college";
    if (roles.some(r => r === "direction_ecole")) return "direction_ecole";
    return null;
  }
  const cible = getCibleFromRole(user);
  useEffect(() => {
    if (!cible) return;
    async function fetchAbsences() {
      try {
        const res = await fetch("/api/absence/list");
        if (!res.ok) throw new Error("Impossible de récupérer les absences");
        const entries: AbsenceEntry[] = await res.json();
        setAbsences(entries.filter(a => a.cible === cible && a.etat === "en_attente"));
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setMsg("Erreur de récupération absences : " + e.message);
      }
    }
    fetchAbsences();
  }, [cible]);
  const handleDownload = (f: Justificatif) => {
    try {
      const byteCharacters = atob(f.buffer);
      const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: f.type });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Erreur ouverture fichier:", err);
    }
  };
  const handleValidation = async (id: string, statut: "validee" | "refusee", declarerRectorat?: boolean) => {
    setLoadingId(id);
    setMsg("");
    setChoix(old => ({ ...old, [id]: statut }));
    try {
      const res = await fetch("/api/absence/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut, declarerRectorat }),
      });
      const result = await res.json();
      setMsg(result.message || result.error);
      setAbsences(old => old.filter(a => a.id !== id));
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
      <h2 style={{ fontSize: "1.4rem", marginBottom: 18 }}>Demandes d’absence à valider ({cible})</h2>
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
            <div><b>Type :</b> {a.type === "prof" ? "Professeur" : "Personnel / salarié"}</div>
            <div><b>Période :</b> {a.date_debut} au {a.date_fin}</div>
            <div><b>Motif :</b> {a.motif}</div>
            {a.commentaire && <div><b>Commentaire :</b> {a.commentaire}</div>}
            {a.justificatifs && a.justificatifs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <b>Justificatifs :</b>
                <ul style={{ paddingLeft: 18 }}>
                  {a.justificatifs.map((f, idx) => {
                    const viewable = f.type.startsWith("image/");
                    const isPdf = f.type === "application/pdf";
                    return (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        <a onClick={() => handleDownload(f)} style={{ color: "#0070f3", cursor: "pointer" }}>
                          {isPdf ? `Ouvrir PDF: ${f.filename}` : `Voir / Télécharger: ${f.filename}`}
                        </a>
                        {viewable && (
                          <Image
                            src={`data:${f.type};base64,${f.buffer}`}
                            alt={f.filename}
                            width={120}
                            height={80}
                            unoptimized
                            style={{ maxWidth: 120, maxHeight: 80, border: "1px solid #ccc" }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {a.type === "prof" && (
              <label style={{ marginTop: 12 }}>
                Déclarer au rectorat ?
                <input
                  type="checkbox"
                  checked={a.declarerRectorat || false}
                  onChange={e => a.declarerRectorat = e.target.checked}
                  style={{ marginLeft: 6 }}
                />
              </label>
            )}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => handleValidation(a.id, "validee", a.declarerRectorat)}
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
                {loadingId === a.id && <Loader />} Valider
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
                {loadingId === a.id && <Loader />} Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
