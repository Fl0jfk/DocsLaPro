import type { ProfRoomModuleConfig } from "@/app/lib/app-config-schemas";

/** Liste complète des matières (couleurs Tailwind du planning). */
export const DEFAULT_PROF_ROOM_SUBJECT_COLORS: Record<string, string> = {
  FRANCAIS: "bg-blue-600 text-white",
  MATHS: "bg-red-600 text-white",
  "HISTOIRE-GEO": "bg-amber-700 text-white",
  ANGLAIS: "bg-pink-600 text-white",
  ESPAGNOL: "bg-rose-500 text-white",
  ALLEMAND: "bg-stone-600 text-white",
  SVT: "bg-emerald-600 text-white",
  "PHYSIQUE-CHIMIE": "bg-yellow-500 text-white",
  TECHNOLOGIE: "bg-orange-600 text-white",
  "ARTS PLASTIQUES": "bg-fuchsia-600 text-white",
  MUSIQUE: "bg-violet-600 text-white",
  "LATIN-GREC": "bg-slate-400 text-white",
  SNT: "bg-indigo-600 text-white",
  "SCIENCES INGENIEUR": "bg-cyan-600 text-white",
  "SCIENCES LABO": "bg-teal-600 text-white",
  ST2S: "bg-lime-600 text-white",
  MAINTENANCE: "bg-zinc-500 text-white",
};

/** Complète les matières enregistrées avec celles par défaut (sans écraser les couleurs personnalisées). */
export function withDefaultProfRoomSubjects(config: ProfRoomModuleConfig): ProfRoomModuleConfig {
  return {
    ...config,
    subjectColors: { ...DEFAULT_PROF_ROOM_SUBJECT_COLORS, ...config.subjectColors },
  };
}
