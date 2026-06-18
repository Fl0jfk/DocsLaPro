"use client";

import { useCallback, useEffect, useState } from "react";
import type { InternatJournalEntry, InternatMessage } from "@/app/lib/internat-types";

export default function InternatCommunicationPanel({ canManage }: { canManage: boolean }) {
  const [messages, setMessages] = useState<InternatMessage[]>([]);
  const [entries, setEntries] = useState<InternatJournalEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "", audience: "equipe" as InternatMessage["audience"] });
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "Liaison",
    content: "",
  });

  const load = useCallback(async () => {
    const [msgRes, jrnRes] = await Promise.all([
      fetch("/api/internat/messages", { cache: "no-store" }),
      fetch("/api/internat/journal", { cache: "no-store" }),
    ]);
    const msgData = await msgRes.json();
    const jrnData = await jrnRes.json();
    if (msgRes.ok) setMessages(msgData.messages || []);
    if (jrnRes.ok) setEntries(jrnData.entries || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sendMessage = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/internat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Envoi impossible");
      setMsgForm({ subject: "", body: "", audience: "equipe" });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const addJournal = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/internat/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(journalForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      setJournalForm({ date: new Date().toISOString().slice(0, 10), category: "Liaison", content: "" });
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 text-sm text-teal-950">
        <p className="font-bold mb-1">Communication internat</p>
        <p>Messages à l&apos;équipe et journal de liaison numérique (distinct des alertes urgence).</p>
      </div>

      <section className="space-y-4">
        <h3 className="font-black text-slate-900">Messagerie interne</h3>
        {canManage && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <select
              className="border rounded-xl px-3 py-2 text-sm w-full sm:w-auto"
              value={msgForm.audience}
              onChange={(e) => setMsgForm({ ...msgForm, audience: e.target.value as InternatMessage["audience"] })}
            >
              <option value="equipe">Équipe internat</option>
              <option value="direction">Direction</option>
              <option value="cpe">CPE</option>
              <option value="surveillants">Surveillants</option>
            </select>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="Sujet"
              value={msgForm.subject}
              onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
            />
            <textarea
              className="w-full border rounded-xl px-3 py-2 text-sm min-h-[100px]"
              placeholder="Message"
              value={msgForm.body}
              onChange={(e) => setMsgForm({ ...msgForm, body: e.target.value })}
            />
            <button
              type="button"
              disabled={busy}
              onClick={sendMessage}
              className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              Publier
            </button>
          </div>
        )}
        <div className="space-y-3">
          {messages.length === 0 && <p className="text-sm text-slate-500">Aucun message.</p>}
          {messages.map((m) => (
            <article key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-teal-700">{m.audience}</p>
              <h4 className="font-bold text-slate-900 mt-1">{m.subject}</h4>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{m.body}</p>
              <p className="text-xs text-slate-400 mt-2">
                {m.createdBy.name} — {new Date(m.createdAt).toLocaleString("fr-FR")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-black text-slate-900">Journal de liaison</h3>
        {canManage && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="date"
                className="border rounded-xl px-3 py-2 text-sm"
                value={journalForm.date}
                onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
              />
              <input
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="Catégorie"
                value={journalForm.category}
                onChange={(e) => setJournalForm({ ...journalForm, category: e.target.value })}
              />
            </div>
            <textarea
              className="w-full border rounded-xl px-3 py-2 text-sm min-h-[100px]"
              placeholder="Entrée du journal"
              value={journalForm.content}
              onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
            />
            <button
              type="button"
              disabled={busy}
              onClick={addJournal}
              className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              Ajouter au journal
            </button>
          </div>
        )}
        <div className="space-y-3">
          {entries.length === 0 && <p className="text-sm text-slate-500">Journal vide.</p>}
          {entries.map((e) => (
            <article key={e.id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">
                {e.date} · {e.category}
              </p>
              <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{e.content}</p>
              <p className="text-xs text-slate-400 mt-2">{e.createdBy.name}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
