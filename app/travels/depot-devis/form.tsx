"use client";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function DepotDevisForm() {
  const sp = useSearchParams();
  const voyageId = sp.get("voyageId") || "";
  const transporteurId = sp.get("transporteurId") || "";
  const token = sp.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!voyageId || !transporteurId || !token) {
      setMsg("Lien invalide ou expiré.");
      return;
    }
    if (!fileInput.current?.files?.[0]) {
      setMsg("Merci de sélectionner un fichier PDF à déposer.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const formData = new FormData();
      formData.set("voyageId", voyageId);
      formData.set("transporteurId", transporteurId);
      formData.set("token", token);
      formData.set("devis", fileInput.current.files[0]);
      if (messageInput.current?.value) formData.set("message", messageInput.current.value);
      const res = await fetch("/api/travels/devis/upload", { method: "POST", body: formData });
      const rep = await res.json();
      if (rep.success) {
        setMsg("Devis déposé avec succès !");
        if (fileInput.current) fileInput.current.value = "";
        if (messageInput.current) messageInput.current.value = "";
      } else {
        setMsg(rep.error || "Erreur lors du dépôt du devis.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  }
  if (!voyageId || !transporteurId || !token)
    return <div>Lien invalide ou expiré.</div>;
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "5vh auto",  background: "#fff", borderRadius: 8, padding: 32, boxShadow: "0 1px 5px #ddd",}}>
      <h2>Déposer un devis transporteur</h2>

      <div style={{ marginTop: 16 }}>
        <label>Attachez ici votre devis (PDF)</label><br />
        <input
          type="file"
          name="devis"
          ref={fileInput}
          accept=".pdf"
          required
          style={{ margin: "15px 0" }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Votre message (optionnel) :</label><br />
        <textarea
          name="message"
          ref={messageInput}
          placeholder="Un commentaire sur ce devis ?"
          style={{ width: "100%" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 16,
          padding: "8px 16px",
          background: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Envoi..." : "Envoyer"}
      </button>

      {msg && (
        <div
          style={{
            marginTop: 18,
            color: msg.toLowerCase().includes("succès") ? "green" : "red",
          }}
        >
          {msg}
        </div>
      )}
    </form>
  );
}
