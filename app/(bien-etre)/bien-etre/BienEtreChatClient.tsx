"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string };

export default function BienEtreChatClient() {
  const { isLoaded, isSignedIn } = useUser();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [welcome, setWelcome] = useState("");
  const [suggestSignalement, setSuggestSignalement] = useState(false);
  const [consentOk, setConsentOk] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [classe, setClasse] = useState("");
  const [complement, setComplement] = useState("");
  const [signaling, setSignaling] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/bien-etre/chat", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setEnabled(data.enabled === true);
    setWelcome(String(data.welcomeMessage || ""));
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setSuggestSignalement(data.suggestSignalement === true);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) loadSession();
  }, [isLoaded, isSignedIn, loadSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !enabled) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setBanner(null);
    try {
      const res = await fetch("/api/bien-etre/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner(data.error || "Erreur");
        return;
      }
      setMessages(data.messages || []);
      setSuggestSignalement(data.suggestSignalement === true);
    } catch {
      setBanner("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const submitSignalement = async () => {
    if (signaling) return;
    setSignaling(true);
    setBanner(null);
    try {
      const res = await fetch("/api/bien-etre/signaler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, classe, complement }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner(data.error || "Erreur");
        return;
      }
      setModalOpen(false);
      setMessages([]);
      setSuggestSignalement(false);
      setPrenom("");
      setClasse("");
      setComplement("");
      setBanner(data.message || "Signalement envoyé.");
    } catch {
      setBanner("Erreur réseau.");
    } finally {
      setSignaling(false);
    }
  };

  if (!isLoaded) {
    return <p className="p-8 text-center text-slate-500">Chargement…</p>;
  }

  if (!isSignedIn) {
    return (
      <main className="max-w-lg mx-auto p-8 text-center">
        <h1 className="text-2xl font-black text-violet-900 mb-4">Espace bien-être</h1>
        <p className="text-slate-600 mb-6">Connecte-toi avec ton compte élève pour accéder au bot d&apos;écoute.</p>
        <Link
          href="/sign-in?redirect_url=%2Fbien-etre"
          className="inline-block rounded-2xl bg-violet-600 text-white font-bold px-6 py-3"
        >
          Se connecter
        </Link>
      </main>
    );
  }

  if (enabled === false) {
    return (
      <main className="max-w-lg mx-auto p-8 text-center">
        <h1 className="text-2xl font-black text-violet-900 mb-4">Espace bien-être</h1>
        <p className="text-slate-600">Le bot n&apos;est pas activé pour le moment. Parle à un adulte de confiance si tu en as besoin.</p>
      </main>
    );
  }

  if (!consentOk) {
    return (
      <main className="max-w-xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-black text-violet-900 mb-4">Espace bien-être</h1>
        <div className="rounded-3xl border border-violet-200 bg-white/90 p-6 shadow-lg space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            <strong>Confidentialité :</strong> cette conversation n&apos;est <strong>pas enregistrée</strong>. Si tu
            quittes ou recharges la page, tout disparaît.
          </p>
          <p>
            <strong>Signalement :</strong> seul un signalement volontaire au psychologue est conservé (avec ton prénom
            que tu choisis de donner). Ce n&apos;est pas un dossier disciplinaire.
          </p>
          <p>
            <strong>Urgence :</strong> en danger immédiat, appelle le <strong>112</strong>. Harcèlement :{" "}
            <strong>3018</strong>. Écoute enfants : <strong>116</strong>.
          </p>
          <button
            type="button"
            onClick={() => setConsentOk(true)}
            className="w-full mt-4 rounded-2xl bg-violet-600 text-white font-black py-3"
          >
            J&apos;ai compris — commencer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen max-w-2xl mx-auto">
      <header className="shrink-0 border-b border-violet-100 bg-white/80 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Bien-être</p>
          <h1 className="font-black text-lg text-slate-900">Bot d&apos;écoute</h1>
        </div>
        <SignOutButton>
          <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-800">
            Déconnexion
          </button>
        </SignOutButton>
      </header>

      <div className="shrink-0 bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs text-amber-900 text-center">
        Conversation non enregistrée — elle disparaît si tu quittes cette page.
      </div>

      {banner ? (
        <div className="shrink-0 bg-violet-100 text-violet-900 text-sm px-4 py-2 text-center">{banner}</div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && welcome ? (
          <div className="rounded-2xl bg-white border border-violet-100 p-4 text-sm text-slate-700 shadow-sm">
            {welcome}
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-slate-200 text-slate-800 shadow-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading ? <p className="text-xs text-slate-400 animate-pulse">Réflexion…</p> : null}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-violet-100 bg-white/90 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 text-xs justify-center">
          <a href="tel:116" className="font-bold text-teal-700 underline">
            116
          </a>
          <span className="text-slate-300">·</span>
          <a href="tel:3018" className="font-bold text-teal-700 underline">
            3018
          </a>
          <span className="text-slate-300">·</span>
          <a href="tel:112" className="font-bold text-red-600 underline">
            112
          </a>
        </div>

        {(suggestSignalement || messages.length >= 2) && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full rounded-xl border-2 border-violet-300 bg-violet-50 text-violet-900 font-bold py-2 text-sm"
          >
            Signaler au psychologue de l&apos;établissement
          </button>
        )}

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Écris ici…"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            disabled={loading}
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-2xl bg-violet-600 text-white font-black px-5 disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-slate-900">Signalement au psychologue</h2>
            <p className="text-sm text-slate-600">
              Seul ce signalement sera conservé. Indique ton prénom pour que le psychologue puisse te retrouver.
            </p>
            <label className="block text-sm font-semibold">
              Prénom <span className="text-red-500">*</span>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-semibold">
              Classe / niveau (optionnel)
              <input
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-semibold">
              Message complémentaire (optionnel)
              <textarea
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitSignalement}
                disabled={signaling || prenom.trim().length < 2}
                className="flex-1 rounded-xl bg-violet-600 text-white font-black py-2 disabled:opacity-40"
              >
                {signaling ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
