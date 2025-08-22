"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function AbsenceDeclarationForm() {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const prenomClerk = user?.firstName || "";
    const nomClerk = user?.lastName || "";
    const emailClerk = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
    formData.set("nom", `${prenomClerk} ${nomClerk}`.trim());
    formData.set("email", emailClerk);
    if (fileInput.current?.files && fileInput.current.files.length > 5) {
      setResult("Vous ne pouvez joindre que 5 fichiers maximum.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/absence/want", {
      method: "POST",
      body: formData,
    });
    const reponse = await res.json();
    setLoading(false);
    setResult(reponse.message || reponse.error);
    if (fileInput.current) fileInput.current.value = "";
    form.reset();
  }
  if (!isLoaded) return <div>Chargement…</div>;
  if (!user) return <div>Vous devez être connecté(e).</div>;
  const prenomClerk = user.firstName || "";
  const nomClerk = user.lastName || "";
  const emailClerk =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    "";
  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="pt-[20vh] flex flex-col items-center gap-4">
      <h2 className="">Déclaration d’absence</h2>
      <label>Prénom&nbsp;: <input type="text" name="prenom_display" value={prenomClerk} readOnly tabIndex={-1} style={{ background: "#f5f5f5" }} />
      </label>
      <label>Nom&nbsp;: <input type="text" name="nom_display" value={nomClerk} readOnly tabIndex={-1} style={{ background: "#f5f5f5" }} />
      </label>
      <label>Email&nbsp;: <input type="email" name="email_display" value={emailClerk} readOnly tabIndex={-1} style={{ background: "#f5f5f5" }} />
      </label>
      <label>
        Je suis&nbsp;:
        <select name="type" required>
          <option value="">Choisir…</option>
          <option value="prof">Professeur</option>
          <option value="salarie">Personnel/salarié</option>
        </select>
      </label>
      <label>
        Établissement concerné&nbsp;:
        <select name="cible" required>
          <option value="">Choisir…</option>
          <option value="direction_ecole">École</option>
          <option value="direction_college">Collège</option>
          <option value="direction_lycee">Lycée</option>
        </select>
      </label>
      <input type="hidden" name="nom" value={`${prenomClerk} ${nomClerk}`.trim()} readOnly />
      <input type="hidden" name="email" value={emailClerk} readOnly />
      <label>
        Début&nbsp;: <input type="date" name="date_debut" required />
      </label>
      <label>
        Fin&nbsp;: <input type="date" name="date_fin" required />
      </label>
      <label>
        Motif d’absence&nbsp;:
        <input type="text" name="motif" required />
      </label>
      <label>
        Justificatifs (5 max)&nbsp;:
        <input type="file" name="attachments" ref={fileInput} multiple accept="image/*,.pdf" max={5}/>
      </label>
      <label>Commentaire :<textarea name="commentaire" />
      </label>
      <button type="submit" disabled={loading} style={{ marginTop: 15 }}>{loading ? "Envoi..." : "Déclarer mon absence"}</button>
      {result && <div style={{ marginTop: 12 }}>{result}</div>}
    </form>
  );
}
