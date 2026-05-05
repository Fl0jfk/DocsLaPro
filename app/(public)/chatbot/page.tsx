"use client";

import { Fragment, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RequestDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
};

function renderMessageContent(content: string) {
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const urlRegex = /\bhttps?:\/\/[^\s<>"')\]]+/g;
  const lines = content.split("\n");

  return lines.map((line, lineIndex) => {
    const nodes: Array<string | JSX.Element> = [];
    let cursor = 0;
    let key = 0;

    const pushPlainWithUrls = (plainText: string) => {
      let plainCursor = 0;
      for (const match of plainText.matchAll(urlRegex)) {
        const rawUrl = match[0];
        const start = match.index ?? 0;
        const end = start + rawUrl.length;
        if (start > plainCursor) {
          nodes.push(plainText.slice(plainCursor, start));
        }
        nodes.push(
          <a
            key={`url_${lineIndex}_${key++}`}
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline break-all"
          >
            {rawUrl}
          </a>
        );
        plainCursor = end;
      }
      if (plainCursor < plainText.length) {
        nodes.push(plainText.slice(plainCursor));
      }
    };

    for (const match of line.matchAll(markdownLinkRegex)) {
      const full = match[0];
      const label = match[1];
      const href = match[2];
      const start = match.index ?? 0;
      const end = start + full.length;

      if (start > cursor) {
        pushPlainWithUrls(line.slice(cursor, start));
      }
      nodes.push(
        <a
          key={`md_${lineIndex}_${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline break-all"
        >
          {label}
        </a>
      );
      cursor = end;
    }

    if (cursor < line.length) {
      pushPlainWithUrls(line.slice(cursor));
    }

    return (
      <Fragment key={`line_${lineIndex}`}>
        {nodes.length > 0 ? nodes : line}
        {lineIndex < lines.length - 1 && <br />}
      </Fragment>
    );
  });
}

export default function PublicChatbotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Bonjour, je suis l'assistant de La Providence. Posez votre question." },
  ]);
  const [loading, setLoading] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [requestDraft, setRequestDraft] = useState<RequestDraft>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    description: "",
  });

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

  const submitRequest = async () => {
    if (requestSending) return;
    setRequestSending(true);
    try {
      const res = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestDraft),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Impossible de créer la demande." }]);
        return;
      }
      if (data.needsEmailVerification) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              typeof data.message === "string"
                ? data.message
                : "Un e-mail de confirmation vous a été envoyé. Cliquez sur le lien pour valider votre demande.",
          },
        ]);
        setRequestDraft((prev) => ({ ...prev, subject: "", description: "" }));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Demande créée (${data.id}). Service destinataire: ${data?.assignedTo?.roleLabel || "à confirmer"}.` },
      ]);
      setRequestDraft((prev) => ({ ...prev, subject: "", description: "" }));
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur réseau, merci de réessayer." }]);
    } finally {
      setRequestSending(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Assistant IA</h1>
      <p className="text-sm text-slate-600 mb-6">Questions publiques: inscriptions, infos générales, voyages.</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 h-[55vh] overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-sky-50 ml-10" : "bg-slate-50 mr-10"}`}>
            {renderMessageContent(m.content)}
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
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-black text-slate-900 mb-3">Créer une demande de suivi</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={requestDraft.firstName} onChange={(e) => setRequestDraft((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={requestDraft.lastName} onChange={(e) => setRequestDraft((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={requestDraft.email} onChange={(e) => setRequestDraft((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={requestDraft.phone} onChange={(e) => setRequestDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Téléphone" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <input value={requestDraft.subject} onChange={(e) => setRequestDraft((p) => ({ ...p, subject: e.target.value }))} placeholder="Sujet de la demande" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        <textarea value={requestDraft.description} onChange={(e) => setRequestDraft((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="Décrivez votre demande..." className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm resize-none" />
        <button type="button" onClick={submitRequest} disabled={requestSending} className="mt-3 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold disabled:opacity-50">
          {requestSending ? "Envoi..." : "Envoyer la demande"}
        </button>
      </section>
    </main>
  );
}
