"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

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
  const [mounted, setMounted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [messages, setMessages] = useState<BubbleMessage[]>([{ role: "assistant", content: "Bonjour, je suis l'assistant IA. Posez votre question." }]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const hidden = useMemo(() => { return pathname?.startsWith("/sign-in") || pathname?.startsWith("/sso-callback")}, [pathname]);
  if (hidden) return null;
  useEffect(() => {
    setMounted(true);
    const supported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setSpeechSupported(supported);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => { document.removeEventListener("mousedown", onPointerDown)}}, [open]);
  const canUseSpeech = speechSupported;
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
          history: messages.slice(-10),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || data.error || "Je ne peux pas répondre pour le moment." },
      ]);
    } catch {setMessages((prev) => [...prev, { role: "assistant", content: "Erreur réseau, merci de réessayer." }]);
    } finally {setLoading(false);
    }
  };
  return (
    <div className="fixed bottom-4 right-4 z-[120]">
      <div
        ref={panelRef}
        className={`absolute bottom-20 right-0 w-[min(92vw,390px)] h-[570px] rounded-[30px] border border-white/50 bg-white/22 backdrop-blur-3xl shadow-[0_30px_80px_rgba(15,23,42,0.30)] overflow-hidden transition-all duration-200 ${
          open && mounted
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}
      >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[130%] h-44 bg-white/35 blur-2xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.34),transparent_48%),radial-gradient(circle_at_100%_100%,rgba(125,211,252,0.20),transparent_35%)]" />
            <div className="absolute inset-[1px] rounded-[29px] border border-white/35" />
          </div>
          <div className="relative px-4 py-3 bg-gradient-to-r from-slate-950/88 via-slate-900/86 to-slate-950/88 text-white flex items-center justify-between backdrop-blur-xl border-b border-white/20">
            <p className="text-sm font-semibold tracking-wide">Nico l'assistant IA</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs opacity-80 hover:opacity-100 transition-opacity">
              Fermer
            </button>
          </div>
          <div className="relative h-[465px] overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-white/26 via-white/14 to-slate-100/18">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-sky-200/55 text-sky-950 ml-8 border border-sky-200/65 backdrop-blur-md"
                    : "bg-white/55 text-slate-800 mr-8 border border-white/60 backdrop-blur-md"
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
          <div className="relative p-3 border-t border-white/35 bg-white/20 backdrop-blur-xl flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Écrivez votre question..."
              className="flex-1 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
            />
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={!canUseSpeech || loading || listening}
              title={canUseSpeech ? "Dicter une question" : "Dictée vocale non supportée"}
              className="rounded-xl border border-white/60 bg-white/55 px-3 py-2 text-sm font-bold disabled:opacity-40"
            >
              {listening ? "..." : "🎤"}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={loading}
              className="rounded-xl bg-slate-900/92 text-white px-3 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-black transition-colors"
            >
              {loading ? "..." : "Envoyer"}
            </button>
          </div>
      </div>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group relative w-14 h-14 rounded-full border border-white/50 shadow-[0_14px_30px_rgba(15,23,42,0.38)] hover:scale-[1.05] active:scale-[0.98] transition-all overflow-hidden"
        aria-label={open ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"}
      >
        <span className="absolute inset-[2px] rounded-full backdrop-blur-xl bg-black/10" />
        <Image
          src="/Nicolia.jpg"
          alt="Assistant IA"
          fill
          sizes="56px"
          className="object-cover object-top"
          priority
        />
      </button>
    </div>
  );
}
