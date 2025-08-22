'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

type DocumentNode = {
  type: "folder" | "file";
  name: string;
  url?: string;
  path: string;
};

export default function DocumentsPage() {
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [items, setItems] = useState<DocumentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/documents/list?prefix=${currentPrefix}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error("Erreur API documents:", data.error);
          setItems([]);
        } else {
          setItems(data);
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
    setCurrentPrefix(path.replace(/^documents\/[^/]+\//, ""));
  };
  const goBack = () => {
    const prev = history.pop();
    if (prev !== undefined) {
      setHistory([...history]);
      setCurrentPrefix(prev);
    }
  };
  if (loading) return <div>Chargement...</div>;
  return (
    <main className="flex flex-col gap-12 p-6 w-full mx-auto max-w-[1000px] md:pt-[10vh] sm:pt-[10vh]">
      <section className="space-y-4">
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
                <>
                  <h3 className="font-semibold">{item.name}</h3>
                  <Link className="text-blue-500 hover:underline" href={item.url!}>Télécharger</Link>
                </>
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
