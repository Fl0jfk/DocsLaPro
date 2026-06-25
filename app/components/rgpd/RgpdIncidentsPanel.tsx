"use client";

import { useEffect, useRef, useState } from "react";
import type {
  RgpdDataBreachFields,
  RgpdIncident,
  RgpdIncidentKind,
  RgpdSecurityIncidentFields,
} from "@/app/lib/rgpd-types";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function RgpdIncidentsPanel() {
  const [incidents, setIncidents] = useState<RgpdIncident[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RgpdIncidentKind>("violation_donnees");
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<RgpdDataBreachFields | RgpdSecurityIncidentFields>({});
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await fetch("/api/rgpd/incidents");
    if (res.ok) {
      const data = await res.json();
      setIncidents(data.incidents ?? []);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const startNew = (k: RgpdIncidentKind) => {
    setKind(k);
    setTitle(k === "violation_donnees" ? "Violation de données" : "Incident de sécurité");
    setFields({});
    setHistory([
      {
        role: "assistant",
        content:
          k === "violation_donnees"
            ? "Décrivez ce qui s'est passé (nature, données concernées, quand, mesures prises). Je remplirai la fiche avec vous."
            : "Décrivez l'incident informatique (type, systèmes impactés, mesures). Je compléterai la fiche.",
      },
    ]);
    setOpen(true);
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    const nextHistory = [...history, { role: "user" as const, content: msg }];
    setHistory(nextHistory);
    setSending(true);
    try {
      const res = await fetch("/api/rgpd/incidents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message: msg, history: nextHistory, fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur assistant");
      setFields(data.fields ?? fields);
      if (data.title) setTitle(data.title);
      setHistory((h) => [...h, { role: "assistant", content: data.assistantMessage }]);
    } catch (e) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "Erreur : " + (e instanceof Error ? e.message : String(e)),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/rgpd/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, fields, chatHistory: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec enregistrement");
      setOpen(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => startNew("violation_donnees")}
          className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl"
        >
          Violation de données
        </button>
        <button
          type="button"
          onClick={() => startNew("incident_securite")}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl"
        >
          Incident de sécurité
        </button>
      </div>

      {incidents.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun incident enregistré.</p>
      ) : (
        <ul className="space-y-2">
          {incidents.map((inc) => (
            <li
              key={inc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">{inc.title}</p>
                <p className="text-xs text-slate-500">
                  {inc.kind === "violation_donnees" ? "Violation données" : "Sécurité"} —{" "}
                  {new Date(inc.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <a
                href={`/api/rgpd/incidents/${inc.id}/pdf`}
                className="text-xs font-bold text-indigo-600 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                PDF
              </a>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-900">{title}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-500">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {history.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-xl px-3 py-2 max-w-[90%] ${
                    m.role === "user"
                      ? "ml-auto bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t space-y-3">
              <pre className="text-xs bg-slate-50 border rounded-lg p-2 max-h-24 overflow-auto">
                {JSON.stringify(fields, null, 2)}
              </pre>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-xl px-3 py-2 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void send()}
                  placeholder="Décrivez la situation…"
                />
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void send()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="w-full py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer la fiche"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
