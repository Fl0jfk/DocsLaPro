"use client";
import { useSearchParams } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";

export default function DepotDevisForm() {
  const sp = useSearchParams();
  const voyageId = sp.get("voyageId") || "";
  const transporteurId = sp.get("transporteurId") || "";
  const token = sp.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
    console.log("Query params récupérés côté client :");
    console.log("voyageId =", voyageId);
    console.log("transporteurId =", transporteurId);
    console.log("token =", token);
  }, [voyageId, transporteurId, token]);
  const uploadFile = useCallback(async (file: File) => {
    if (!voyageId || !transporteurId || !token) {
      setMsg("Lien invalide ou expiré.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const formData = new FormData();
      formData.set("voyageId", voyageId);
      formData.set("transporteurId", transporteurId);
      formData.set("token", token);
      formData.set("devis", file);
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
  }, [voyageId, transporteurId, token]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/pdf") {
        setMsg("Merci de déposer un fichier PDF.");
        return;
      }
      uploadFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setMsg("Merci de sélectionner un fichier PDF.");
        return;
      }
      uploadFile(file);
    }
  };

  if (!voyageId || !transporteurId || !token)
    return <div>Lien invalide ou expiré.</div>;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        maxWidth: 400,
        margin: "5vh auto",
        background: dragOver ? "#f0f8ff" : "#fff",
        borderRadius: 8,
        padding: 32,
        boxShadow: "0 1px 5px #ddd",
        textAlign: "center",
        border: dragOver ? "2px dashed #4CAF50" : "2px dashed #ccc",
      }}
    >
      <h2>Déposer un devis transporteur</h2>
      <p style={{ marginBottom: 16 }}>
        Glissez-déposez votre fichier PDF ici <br />ou cliquez pour sélectionner un fichier.
      </p>

      <input
        type="file"
        accept=".pdf"
        ref={fileInput}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={loading}
        style={{
          marginBottom: 16,
          padding: "8px 16px",
          background: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Envoi..." : "Choisir un fichier"}
      </button>

      <div style={{ marginTop: 16 }}>
        <textarea
          ref={messageInput}
          placeholder="Votre message (optionnel)"
          style={{ width: "100%" }}
        />
      </div>

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
    </div>
  );
}
