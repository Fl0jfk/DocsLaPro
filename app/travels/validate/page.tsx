"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

type PieceJointe = {
  filename: string;
  buffer: string;
  type: string;
  date?: string;
  transporteur?: string;
  message?: string;
};

type Etape2 = {
  panier_repas: boolean;
  nb_repas?: number;
  nb_vegetariens?: number;
  lieu_repas?: string;
  details_panier_repas?: string;
  devis_transporteur: boolean;
  details_devis_transporteur?: string;
  commentaire?: string;
  date?: string;
};

type Etape3 = {
  circulaire_depart?: PieceJointe;
  date_reunion_info?: string;
  date_envoi_circulaire_parents?: string;
  participation_famille?: number;
  cout_total_voyage?: number;
  liste_eleves?: PieceJointe;
  liste_accompagnateurs?: PieceJointe;
  autres_pieces?: PieceJointe[];
  commentaire?: string;
  date?: string;
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
  programme?: PieceJointe;
  etat: string;
  date_declaration: string;
  etape_2?: Etape2;
  devis?: PieceJointe[];
  etape_3?: Etape3;
};

function getPJUrl({ type, idx }: { type: "programme" | "pieces_jointes" | "devis"; idx: number }, v: VoyageEntry) {
  if (type === "programme") return `/api/travels/pj?id=${encodeURIComponent(v.id)}&prog=1`;
  if (type === "pieces_jointes") return `/api/travels/pj?id=${encodeURIComponent(v.id)}&idx=${idx}`;
  if (type === "devis") return `/api/travels/pj?id=${encodeURIComponent(v.id)}&devis=${idx}`;
  return "#";
}

function Loader() {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" className="inline mr-2 animate-spin" style={{ verticalAlign: "middle" }}>
      <circle cx="11" cy="11" r="9" stroke="#888" strokeWidth="4" fill="none" strokeDasharray="28 60" strokeLinecap="round"/>
    </svg>
  );
}

const ETAPES_TITRE: Record<string, string> = { en_attente: "Validation INITIALe: création du voyage", validation_finale_en_attente: "Validation FINALE: documents complets et devis déposés"};

const CLERK_TO_VOYAGE_DIRECTION: Record<string, string> = { direction_ecole: "direction_ecole", direction_college: "direction_college", direction_lycee: "direction_lycee"};

export default function ValidationVoyages() {
  const { user, isLoaded } = useUser();
  const [voyages, setVoyages] = useState<VoyageEntry[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getDirectionClerk(user: any): string | null {
    if (!user) return null;
    const meta = (user.publicMetadata?.role as string | undefined) || "";
    return CLERK_TO_VOYAGE_DIRECTION[meta] || null;
  }
  const directionCible = getDirectionClerk(user);
  useEffect(() => {
    async function fetchVoyages() {
      try {
        const res = await fetch("/api/travels/view-all");
        const arr = await res.json();
        setVoyages(
          Array.isArray(arr)
            ? arr.filter(
              v =>
                (v.etat === "en_attente" || v.etat === "validation_finale_en_attente")
                && (directionCible ? v.direction_cible === directionCible : true)
            )
            : []
        );
      } catch (e) { 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMsg("Erreur de récupération des voyages : " + (e as any).message);
      }
    }
    if (directionCible) fetchVoyages();
  }, [directionCible]);
  const handleValidation = async (
    voyage: VoyageEntry,
    statut: "validee" | "refusee"
  ) => {
    setLoadingId(voyage.id);
    setMsg("");
    let api = "/api/travels/validate";
    if (voyage.etat === "validation_finale_en_attente") {
      api = "/api/travels/final-validate";
    }
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: voyage.id, statut }),
      });
      const result = await res.json();
      setMsg(result.message || result.error);
      setVoyages((old) => old.filter((a) => a.id !== voyage.id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMsg(error?.message || "Erreur lors de la validation.");
    } finally {
      setLoadingId(null);
    }
  };
  if (!isLoaded) return <div className="pt-[10vh] flex">Chargement…</div>;
  if (!user) return <div className="pt-[10vh] flex">Vous devez être connecté(e).</div>;
  if (!directionCible) return <div className="pt-[10vh] flex">Vous n&apos;avez pas accès aux validations (rôle non reconnu).</div>;
  return (
    <div className="pt-[10vh] flex flex-col w-full items-center">
      <h2 style={{ fontSize: "1.4rem", marginBottom: 18 }}>Validations direction ({directionCible.replace("direction_", "").toUpperCase()})</h2>
      {msg && (
        <div style={{ color: msg.toLowerCase().includes("succès") || msg.toLowerCase().includes("envoyé") ? "green" : "red", marginBottom: 18 }}>{msg}</div>
      )}
      {!voyages.length && <div>Aucun voyage à traiter pour l&apos;instant.</div>}
      <ul style={{ listStyle: "none", padding: 0, width: "100%", maxWidth: 780 }}>
        {voyages.map((v) => (
          <li key={v.id} style={{ border: "1px solid #ececec", borderRadius: 8, marginBottom: 30, padding: 18 }}>
            <div style={{ fontWeight: 600 }}>
              {ETAPES_TITRE[v.etat] || "Validation voyage"}
            </div>
            <div>
              <b>{v.prenom} {v.nom}</b> — <em>{v.email}</em>
            </div>
            <div>
              <b>Période :</b> {v.date_depart} au {v.date_retour}
            </div>
            <div>
              <b>Lieu/activité :</b> {v.lieu} / {v.activite}
            </div>
            <div>
              <b>Classes :</b> {v.classes}
            </div>
            <div>
              <b>Élèves :</b> {v.effectif_eleves} &nbsp;&nbsp;
              <b>Accompagnateurs :</b> {v.effectif_accompagnateurs}
            </div>
            {v.commentaire && (<div><b>Commentaire créateur :</b> {v.commentaire}</div>)}
            {v.programme && (
              <div style={{ marginTop: 7 }}>
                <b>Programme : </b>
                <a href={getPJUrl({ type: "programme", idx: 0 }, v)} target="_blank" rel="noopener noreferrer">{v.programme.filename}</a>
              </div>
            )}
            {v.pieces_jointes && v.pieces_jointes.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <b>Autres pièces jointes :</b> {" "}
                {v.pieces_jointes.map((pj, i) =>
                  <a key={i} href={getPJUrl({ type: "pieces_jointes", idx: i }, v)} target="_blank" rel="noopener noreferrer" style={{ marginRight: 7 }}>{pj.filename}</a>
                )}
              </div>
            )}
            {v.devis && v.devis.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <b>Devis transporteurs reçus :</b>
                <ul>
                  {v.devis.map((d, i) =>
                    <li key={i}>
                      {d.transporteur && <span><b>{d.transporteur} :</b> </span>}
                      <a href={getPJUrl({ type: "devis", idx: i }, v)} target="_blank" rel="noopener noreferrer">{d.filename}</a>
                      {d.message && <span style={{ color: "#777", fontSize: "13px" }}> – {d.message}</span>}
                    </li>
                  )}
                </ul>
              </div>
            )}
            {v.etape_3 && v.etat === "validation_finale_en_attente" && (
  <div style={{marginTop: 7, background: "#fcfcfc", padding: 12, borderRadius: 6}}>
    <b>Pièces finales déposées :</b>
    <div>
      Circulaire de départ: {v.etape_3.circulaire_depart && (
        <a
          href={`/api/travels/pj?id=${encodeURIComponent(v.id)}&etape=3&type=circulaire`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {v.etape_3.circulaire_depart.filename}
        </a>
      )}
    </div>
    <div>Date réunion info : {v.etape_3.date_reunion_info || "–"}</div>
    <div>Date envoi circulaire parents : {v.etape_3.date_envoi_circulaire_parents || "–"}</div>
    <div>Participation famille (€) : {v.etape_3.participation_famille}</div>
    <div>Coût total voyage (€) : {v.etape_3.cout_total_voyage}</div>
    <div>
      Liste élèves : {v.etape_3.liste_eleves && (
        <a
          href={`/api/travels/pj?id=${encodeURIComponent(v.id)}&etape=3&type=eleves`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {v.etape_3.liste_eleves.filename}
        </a>
      )}
    </div>
    <div>
      Liste accompagnateurs : {v.etape_3.liste_accompagnateurs && (
        <a
          href={`/api/travels/pj?id=${encodeURIComponent(v.id)}&etape=3&type=accompagnateurs`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {v.etape_3.liste_accompagnateurs.filename}
        </a>
      )}
    </div>
    {v.etape_3.autres_pieces && v.etape_3.autres_pieces.length > 0 && (
      <div>
        Autres PJ:
        {v.etape_3.autres_pieces.map((pj: PieceJointe, i: number) =>
          <a
            key={i}
            href={`/api/travels/pj?id=${encodeURIComponent(v.id)}&etape=3&type=autres&idx=${i}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 10 }}
          >
            {pj.filename}
            </a>
          )}
          </div>
          )}
          {v.etape_3.commentaire && <div>Commentaire final : {v.etape_3.commentaire}</div>}
        </div>
         )}
            <div style={{ marginTop: 14 }}>
              <button onClick={() => handleValidation(v, "validee")} disabled={!!loadingId} style={{ marginRight: 10, padding: "8px 14px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 4, cursor: loadingId ? "not-allowed" : "pointer", opacity: loadingId === v.id ? 0.7 : 1,}}>
                {loadingId === v.id && <Loader />}
                Valider {v.etat === "validation_finale_en_attente" ? "définitivement" : ""}
              </button>
              <button onClick={() => handleValidation(v, "refusee")} disabled={!!loadingId} style={{ padding: "8px 14px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: loadingId ? "not-allowed" : "pointer", opacity: loadingId === v.id ? 0.7 : 1,}}>
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