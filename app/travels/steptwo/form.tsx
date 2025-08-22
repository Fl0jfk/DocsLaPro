"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  programme?: PieceJointe;
  etat: string;
  date_declaration: string;
  etape_2?: {
    panier_repas: boolean;
    nb_repas?: number;
    nb_vegetariens?: number;
    lieu_repas?: string;
    details_panier_repas?: string;
    devis_transporteur: boolean;
    details_devis_transporteur?: string;
    commentaire?: string;
  };
};

function base64ToUrl({ buffer, type }: { buffer: string; type: string }) {
  if (buffer.startsWith("data:")) return buffer;
  return `${type};base64,${buffer}`;
}

export default function VoyageEtape2Form() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const router = useRouter();
  const [voyage, setVoyage] = useState<VoyageEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [panier, setPanier] = useState(false);
  const [nbRepas, setNbRepas] = useState<number>(0);
  const [nbVeg, setNbVeg] = useState<number>(0);
  const [lieuRepas, setLieuRepas] = useState("");
  const [detailsRepas, setDetailsRepas] = useState("");
  const [devis, setDevis] = useState(false);
  const [detailsDevis, setDetailsDevis] = useState("");
  const [commentaire, setCommentaire] = useState("");
  useEffect(() => {
    async function fetchVoyage() {
      if (!id) return;
      const res = await fetch(`/api/travels/stepone?id=${id}`);
      if (res.ok) {
        const v = await res.json();
        setVoyage(v);
        if (v.etape_2) {
          setPanier(!!v.etape_2.panier_repas);
          setNbRepas(Number(v.etape_2.nb_repas || 0));
          setNbVeg(Number(v.etape_2.nb_vegetariens || 0));
          setLieuRepas(v.etape_2.lieu_repas || "");
          setDetailsRepas(v.etape_2.details_panier_repas || "");
          setDevis(!!v.etape_2.devis_transporteur);
          setDetailsDevis(v.etape_2.details_devis_transporteur || "");
          setCommentaire(v.etape_2.commentaire || "");
        }
      }
    }
    fetchVoyage();
  }, [id]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const payload = { id, panier_repas: panier, nb_repas: panier ? nbRepas : undefined, nb_vegetariens: panier ? nbVeg : undefined, lieu_repas: panier ? lieuRepas : undefined, details_panier_repas: panier ? detailsRepas : undefined, devis_transporteur: devis, details_devis_transporteur: devis ? detailsDevis : undefined, commentaire,};
    const res = await fetch("/api/travels/steptwo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const rep = await res.json();
    setLoading(false);
    setResult(rep.message || rep.error);
    if (devis && rep.success) {
      setTimeout(() => {
        router.push(`/travels/stepthree?id=${id}`);
      }, 1500);
    }
  }
  if (!id) return <div>Aucun voyage identifié.</div>;
  if (!voyage) return <div>Chargement…</div>;
  return (
    <form onSubmit={handleSubmit} className="pt-[8vh] flex flex-col items-center gap-4 max-w-xl mx-auto">
      <h2>Voyage scolaire – Étape 2</h2>
      <div style={{ marginBottom: 10, background: "#f9f9f9", borderRadius: 8, padding: 10, width: "100%" }}>
        <div><b>Validation direction :</b> Voyage validé par la direction {voyage.direction_cible}</div>
        <div><b>Dates du voyage :</b> {voyage.date_depart} au {voyage.date_retour}</div>
        <div><b>Organisateur :</b> {voyage.prenom} {voyage.nom} – {voyage.email}</div>
        <div><b>Destination / activité :</b> {voyage.lieu} – {voyage.activite}</div>
        <div><b>Classes :</b> {voyage.classes}</div>
        <div><b>Effectif :</b> {voyage.effectif_eleves} élèves, {voyage.effectif_accompagnateurs} accompagnateurs</div>
        {voyage.commentaire && <div><b>Commentaire&nbsp;:</b> {voyage.commentaire}</div>}
        <div style={{ marginTop: 10 }}>
          <b>Programme (itinéraire):</b><br/>
          {voyage.programme && (
            <Link href={base64ToUrl(voyage.programme)} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>{voyage.programme.filename}</Link>
          )}
        </div>
        {voyage.pieces_jointes && voyage.pieces_jointes.length > 0 && (
          <div style={{ marginTop: 5 }}>
            <b>Autres pièces jointes :</b>
            <ul style={{ paddingLeft: 18 }}>
              {voyage.pieces_jointes.map((f, idx) => {
                const isPdf = f.type === "application/pdf";
                const isImg = f.type.startsWith("image/");
                const url = base64ToUrl(f);
                return (
                  <li key={idx}>
                    {isImg && (
                      <>
                        <Link href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", marginRight: 8 }}>Voir l’image</Link>
                        <Image width={90} height={60} src={url} alt={f.filename} style={{ maxWidth: 90, maxHeight: 60, border: "1px solid #ccc" }} />
                      </>
                    )}
                    {isPdf && (
                      <Link href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>{f.filename}</Link>
                    )}
                    {!isImg && !isPdf && (
                      <Link href={url} download={f.filename} style={{ color: "#0070f3" }}>Télécharger&nbsp;: {f.filename}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div>
        <label>
          <input type="checkbox" checked={panier} onChange={e => setPanier(e.target.checked)}/>&nbsp;Besoin de paniers repas ?
        </label>
      </div>
      {panier && (
        <div style={{ width: "100%", background: "#f5f5f9", padding: 8, borderRadius: 5 }}>
          <label>Nombre total de repas :
            <input type="number" min={0} value={nbRepas} onChange={e => setNbRepas(Number(e.target.value) || 0)} name="nb_repas" style={{ marginLeft: 8, width: 65 }} />
          </label>
          <label style={{ marginLeft: 18 }}>dont végétariens :
            <input type="number" min={0} value={nbVeg} onChange={e => setNbVeg(Number(e.target.value) || 0)} name="nb_vegetariens" style={{ marginLeft: 6, width: 65 }} />
          </label>
          <label style={{ display: "block", marginTop: 7 }}>
            Lieu de repas / récupération :
            <input type="text" value={lieuRepas} onChange={e => setLieuRepas(e.target.value)} name="lieu_repas" style={{ width: 255, marginLeft: 8 }} placeholder="Ex : cantine, à emporter, livrés au car, etc."/>
          </label>
          <label style={{ display: "block", marginTop: 5 }}>Détails / particularités (allergies…)&nbsp;:
            <textarea value={detailsRepas} onChange={e => setDetailsRepas(e.target.value)} name="details_panier_repas" style={{ width: 255, display: "block" }}/>
          </label>
        </div>
      )}
      <div>
        <label>
          <input type="checkbox" checked={devis} onChange={e => setDevis(e.target.checked)}/>&nbsp;Demande de devis transporteurs ?
        </label>
      </div>
      {devis && (
        <div style={{ width: "100%", background: "#f5f5f9", padding: 8, borderRadius: 5 }}>
          <label>Détails (jours, horaires, points de départ, besoins, etc.) :
            <textarea value={detailsDevis} onChange={e => setDetailsDevis(e.target.value)} name="details_devis_transporteur" style={{ width: 255, display: "block" }}/>
          </label>
        </div>
      )}
      <div>
        <label>Commentaire complémentaire (facultatif) :
          <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} name="commentaire" style={{ width: 345 }}/>
        </label>
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: 15 }}>{loading ? "Traitement…" : "Soumettre l’étape 2" }</button>
      {result && <div style={{ marginTop: 12 }}>{result}</div>}
      {devis &&
        result?.toLowerCase().includes("succès") && (
          <div style={{ color: "green", marginTop: 10 }}>Etape 2 terminée. Vous allez être redirigé vers l’étape 3 pour la saisie des devis transporteur.</div>
        )}
    </form>
  );
}
