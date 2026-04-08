"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function PublicChatbotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Bonjour, je suis l'assistant de La Providence. Posez votre question." },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, audience: "public" }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || data.error || "Je ne peux pas répondre pour le moment." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur réseau, merci de réessayer." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Assistant IA</h1>
      <p className="text-sm text-slate-600 mb-6">Questions publiques: inscriptions, infos générales, voyages.</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 h-[55vh] overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-sky-50 ml-10" : "bg-slate-50 mr-10"}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Ex: Comment se passe une pré-inscription ?"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "..." : "Envoyer"}
        </button>
      </div>
    </main>
  );
}
