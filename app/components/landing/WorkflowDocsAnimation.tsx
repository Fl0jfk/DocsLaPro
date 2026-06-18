"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  WORKFLOW_ANIMATION_BODY,
  WORKFLOW_ANIMATION_INNER,
  WORKFLOW_ANIMATION_SHELL,
} from "@/app/lib/marketing-theme";

const PHASES = ["drop", "scan", "sort", "done"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_MS = 2200;

const FOLDERS = [
  { name: "Dupont Marie — 6A" },
  { name: "Martin Lucas — 5B" },
  { name: "Bernard Léa — 4C" },
];

export default function WorkflowDocsAnimation() {
  const [phase, setPhase] = useState<Phase>("drop");
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
      className={`${WORKFLOW_ANIMATION_SHELL} border border-emerald-400/30 bg-gradient-to-br from-[#1E4A32] via-[#2F6B4A] to-[#1A3D2B] shadow-emerald-900/30`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#4ADE80]/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-[#F59E0B]/15 blur-2xl" />

      <div className={`${WORKFLOW_ANIMATION_INNER} bg-[#0F2318]/40`}>
        <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-white/10 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs font-semibold text-emerald-100/80">
            Workflow documents élèves
          </span>
          <motion.span
            key={tick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto rounded-full bg-[#F59E0B]/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200"
          >
            IA Mistral
          </motion.span>
        </div>

        <div className={`${WORKFLOW_ANIMATION_BODY} grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch`}>
          <div className="relative flex h-full min-h-[10.5rem] flex-col rounded-2xl border-2 border-dashed border-emerald-400/40 bg-white/5 p-3 sm:min-h-0">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-200/70">
              1 · Dépôt
            </p>
            <div className="relative mt-2 min-h-0 flex-1">
              <AnimatePresence mode="wait">
                {phase === "drop" || phase === "scan" ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5"
                  >
                    <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/90 text-[10px] font-black text-white">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">bulletins_6A.pdf</p>
                      <p className="text-[11px] text-emerald-200/60">24 pages · 3 élèves détectés</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4 text-center text-xs text-emerald-200/50"
                  >
                    Fichier traité ✓
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-auto shrink-0 space-y-2 pt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                {phase === "scan" ? (
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#4ADE80] to-[#F59E0B]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.8, ease: "easeInOut" }}
                  />
                ) : null}
              </div>
              <div className="flex h-6 flex-wrap gap-1.5 overflow-hidden">
                {phase === "scan"
                  ? ["OCR", "Segmentation", "Matching élève"].map((label, i) => (
                      <motion.span
                        key={label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.25 }}
                        className="rounded-md bg-[#4ADE80]/20 px-2 py-0.5 text-[10px] font-bold text-emerald-100"
                      >
                        {label}
                      </motion.span>
                    ))
                  : null}
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 flex-col items-center justify-center sm:flex">
            <motion.span
              animate={{
                x: phase === "sort" || phase === "done" ? [0, 4, 0] : 0,
                opacity: phase === "drop" ? 0.3 : 1,
              }}
              transition={{ repeat: phase === "sort" ? Infinity : 0, duration: 0.8 }}
              className="text-2xl text-[#4ADE80]"
            >
              →
            </motion.span>
          </div>

          <div className="flex h-full min-h-[10.5rem] flex-col rounded-2xl border border-white/10 bg-white/5 p-3 sm:min-h-0">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-200/70">
              2 · Classement auto
            </p>
            <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-hidden">
              {FOLDERS.map((folder, i) => {
                const active = phase === "sort" || phase === "done";
                const done = phase === "done";
                return (
                  <li
                    key={folder.name}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all duration-300 ${
                      done && i === 0
                        ? "bg-[#4ADE80]/15 ring-1 ring-[#4ADE80]/40"
                        : active
                          ? "bg-white/10 opacity-100"
                          : "bg-white/5 opacity-35"
                    }`}
                  >
                    <span className="text-base">📁</span>
                    <span className="flex-1 truncate text-xs font-semibold text-white">
                      {folder.name}
                    </span>
                    {done && i === 0 ? (
                      <span className="text-sm text-[#4ADE80]">✓</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <p
              className={`mt-2 shrink-0 text-center text-xs font-black transition-opacity duration-300 ${
                phase === "done" ? "text-[#4ADE80] opacity-100" : "text-transparent opacity-0"
              }`}
            >
              Renommé & rangé dans OneDrive
            </p>
          </div>
        </div>

        <div className="mt-3 flex shrink-0 justify-center gap-1.5">
          {PHASES.map((p) => (
            <span
              key={p}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                phase === p ? "w-6 bg-[#4ADE80]" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
