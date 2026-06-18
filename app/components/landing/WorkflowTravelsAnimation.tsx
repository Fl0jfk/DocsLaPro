"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  WORKFLOW_ANIMATION_BODY,
  WORKFLOW_ANIMATION_INNER,
  WORKFLOW_ANIMATION_SHELL,
} from "@/app/lib/marketing-theme";

const PHASES = ["dossier", "envoi", "devis", "valide"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_MS = 2400;

const STEPS = [
  { label: "Pédagogie", key: "peda" },
  { label: "Finances", key: "compta" },
  { label: "Direction", key: "dir" },
  { label: "Validé", key: "ok" },
];

function stepDone(phase: Phase, index: number): boolean {
  if (phase === "dossier") return false;
  if (phase === "envoi") return index === 0;
  if (phase === "devis") return index <= 1;
  return true;
}

function stepActive(phase: Phase, index: number): boolean {
  if (phase === "dossier") return index === 0;
  if (phase === "envoi") return index === 1;
  if (phase === "devis") return index === 2;
  return index === 3;
}

export default function WorkflowTravelsAnimation() {
  const [phase, setPhase] = useState<Phase>("dossier");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => PHASES[(PHASES.indexOf(p) + 1) % PHASES.length]);
      setTick((t) => t + 1);
    }, PHASE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`${WORKFLOW_ANIMATION_SHELL} border border-indigo-400/25 bg-gradient-to-br from-[#1E3A5F] via-[#234B73] to-[#1A3348] shadow-indigo-900/25`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl" />
      <div className={`${WORKFLOW_ANIMATION_INNER} bg-[#0C1A28]/50`}>
        <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-white/10 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400/80" />
          <span className="ml-2 text-xs font-semibold text-sky-100/80">Sorties scolaires</span>
          <motion.span
            key={tick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto rounded-full bg-sky-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-200"
          >
            E-mails auto
          </motion.span>
        </div>

        <div className="mb-3 flex shrink-0 items-center gap-0">
          {STEPS.map((step, i) => {
            const done = stepDone(phase, i);
            const active = stepActive(phase, i);
            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black text-white transition-colors duration-300 ${
                      done
                        ? "bg-[#4ADE80]/90"
                        : active
                          ? "bg-sky-400/90 ring-2 ring-sky-300/50"
                          : "bg-white/12"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide ${
                      active ? "text-sky-200" : done ? "text-emerald-200/90" : "text-white/35"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 ? (
                  <div
                    className={`mx-1 mb-4 h-0.5 flex-1 rounded transition-colors duration-500 ${
                      stepDone(phase, i) ? "bg-emerald-400/70" : "bg-white/10"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className={`${WORKFLOW_ANIMATION_BODY} grid gap-3 sm:grid-cols-2`}>
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-sky-200/60">
              Dossier sortie
            </p>
            <div className="mt-2 flex shrink-0 items-start gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-lg">
                🚌
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">Musée des Confluences — 6A</p>
                <p className="text-[11px] text-sky-100/55">45 élèves · 12 mars · Bus requis</p>
              </div>
            </div>
            <div className="relative mt-2 min-h-[4.5rem] flex-1">
              <AnimatePresence mode="wait">
                {phase === "envoi" ? (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-lg bg-sky-500/20 px-2.5 py-2"
                  >
                    <span className="text-base">✉️</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-sky-100">Devis envoyé au transporteur</p>
                      <p className="truncate text-[10px] text-sky-200/50">bus-dupont@transport.fr</p>
                    </div>
                  </motion.div>
                ) : phase === "devis" || phase === "valide" ? (
                  <motion.div
                    key="inbox"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
                      <span className="rounded bg-red-500/90 px-1 py-0.5 text-[8px] font-black text-white">
                        PDF
                      </span>
                      <span className="truncate text-[11px] font-semibold text-white">
                        devis_bus_dupont.pdf
                      </span>
                    </div>
                    <p
                      className={`text-[10px] font-bold text-amber-200 transition-opacity ${
                        phase === "devis" ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      IA OCR → 1 250,00 € TTC · Dupont Voyages
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="draft"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] text-sky-100/45"
                  >
                    Circuit de validation lancé…
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-sky-200/60">
              Automatisations
            </p>
            <ul className="mt-2 min-h-0 flex-1 space-y-1.5">
              {[
                { label: "Demande devis transport", icon: "✉️", at: "envoi" },
                { label: "Lecture devis (IA)", icon: "✨", at: "devis" },
                { label: "Commande cuisine", icon: "🍽️", at: "valide" },
              ].map((item) => {
                const lit = PHASES.indexOf(phase) >= PHASES.indexOf(item.at as Phase);
                return (
                  <li
                    key={item.label}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-300 ${
                      lit ? "bg-emerald-500/15 ring-1 ring-emerald-400/30" : "bg-white/5 opacity-35"
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="flex-1 text-[11px] font-semibold text-white">{item.label}</span>
                    {lit ? <span className="text-[10px] font-black text-[#4ADE80]">✓</span> : null}
                  </li>
                );
              })}
            </ul>
            <p
              className={`mt-2 shrink-0 text-center text-xs font-black transition-opacity duration-300 ${
                phase === "valide" ? "text-[#4ADE80] opacity-100" : "text-transparent opacity-0"
              }`}
            >
              Sortie finalisée — dossier complet
            </p>
          </div>
        </div>

        <div className="mt-3 flex shrink-0 justify-center gap-1.5">
          {PHASES.map((p) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                phase === p ? "w-6 bg-sky-400" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
