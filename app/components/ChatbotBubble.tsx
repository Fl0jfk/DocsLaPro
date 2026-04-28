"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

type BubbleMessage = {
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

const DRAFT_PATH_PREFIXES = [
  "/affiche",
  "/annexeautorisationsoinsnuit",
  "/autorisationpsychologue",
  "/autorisationsortie",
  "/cardjapon",
  "/cardjapon2",
  "/cartereseau",
  "/conventionscolarisation",
  "/conventionstagelycee",
  "/depliantrecto",
  "/depliantrectohealth",
  "/depliantverso",
  "/depliantversohealth",
  "/devistransport",
  "/ficheinscription",
  "/fichesanitaire",
  "/formulaire",
  "/grilletarifaire",
  "/navetterotomagus",
  "/partnertennis",
  "/partnerkaratedoa3",
  "/portesouvertes",
  "/preparationrentreeprofs",
  "/qrpo",
  "/recapitulatifscolarite",
  "/reglementfinancier",
];

export default function ChatbotBubble() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSending, setRequestSending] = useState(false);
  const [requestFiles, setRequestFiles] = useState<File[]>([]);
  const [requestDraft, setRequestDraft] = useState<RequestDraft>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    description: "",
  });
  const [messages, setMessages] = useState<BubbleMessage[]>([{ role: "assistant", content: "Bonjour, je suis l'assistant IA. Posez votre question." }]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const scrollYRef = useRef(0);
  const hidden = useMemo(() => {
    const normalized = (pathname ?? "").toLowerCase();
    if (normalized.startsWith("/sign-in") || normalized.startsWith("/sso-callback")) return true;
    return DRAFT_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  }, [pathname]);
  useEffect(() => {
    setMounted(true);
    const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setSpeechSupported(supported);
  }, []);
  useEffect(() => {
    if (!user) return;
    setRequestDraft((prev) => ({
      ...prev,
      firstName: prev.firstName || user.firstName || "",
      lastName: prev.lastName || user.lastName || "",
      email: prev.email || user.primaryEmailAddress?.emailAddress || "",
    }));
  }, [user]);
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    scrollYRef.current = window.scrollY;
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    html.style.overscrollBehavior = "none";
    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);
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
      setMessages((prev) => [ ...prev, { role: "assistant", content: data.answer || data.error || "Je ne peux pas répondre pour le moment." }]);
    } catch {setMessages((prev) => [...prev, { role: "assistant", content: "Erreur réseau, merci de réessayer." }]);
    } finally {setLoading(false);
    }
  };
  const submitRequest = async () => {
    if (requestSending) return;
    setRequestSending(true);
    try {
      const fd = new FormData();
      fd.append("firstName", requestDraft.firstName);
      fd.append("lastName", requestDraft.lastName);
      fd.append("email", requestDraft.email);
      fd.append("phone", requestDraft.phone);
      fd.append("subject", requestDraft.subject);
      fd.append("description", requestDraft.description);
      requestFiles.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/requests/create", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Impossible de créer la demande pour le moment." }]);
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
                : "Un e-mail de confirmation vous a été envoyé. Ouvrez-le et cliquez sur le lien pour valider votre demande (sans ce clic, rien n’est transmis à l’équipe). Pensez à vérifier les courriers indésirables.",
          },
        ]);
        setShowRequestForm(false);
        setRequestFiles([]);
        setRequestDraft((prev) => ({ ...prev, subject: "", description: "" }));
        return;
      }
      const pj =
        typeof data.attachmentCount === "number" && data.attachmentCount > 0
          ? ` ${data.attachmentCount} pièce(s) jointe(s) incluse(s).`
          : "";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Demande créée (${data.id}). Service destinataire: ${data?.assignedTo?.roleLabel || "à confirmer"}.${pj} Vous recevrez un email de suivi.`,
        },
      ]);
      setShowRequestForm(false);
      setRequestFiles([]);
      setRequestDraft((prev) => ({ ...prev, subject: "", description: "" }));
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur réseau lors de la création de la demande." }]);
    } finally {
      setRequestSending(false);
    }
  };
  if (hidden) return null;
  return (
    <div className="fixed inset-0 z-[120] pointer-events-none">
      {open ? (
        <div className="absolute inset-0 bg-slate-900/20 pointer-events-auto md:hidden" onClick={() => setOpen(false)} aria-hidden="true"/>
      ) : null}
      <div
        ref={panelRef}
        className={`absolute inset-0 h-[100dvh] rounded-none border-0 md:inset-auto md:right-4 md:bottom-20 md:w-[min(92vw,390px)] md:h-[570px] md:rounded-[30px] md:border md:border-white/50 bg-white/22 backdrop-blur-3xl md:shadow-[0_30px_80px_rgba(15,23,42,0.30)] overflow-hidden transition-all duration-200 pointer-events-auto ${
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
          <div className="relative h-full flex flex-col">
            <div className="px-4 py-3 pt-[max(12px,env(safe-area-inset-top))] bg-gradient-to-r from-slate-950/88 via-slate-900/86 to-slate-950/88 text-white flex items-center justify-between backdrop-blur-xl border-b border-white/20">
              <p className="text-sm font-semibold tracking-wide">Nico l'assistant IA</p>
              <button type="button" onClick={() => setOpen(false)} className="text-xs opacity-80 hover:opacity-100 transition-opacity">
                Fermer
              </button>
            </div>
            <div ref={messagesRef} className="relative flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-white/26 via-white/14 to-slate-100/18">
              <div className="rounded-xl border border-sky-200/60 bg-white/60 p-2.5">
                <p className="text-[11px] font-semibold text-slate-800">Faire une demande (tâche)</p>
                <ol className="text-[10px] text-slate-600 mt-1.5 space-y-0.5 list-decimal list-inside">
                  <li>Touchez « Créer une demande » ci-dessous.</li>
                  <li>Remplissez identité, sujet et description.</li>
                  <li>Joignez des fichiers si besoin (plusieurs : images, PDF, Word, Excel).</li>
                  <li>Envoyez — vous recevrez un email de suivi.</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setShowRequestForm((v) => !v)}
                  className="mt-2 text-xs rounded-lg bg-sky-700 text-white px-2.5 py-1.5 font-semibold hover:bg-sky-800"
                >
                  {showRequestForm ? "Masquer le formulaire" : "Créer une demande"}
                </button>
              </div>
              {showRequestForm ? (
                <div className="rounded-xl border border-slate-200 bg-white/75 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={requestDraft.firstName} onChange={(e) => setRequestDraft((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                    <input value={requestDraft.lastName} onChange={(e) => setRequestDraft((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={requestDraft.email} onChange={(e) => setRequestDraft((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                    <input value={requestDraft.phone} onChange={(e) => setRequestDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Téléphone" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                  </div>
                  <input value={requestDraft.subject} onChange={(e) => setRequestDraft((p) => ({ ...p, subject: e.target.value }))} placeholder="Sujet" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                  <textarea value={requestDraft.description} onChange={(e) => setRequestDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Décrivez précisément votre demande..." rows={3} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs resize-none" />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Pièces jointes (facultatif, plusieurs possibles)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                      className="w-full text-[10px] text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-2 file:py-1"
                      onChange={(e) => {
                        const list = e.target.files ? Array.from(e.target.files) : [];
                        setRequestFiles((prev) => [...prev, ...list].slice(0, 12));
                        e.target.value = "";
                      }}
                    />
                    {requestFiles.length > 0 ? (
                      <ul className="mt-1.5 space-y-1">
                        {requestFiles.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-[10px] text-slate-700 bg-slate-100/80 rounded px-2 py-1">
                            <span className="truncate">{f.name}</span>
                            <button
                              type="button"
                              className="shrink-0 text-red-700 font-bold"
                              onClick={() => setRequestFiles((prev) => prev.filter((_, j) => j !== i))}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <button type="button" onClick={submitRequest} disabled={requestSending} className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-bold disabled:opacity-50">
                    {requestSending ? "Envoi..." : "Envoyer la demande"}
                  </button>
                </div>
              ) : null}
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
            <div className="p-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t border-white/35 bg-white/20 backdrop-blur-xl flex gap-2">
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
      </div>
      {!open ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto fixed bottom-4 right-4 group w-14 h-14 rounded-full border border-white/50 shadow-[0_14px_30px_rgba(15,23,42,0.38)] hover:scale-[1.05] active:scale-[0.98] transition-all overflow-hidden"
          aria-label="Ouvrir l'assistant IA"
        >
          <span className="absolute inset-[2px] rounded-full backdrop-blur-xl bg-black/10" />
          <Image src="/Nicolia.jpg" alt="Assistant IA" fill sizes="56px" className="object-cover object-top" priority/>
        </button>
      ) : null}
    </div>
  );
}
