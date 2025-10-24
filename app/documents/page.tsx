'use client';

import { useState, useEffect } from "react";

type DocumentNode = {
  type: "folder" | "file";
  name: string;
  path: string;
  ext?: string;
};

export default function DocumentsPage() {
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [items, setItems] = useState<DocumentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const cacheKey = (prefix: string) => `documents_cache_${prefix}`;
  const cacheTTL = 15 * 60 * 1000;
  const [downloading, setDownloading] = useState<string | null>(null);
  console.log(downloading);
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
  }, [currentPrefix, cacheTTL]);
  const enterFolder = (path: string) => { setHistory(prev => [...prev, currentPrefix]); setCurrentPrefix(path);};
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
  const handleDownload = async (path: string) => {
  setDownloading(path);
  try {
    const res = await fetch(`/api/documents/get-url?key=${encodeURIComponent(path)}`);
    const data = await res.json();
    if (data.url) {
      const a = document.createElement("a");
      a.href = data.url;
      a.download = path.split("/").pop()!;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Erreur lors de la génération du lien sécurisé.");
    }
  } catch (e) {
    alert("Erreur téléchargement : " + String(e));
  }
  setDownloading(null);
};
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">Chargement en cours…</p>
        </div>
      </div>
    );
  }
  return (
    <main className="flex flex-col gap-4 p-4 w-full mx-auto max-w-[1000px] sm:pt-[10vh]">
      {history.length > 0 && (
        <button onClick={goBack} className="flex items-center space-x-2 text-sm text-blue-500 hover:text-blue-700 transition-colors duration-200">← Retour</button>
      )}
      {items.length > 0 ? (
        <div className="grid grid-cols-6 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <div key={idx} onClick={() => item.type === "folder" ? enterFolder(item.path) : handleDownload(item.path)} className="cursor-pointer flex flex-col items-center max-h-[150px] max-w-[100px]">
          <div className="text-5xl mb-2">{item.type === "folder" ? "📁" : getFileIcon(item.ext)}</div>
          <div className="text-center text-sm font-medium break-words overflow-hidden">{item.name}.{item.ext}</div>
        </div>
      ))}
    </div>
    ) : (
      <p className="text-gray-500 text-center">Aucun document disponible pour ce dossier.</p>
    )}
  </main>
  );
}
