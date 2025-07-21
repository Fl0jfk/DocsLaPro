"use client";

import { useRef, useState } from "react";

export default function AbsenceDeclarationForm() {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // CONTRÔLE 5 PJ MAX
    if (fileInput.current?.files && fileInput.current.files.length > 5) {
      setResult("Vous ne pouvez joindre que 5 fichiers maximum.");
      setLoading(false);
      return;
    }

    // Ajoute chaque fichier comme "attachments"
    if (fileInput.current?.files) {
      Array.from(fileInput.current.files).forEach(file => {
        formData.append("attachments", file);
      });
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

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="pt-[20vh] flex flex-col items-center gap-4">
      <h2>Déclaration d’absence</h2>
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
          <option value="college">Collège</option>
          <option value="lycee">Lycée</option>
        </select>
      </label>
      <label>
        Nom/prénom&nbsp;:
        <input type="text" name="nom" required />
      </label>
      <label>
        Email&nbsp;:
        <input type="email" name="email" required />
      </label>
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
        <input
          type="file"
          name="attachments"
          ref={fileInput}
          multiple
          accept="image/*,.pdf"
          max={5}
        />
      </label>
      <label>
        Commentaire :
        <textarea name="commentaire" />
      </label>
      <button type="submit" disabled={loading} style={{ marginTop: 15 }}>
        {loading ? "Envoi..." : "Déclarer mon absence"}
      </button>
      {result && <div style={{ marginTop: 12 }}>{result}</div>}
    </form>
  );
}
