"use client";

import { useState } from "react";

export default function TestS3Access() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUrl = async () => {
    setLoading(true);
    setError("");
    setUrl("");

    try {
      const res = await fetch("/api/files/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "Photos Elèves/ADELINE Louise.jpg", // <-- adapte ici selon le chemin dans ton bucket
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setUrl(data.url);
        window.open(data.url, "_blank"); // Ouvre le lien dans un nouvel onglet
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 500 }}>
      <button
        onClick={fetchUrl}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          background: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {loading ? "Chargement..." : "Tester accès sécurisé S3"}
      </button>

      {url && (
        <div style={{ marginTop: "1rem", wordBreak: "break-all" }}>
          ✅ Lien signé généré :
          <br />
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          ❌ Erreur : {error}
        </div>
      )}
    </div>
  );
}
