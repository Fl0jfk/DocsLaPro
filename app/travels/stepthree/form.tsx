"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type PieceJointe = {
  filename: string;
  buffer: string;
  type: string;
};

export type DevisTransporteur = {
  filename: string;
  buffer: string;
  type: string;
  date: string;
  transporteur?: string;
  message?: string;
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
  devis?: DevisTransporteur[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  etape_2?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  etape_3?: any;
};

function base64ToUrl(pj: PieceJointe) {
  if (pj.buffer.startsWith("")) return pj.buffer;
  return `${pj.type};base64,${pj.buffer}`;
}

export default function Step3Form() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  const router = useRouter();
  const [voyage, setVoyage] = useState<VoyageEntry | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const circulaireRef = useRef<HTMLInputElement>(null);
  const elevesRef = useRef<HTMLInputElement>(null);
  const accRef = useRef<HTMLInputElement>(null);
  const autresRef = useRef<HTMLInputElement>(null);
  const [dateReunion, setDateReunion] = useState("");
  const [dateEnvoiParents, setDateEnvoiParents] = useState("");
  const [participation, setParticipation] = useState<number | ''>('');
  const [coutTotal, setCoutTotal] = useState<number | ''>('');
  const [commentaire, setCommentaire] = useState("");
  useEffect(() => {
    if (!id) return;
    fetch("/api/travels/stepone?id=" + id)
      .then(r => r.json())
      .then((v: VoyageEntry) => {
        setVoyage(v);
        if (
          v.etape_2?.devis_transporteur &&
          (!v.devis || v.devis.length < 1)
        ) {
          setBlocked(true);
        }
      });
  }, [id]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const formData = new FormData();
    formData.set("id", id);
    formData.set("date_reunion_info", dateReunion);
    formData.set("date_envoi_circulaire_parents", dateEnvoiParents);
    formData.set("participation_famille", participation + "");
    formData.set("cout_total_voyage", coutTotal + "");
    formData.set("commentaire", commentaire);
    if (circulaireRef.current?.files?.[0])
      formData.set("circulaire_depart", circulaireRef.current.files[0]);
    if (elevesRef.current?.files?.[0])
      formData.set("liste_eleves", elevesRef.current.files[0]);
    if (accRef.current?.files?.[0])
      formData.set("liste_accompagnateurs", accRef.current.files[0]);
    if (autresRef.current?.files?.length)
      Array.from(autresRef.current.files).forEach(file => formData.append("autres_pieces", file));
    const res = await fetch("/api/travels/stepthree", {
      method: "POST",
      body: formData,
    });
    const rep = await res.json();
    setLoading(false);
    setMsg(rep.message || rep.error);
    if (rep.success) router.push(`/travels/mes-voyages`);
  }
  if (!id) return <div>Aucun voyage identifié.</div>;
  if (!voyage) return <div>Chargement…</div>;
  if (blocked) return <div style={{ background: "#fffbe1", padding: 24, borderRadius: 8, margin: 30 }}>
    <h3>Voyage en attente de devis transporteur</h3>
    <div>Vous avez demandé des devis transporteur lors de l’étape 2.<br/>
    Attendez que les devis attendus soient déposés avant de continuer.
    </div>
  </div>;
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 555, margin: "6vh auto", background: "#fff", borderRadius: 8, padding: 32, boxShadow: "0 1px 5px #eee" }} encType="multipart/form-data">
      <h2>Voyage scolaire – Étape 3 (validation finale)</h2>
      <div>Destination : <b>{voyage.lieu}</b> ({voyage.date_depart} au {voyage.date_retour})</div>
      <div>Organisateur : <b>{voyage.prenom} {voyage.nom}</b></div>
      <div>Direction concernée : <b>{voyage.direction_cible}</b></div>
      <div>Effectif : {voyage.effectif_eleves} élèves, {voyage.effectif_accompagnateurs} accompagnateurs</div>
      <div>Programme : {voyage.programme && (
        <Link href={base64ToUrl(voyage.programme)} target="_blank" rel="noopener noreferrer">{voyage.programme.filename}</Link>
      )}</div>
      {voyage.pieces_jointes && voyage.pieces_jointes.length > 0 && (
        <div>Autres PJ:&nbsp;
          {voyage.pieces_jointes.map((pj, i) =>
            <Link key={i} href={base64ToUrl(pj)} target="_blank" rel="noopener noreferrer" style={{ marginRight: 7 }}>{pj.filename}</Link>
          )}
        </div>
      )}
      {voyage.devis && voyage.devis.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <b>Devis transporteurs reçus :</b>
          <ul>
            {voyage.devis.map((d, i) =>
              <li key={i}>
                {d.transporteur && <b>{d.transporteur} : </b>}
                <Link href={base64ToUrl(d)} target="_blank" rel="noopener noreferrer">{d.filename}</Link>
              </li>
            )}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 18, fontWeight: 600 }}>Documents et infos à déposer pour la validation finale</div>
      <div>
        <label>Circulaire de départ :* <input type="file" name="circulaire_depart" ref={circulaireRef} required /></label>
      </div>
      <div>
        <label>Date réunion info :* <input type="date" name="date_reunion_info" value={dateReunion} onChange={e=>setDateReunion(e.target.value)} required /></label>
      </div>
      <div>
        <label>Date envoi circulaire parents :* <input type="date" name="date_envoi_circulaire_parents" value={dateEnvoiParents} onChange={e=>setDateEnvoiParents(e.target.value)} required /></label>
      </div>
      <div>
        <label>Participation famille (€)&nbsp;: <input type="number" step="0.01" name="participation_famille" value={participation} onChange={e => setParticipation(Number(e.target.value)||"")} required /></label>
      </div>
      <div>
        <label>Coût total voyage (€)&nbsp;: <input type="number" step="0.01" name="cout_total_voyage" value={coutTotal} onChange={e => setCoutTotal(Number(e.target.value)||"")} required /></label>
      </div>
      <div>
        <label>Liste des élèves&nbsp;: <input type="file" name="liste_eleves" ref={elevesRef} accept=".pdf,.csv,.xls,.xlsx" required /></label>
      </div>
      <div>
        <label>Liste des accompagnateurs&nbsp;: <input type="file" name="liste_accompagnateurs" ref={accRef} accept=".pdf,.csv,.xls,.xlsx" /></label>
      </div>
      <div>
        <label>Autres pièces jointes éventuelles : <input type="file" name="autres_pieces" ref={autresRef} multiple /></label>
      </div>
      <div>
        <label>Commentaire :
          <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} style={{ width: 320, marginLeft: 8 }} />
        </label>
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: 16 }}>{loading ? "Envoi..." : "Envoyer pour validation finale"}</button>
      {msg && <div style={{ marginTop: 18, color: msg.toLowerCase().includes("succès") ? "green" : "red" }}>{msg}</div>}
    </form>
  );
}
