"use client";

import { useEffect, useState } from "react";
import type { MailPreviewType } from "@/app/lib/travels-mail-preview";
import { TripButton } from "@/app/components/travels/TripDetailUI";

type Preview = {
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  attachments: { filename: string; description: string }[];
};

export function TripMailPreviewModal({
  tripId,
  type,
  label,
  onClose,
}: {
  tripId: string;
  type: MailPreviewType;
  label: string;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/travels/mail-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, type }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.preview) setPreview(d.preview);
        else setError(d.error || "Erreur");
      })
      .catch(() => setError("Chargement impossible"))
      .finally(() => setLoading(false));
  }, [tripId, type]);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Aperçu du mail</h2>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
          <TripButton variant="ghost" size="sm" onClick={onClose}>
            ✕
          </TripButton>
        </div>
        {loading && <p className="text-sm text-slate-400 animate-pulse">Chargement…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {preview && (
          <div className="space-y-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p>
                <span className="font-bold text-slate-500">À :</span> {preview.to.join(", ")}
              </p>
              {preview.cc?.length ? (
                <p>
                  <span className="font-bold text-slate-500">Cc :</span> {preview.cc.join(", ")}
                </p>
              ) : null}
              <p>
                <span className="font-bold text-slate-500">Objet :</span> {preview.subject}
              </p>
            </div>
            <pre className="whitespace-pre-wrap bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono leading-relaxed">
              {preview.text}
            </pre>
            {preview.attachments.length > 0 && (
              <div>
                <p className="font-bold text-slate-600 mb-1">Pièces jointes</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  {preview.attachments.map((a) => (
                    <li key={a.filename}>
                      📎 {a.filename} — {a.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <TripButton variant="secondary" onClick={onClose}>
            Fermer
          </TripButton>
        </div>
      </div>
    </div>
  );
}
