"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  WORKFLOW_ANIMATION_BODY,
  WORKFLOW_ANIMATION_INNER,
  WORKFLOW_ANIMATION_SHELL,
} from "@/app/lib/marketing-theme";

const PHASES = ["declarer", "calendrier", "valider", "ok"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_MS = 2200;

export default function WorkflowAbsencesAnimation() {
  const [phase, setPhase] = useState<Phase>("declarer");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => PHASES[(PHASES.indexOf(p) + 1) % PHASES.length]);
      setTick((t) => t + 1);
    }, PHASE_MS);
    return () => clearInterval(id);
  }, []);

  const onCalendar = phase !== "declarer";
  const pending = phase === "valider";
  const validated = phase === "ok";

  return (
    <div
      className={`${WORKFLOW_ANIMATION_SHELL} border border-rose-400/20 bg-gradient-to-br from-[#5C2D3A] via-[#6B3A4A] to-[#452530] shadow-rose-900/20`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rose-400/15 blur-2xl" />
      <div className={`${WORKFLOW_ANIMATION_INNER} bg-[#2A1520]/50`}>
        <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-white/10 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="ml-2 text-xs font-semibold text-rose-100/80">Absences</span>
          <motion.span
            key={tick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto rounded-full bg-rose-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-200"
          >
            Mobile OK
          </motion.span>
        </div>

        <div className={`${WORKFLOW_ANIMATION_BODY} grid gap-3 sm:grid-cols-2`}>
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-rose-200/60">
              Se déclarer
            </p>
            <div className="relative mt-2 min-h-0 flex-1">
              <AnimatePresence mode="wait">
                {phase === "declarer" ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div className="rounded-lg bg-white/10 px-2.5 py-2">
                      <p className="text-[10px] text-rose-200/50">Période</p>
                      <p className="text-xs font-bold text-white">Mardi 14 · 8h30 → 12h30</p>
                    </div>
                    <div className="rounded-lg bg-white/10 px-2.5 py-2">
                      <p className="text-[10px] text-rose-200/50">Motif</p>
                      <p className="text-xs text-white/90">Rendez-vous médical</p>
                    </div>
                    <div className="rounded-lg bg-rose-500/30 py-2 text-center text-[11px] font-black text-white">
                      Envoyer la déclaration
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="sent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6 text-center text-xs font-bold text-[#4ADE80]"
                  >
                    ✓ Déclaration envoyée
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-rose-200/60">
              {pending ? "À traiter" : validated ? "Validée" : "Calendrier"}
            </p>
            <div className="mt-2 grid shrink-0 grid-cols-5 gap-1">
              {["L", "M", "M", "J", "V"].map((d, i) => (
                <div key={`${d}-${i}`} className="text-center text-[9px] font-bold text-white/30">
                  {d}
                </div>
              ))}
              {Array.from({ length: 10 }).map((_, i) => {
                const isEvent = i === 6 && onCalendar;
                const color = validated
                  ? "bg-[#4ADE80]/70"
                  : pending
                    ? "bg-amber-400/70"
                    : "bg-rose-400/70";
                return (
                  <div
                    key={i}
                    className={`h-6 rounded-md ${i >= 5 ? "" : "opacity-0"}`}
                  >
                    {isEvent ? (
                      <div className={`h-full w-full rounded-md transition-colors duration-300 ${color}`} />
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-auto min-h-[2.75rem] pt-2">
              {pending ? (
                <div className="flex items-center justify-between rounded-lg bg-amber-500/20 px-2.5 py-2">
                  <span className="text-[11px] font-semibold text-amber-100">
                    Direction — 1 à valider
                  </span>
                  <span className="rounded bg-amber-400/30 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
                    À traiter
                  </span>
                </div>
              ) : null}
              <p
                className={`text-center text-xs font-black transition-opacity duration-300 ${
                  validated ? "mt-2 text-[#4ADE80] opacity-100" : "text-transparent opacity-0"
                }`}
              >
                Validée par la direction ✓
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex shrink-0 justify-center gap-1.5">
          {PHASES.map((p) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                phase === p ? "w-6 bg-rose-400" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
