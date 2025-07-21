"use client";
import { useEffect, useState } from "react";

type PieceJointe = {
  filename: string;
  buffer: string;
  type: string;
};
type Devis = {
  filename: string;
  buffer: string;
  type: string;
  date: string;
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
  devis?: Devis[];
};

function base64ToUrl({ buffer, type }: { buffer: string; type: string }) {
  if (buffer.startsWith("")) return buffer;
  return `${type};base64,${buffer}`;
}

export default function AdminVoyagesDashboard() {
  const [voyages, setVoyages] = useState<VoyageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/voyages/all")
      .then(r => r.json())
      .then(setVoyages)
      .finally(() => setLoading(false));
  }, []);
  return (
    <div style={{ maxWidth: 800, margin: "6vh auto" }}>
      <h2 style={{ fontSize: 22, marginBottom: 24 }}>Tous les voyages scolaires</h2>
      {loading ? <div>Chargement…</div> : (
        <>
          {!voyages.length && <div>Aucun voyage.</div>}
          {voyages.map(v => (
            <div key={v.id} style={{ border: "1px solid #eee", borderRadius: 8, margin: "24px 0", padding: 20 }}>
              <div style={{ marginBottom: 10 }}>
                <b>{v.lieu}</b> ({v.classes}) — du {v.date_depart} au {v.date_retour} — <b>État</b> : {v.etat}
              </div>
              <div>
                <b>Organisateur&nbsp;:</b> {v.prenom} {v.nom} ({v.email})<br/>
                <b>Établissement :</b> {v.direction_cible}<br/>
                <b>Activité :</b> {v.activite}<br/>
                <b>Élèves :</b> {v.effectif_eleves} | Accompagnateurs : {v.effectif_accompagnateurs}<br/>
                {v.commentaire && <><b>Commentaire créateur :</b> {v.commentaire}<br/></>}
                <b>Date déclaration :</b> {new Date(v.date_declaration).toLocaleString()}
              </div>
              {v.programme && (
                <div style={{ marginTop: 10 }}>
                  <b>Programme :</b> <a href={base64ToUrl(v.programme)} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>{v.programme.filename}</a>
                </div>
              )}
              {v.pieces_jointes && v.pieces_jointes.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <b>Autres pièces :</b>
                  <ul>
                    {v.pieces_jointes.map((pj, i) => (
                      <li key={i}>
                        <a href={base64ToUrl(pj)} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>
                          {pj.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {v.etape_2 && (
                <div style={{ marginTop: 10 }}>
                  <b>Étape 2 (Besoins repas/devis) :</b>
                  <div>
                    <b>Panier repas :</b> {v.etape_2.panier_repas ? "Oui" : "Non"}
                    {v.etape_2.panier_repas && (
                      <>
                        ; {v.etape_2.nb_repas} repas, dont {v.etape_2.nb_vegetariens} végétariens
                        ; Lieu : {v.etape_2.lieu_repas}
                        <br/>Détails : {v.etape_2.details_panier_repas}
                      </>
                    )}
                  </div>
                  <div>
                    <b>Devis transporteur :</b> {v.etape_2.devis_transporteur ? "Oui" : "Non"}
                    {v.etape_2.devis_transporteur && (
                      <span>; Détail : {v.etape_2.details_devis_transporteur}</span>
                    )}
                  </div>
                  {v.etape_2.commentaire && (
                    <div><b>Commentaire étape 2:</b> {v.etape_2.commentaire}</div>
                  )}
                </div>
              )}
              {v.devis && v.devis.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <b>Devis reçus :</b>
                  <ul>
                    {v.devis.map((d, i) => (
                      <li key={i}>
                        {d.transporteur ? <span><b>{d.transporteur}</b> : </span> : null}
                        <a href={base64ToUrl(d)} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>{d.filename}</a>
                        {d.message && <div style={{ fontSize: 13, color: "#444" }}>📝 {d.message}</div>}
                        <div style={{ fontSize: 12, color: "#777" }}>
                          {d.date ? "Déposé le " + new Date(d.date).toLocaleString() : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}