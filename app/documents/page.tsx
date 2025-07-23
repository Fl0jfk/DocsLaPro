'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

type S3Document = {
  title: string;
  url: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<S3Document[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/documents/list")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setDocuments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div>Chargement...</div>;
  return (
    <main className="flex flex-col gap-6 p-6 w-full mx-auto max-w-[1000px] md:pt-[13vh] sm:pt-[13vh]">
      <section className="space-y-4">
        {documents.length > 0 ? (
          documents.map((doc, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold">{doc.title}</h3>
              <Link className="text-blue-500 hover:underline" href={doc.url}>Télécharger</Link>
            </div>
          ))
        ) : (
          <p>Aucun document disponible pour votre rôle.</p>
        )}
      </section>
    </main>
  );
}

