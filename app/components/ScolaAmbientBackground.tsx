import type { ReactNode } from "react";
import { SCOLA } from "@/app/lib/marketing-theme";

export default function ScolaAmbientBackground({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-stone-800 antialiased selection:bg-emerald-200/80 selection:text-[#14231A]"
      style={{ backgroundColor: SCOLA.cream }}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-[10%] -top-[15%] h-[55vh] w-[55vh] animate-pulse rounded-full opacity-60 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${SCOLA.greenBright}55, transparent 70%)` }}
        />
        <div
          className="absolute -right-[5%] top-[20%] h-[45vh] w-[45vh] rounded-full opacity-50 blur-[90px]"
          style={{ background: `radial-gradient(circle, ${SCOLA.greenMid}66, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[40vh] w-[50vh] rounded-full opacity-40 blur-[80px]"
          style={{ background: `radial-gradient(circle, ${SCOLA.amber}44, transparent 70%)` }}
        />
      </div>
      {children}
    </div>
  );
}
