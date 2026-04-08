"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type BubbleMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatbotBubble() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BubbleMessage[]>([{ role: "assistant", content: "Bonjour, je suis l'assistant IA. Posez votre question." }]);
  const hidden = useMemo(() => { return pathname?.startsWith("/sign-in") || pathname?.startsWith("/sso-callback")}, [pathname]);
  if (hidden) return null;
  const canUseSpeech = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startVoiceInput = () => {
    if (!canUseSpeech || listening || loading) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionCtor as any)();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };
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
        body: JSON.stringify({
          message,
          audience: isSignedIn ? "private" : "public",
        }),
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
    <div className="fixed bottom-4 right-4 z-[120]">
      {open ? (
        <div className="w-[min(92vw,360px)] h-[520px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <p className="text-sm font-bold">Assistant IA</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs opacity-80 hover:opacity-100">
              Fermer
            </button>
          </div>
          <div className="h-[420px] overflow-y-auto p-3 space-y-2 bg-slate-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-sky-100 ml-8" : "bg-white mr-8 border border-slate-200"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading ? (
              <div className="rounded-xl px-3 py-2 text-sm bg-white mr-8 border border-slate-200">
                <div className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            ) : null}
          </div>
          <div className="p-3 border-t border-slate-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Écrivez votre question..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={!canUseSpeech || loading || listening}
              title={canUseSpeech ? "Dicter une question" : "Dictée vocale non supportée"}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40"
            >
              {listening ? "..." : "🎤"}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={loading}
              className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-bold disabled:opacity-50"
            >
              {loading ? "..." : "Envoyer"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="max-w-[260px] rounded-2xl bg-white border border-slate-200 shadow-lg px-3 py-2 text-xs text-slate-700"
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              </span>
              Besoin d'aide ? Je peux vous répondre.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-slate-900 text-white shadow-xl px-4 py-3 text-sm font-bold hover:bg-black transition-colors"
          >
            Chat IA
          </button>
        </div>
      )}
    </div>
  );
}
