'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

type DocumentNode = {
  type: "folder" | "file";
  name: string;
  url?: string;
  path: string;
  ext?: string;
};

export default function DocumentsPage() {
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [items, setItems] = useState<DocumentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  const cacheKey = (prefix: string) => `documents_cache_${prefix}`;
  const cacheTTL = 24 * 60 * 60 * 1000; // 24h

  useEffect(() => {
    setLoading(true);

    const cachedRaw = localStorage.getItem(cacheKey(currentPrefix));
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      const now = Date.now();
      if (now - cached.timestamp < cacheTTL) {
        setItems(cached.data);
        setLoading(false);
        return;
      }
    }

    fetch(`/api/documents/list?prefix=${encodeURIComponent(currentPrefix)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error("Erreur API documents:", data.error);
          setItems([]);
        } else {
          setItems(data);
          localStorage.setItem(cacheKey(currentPrefix), JSON.stringify({
            data,
            timestamp: Date.now(),
          }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur fetch documents:", err);
        setLoading(false);
      });
  }, [currentPrefix]);

  const enterFolder = (path: string) => {
    setHistory(prev => [...prev, currentPrefix]);
    setCurrentPrefix(path);
  };

  const goBack = () => {
    const prev = history.pop();
    if (prev !== undefined) {
      setHistory([...history]);
      setCurrentPrefix(prev);
    }
  };

  const getFileIcon = (ext?: string) => {
    if (!ext) return "📄";
    switch (ext.toLowerCase()) {
      case "pdf": return "📄";
      case "doc": case "docx": return "📝";
      case "xls": case "xlsx": return "📊";
      default: return "📄";
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <main className="flex flex-col gap-4 p-4 w-full mx-auto max-w-[1000px] sm:pt-[10vh]">
      <section className="space-y-4 flex flex-col gap-2">
        {history.length > 0 && (
          <button onClick={goBack} className="text-blue-500 hover:underline mb-4">← Retour</button>
        )}

        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="p-4 bg-white rounded-lg shadow-md">
              {item.type === "folder" ? (
                <div
                  className="cursor-pointer font-semibold text-yellow-700"
                  onClick={() => enterFolder(item.path)}
                >
                  📁 {item.name}
                </div>
              ) : (
                <div className="flex justify-between">
                  <h3 className="font-semibold">{getFileIcon(item.ext)} {item.name}</h3>
                  <Link className="text-blue-500 hover:underline" href={item.url!}>Télécharger</Link>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Aucun document disponible pour ce dossier.</p>
        )}
      </section>
    </main>
  );
}

