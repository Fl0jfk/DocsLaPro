"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { v4 as uuidv4 } from "uuid";

export default function VoyageForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const progInput = useRef<HTMLInputElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  if (!isLoaded) return <div>Chargement…</div>;
  if (!user) return <div>Vous devez être connecté(e).</div>;
  const prenom = user.firstName || "";
  const nom = user.lastName || "";
  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";
  async function uploadToS3(voyageId: string, file: File) {
    const res = await fetch("/api/travels/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voyageId,
        filename: file.name,
        type: file.type,
      }),
    });
    const { uploadUrl, fileUrl } = await res.json();
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    return fileUrl;
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const voyageId = uuidv4();
    const programmeFile = progInput.current?.files?.[0] || null;
    const pjFiles = fileInput.current?.files || [];
    let programme = null;
    const pieces_jointes: { filename: string; url: string }[] = [];
    if (programmeFile) {
      const url = await uploadToS3(voyageId, programmeFile);
      programme = { filename: programmeFile.name, url };
    }
    for (const file of pjFiles) {
      const url = await uploadToS3(voyageId, file);
      pieces_jointes.push({ filename: file.name, url });
    }
    const body = {
      id: voyageId,
      prenom,
      nom,
      email,
      direction_cible: formData.get("direction_cible"),
      date_depart: formData.get("date_depart"),
      date_retour: formData.get("date_retour"),
      lieu: formData.get("lieu"),
      activite: formData.get("activite"),
      classes: formData.get("classes"),
      effectif_eleves: Number(formData.get("effectif_eleves")),
      effectif_accompagnateurs: Number(formData.get("effectif_accompagnateurs")),
      commentaire: formData.get("commentaire") || "",
      status: "draft",
      programme,
      pieces_jointes,
    };
    const res = await fetch("/api/travels/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setResult(json.message || json.error);
    setLoading(false);
    form.reset();
  }
  return (
    <form onSubmit={handleSubmit} className="pt-[15vh] flex flex-col items-center gap-4 max-w-xl mx-auto">
      <h2>Demande de sortie / voyage scolaire</h2>
      <label> Prénom :
        <input value={prenom} readOnly style={{ background: "#f5f5f5" }} />
      </label>
      <label> Nom :
        <input value={nom} readOnly style={{ background: "#f5f5f5" }} />
      </label>
      <label> Email :
        <input value={email} readOnly style={{ background: "#f5f5f5" }} />
      </label>
      <label> Établissement concerné :
        <select name="direction_cible" required>
          <option value="">Choisir…</option>
          <option value="direction_ecole">École</option>
          <option value="direction_college">Collège</option>
          <option value="direction_lycee">Lycée</option>
        </select>
      </label>
      <label> Date de départ :
        <input type="date" name="date_depart" required />
      </label>
      <label> Date de retour :
        <input type="date" name="date_retour" required />
      </label>
      <label> Lieu / destination :
        <input type="text" name="lieu" required />
      </label>
      <label> Activité / motif :
        <input type="text" name="activite" required />
      </label>
      <label> Classes concernées :
        <input type="text" name="classes" required />
      </label>
      <label> Nombre d’élèves :
        <input type="number" name="effectif_eleves" min={1} required />
      </label>
      <label> Nombre d’accompagnateurs :
        <input type="number" name="effectif_accompagnateurs" min={1} required />
      </label>
      <label> Pièces jointes :
        <input ref={fileInput} type="file" multiple accept=".pdf,.doc,.docx,image/*" />
      </label>
      <label> Commentaire :
        <textarea name="commentaire" />
      </label>
      <button type="submit" disabled={loading} style={{ marginTop: 15 }}>
        {loading ? "Traitement…" : "Soumettre la demande"}
      </button>
      {result && <div style={{ marginTop: 12 }}>{result}</div>}
    </form>
  );
}
