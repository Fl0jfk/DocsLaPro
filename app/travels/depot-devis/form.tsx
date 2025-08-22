"use client";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function DepotDevisForm() {
  const sp = useSearchParams();
  const id = sp.get("id") || "";
  const transporteur = sp.get("transporteur") || "";
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !fileInput.current?.files?.[0]) {
      setMsg("Merci de sélectionner un fichier PDF à déposer.");
      return;
    }
    setLoading(true);
    setMsg("");
    const formData = new FormData();
    formData.set("id", id);
    if (transporteur) formData.set("transporteur", transporteur);
    formData.set("devis", fileInput.current.files[0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.set("message", (e.target as any).message.value);
    const res = await fetch("/api/voyages/deposer-devis", { method: "POST", body: formData });
    const rep = await res.json();
    setLoading(false);
    setMsg(rep.message || rep.error);
    if (rep.success) { if (fileInput.current) fileInput.current.value = ""; }
  }
  if (!id) return <div>Aucun voyage identifié.</div>;
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "5vh auto", background: "#fff", borderRadius: 8, padding: 32, boxShadow: "0 1px 5px #ddd" }}>
      <h2>Déposer un devis transporteur</h2>
      <div>
        <label>Attachez ici votre devis (PDF)</label><br/>
        <input type="file" name="devis" ref={fileInput} accept=".pdf" required style={{ margin: "15px 0"}} />
      </div>
      <div>
        <label>Votre message (optionnel) :</label><br/>
        <textarea name="message" placeholder="Un commentaire sur ce devis ?" style={{ width: "100%" }}/>
      </div>
      <button type="submit" disabled={loading}>Envoyer</button>
      {msg && <div style={{ marginTop: 18, color: msg.toLowerCase().includes("merci") ? "green" : "red" }}>{msg}</div>}
    </form>
  );
}
