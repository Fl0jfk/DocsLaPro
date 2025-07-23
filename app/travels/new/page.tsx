"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function VoyageForm() {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const progInput = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    if (!user) return;
    const prenom = user.firstName || "";
    const nom = user.lastName || "";
    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      "";
    formData.set("prenom", prenom);
    formData.set("nom", nom);
    formData.set("email", email);
    if (fileInput.current?.files && fileInput.current.files.length > 5) {
      setResult("Vous ne pouvez joindre que 5 fichiers maximum.");
      setLoading(false);
      return;
    }
    if (progInput.current?.files && progInput.current.files.length > 1) {
      setResult("Une seule pièce jointe autorisée pour le programme.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/travels/create", {
      method: "POST",
      body: formData,
    });
    const reponse = await res.json();
    setLoading(false);
    setResult(reponse.message || reponse.error);
    if (fileInput.current) fileInput.current.value = "";
    if (progInput.current) progInput.current.value = "";
    form.reset();
  }
  if (!isLoaded) return <div>Chargement…</div>;
  if (!user) return <div>Vous devez être connecté(e).</div>;
  const prenom = user.firstName || "";
  const nom = user.lastName || "";
  const email =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    "";
  return (
    <form onSubmit={handleSubmit} className="pt-[15vh] flex flex-col items-center gap-4 max-w-xl mx-auto" encType="multipart/form-data">
      <h2>Demande de sortie / voyage scolaire</h2>
      <label>Prénom :
        <input value={prenom} readOnly style={{ background: "#f5f5f5" }} tabIndex={-1} />
      </label>
      <label>Nom :
        <input value={nom} readOnly style={{ background: "#f5f5f5" }} tabIndex={-1} />
      </label>
      <label>Email :
        <input value={email} readOnly style={{ background: "#f5f5f5" }} tabIndex={-1} />
      </label>
      <input type="hidden" name="prenom" value={prenom} />
      <input type="hidden" name="nom" value={nom} />
      <input type="hidden" name="email" value={email} />
      <label>Établissement concerné :
        <select name="direction_cible" required>
          <option value="">Choisir…</option>
          <option value="direction_ecole">École</option>
          <option value="direction_college">Collège</option>
          <option value="direction_lycee">Lycée</option>
        </select>
      </label>
      <label>Date de départ :
        <input type="date" name="date_depart" required />
      </label>
      <label>Date de retour :
        <input type="date" name="date_retour" required />
      </label>
      <label>Lieu / destination :
        <input type="text" name="lieu" required />
      </label>
      <label>Activité / motif :
        <input type="text" name="activite" required />
      </label>
      <label>Classes concernées :
        <input type="text" name="classes" placeholder="Ex: 3A, 3B, ULIS…" required />
      </label>
      <label>Nombre d’élèves :
        <input type="number" name="effectif_eleves" min={1} required />
      </label>
      <label>Nombre d’accompagnateurs :
        <input type="number" name="effectif_accompagnateurs" min={1} required />
      </label>
      <label>Programme (itinéraire/jours/destination en détail) :
        <input ref={progInput} type="file" name="programme" accept=".pdf,.doc,.docx,image/*"/>
      </label>
      <label>Autres pièces jointes (5 max) :
        <input ref={fileInput} type="file" name="pj" multiple accept="image/*,.pdf" max={5}/>
      </label>
      <label>Commentaire:
        <textarea name="commentaire" />
      </label>
      <button type="submit" disabled={loading} style={{ marginTop: 15 }}>
        {loading ? "Traitement…" : "Soumettre la demande"}
      </button>
      {result && <div style={{ marginTop: 12 }}>{result}</div>}
    </form>
  );
}