import { Libre_Baskerville, Outfit } from "next/font/google";
import { MARKETING } from "@/app/lib/marketing-site";

/** « Scol » — serif : le L se distingue d’un I sans-serif. */
const scolFont = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

/** « IA » — sans moderne, plus grasse. */
const iaFont = Outfit({
  weight: ["700", "800"],
  subsets: ["latin"],
  display: "swap",
});

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl md:text-3xl",
  xl: "text-4xl sm:text-5xl",
};

/**
 * Marque ScolIA : deux mots distincts (serif / sans, graisse, taille, espace).
 */
export default function BrandMark({
  size = "md",
  className = "",
  invert = false,
}: {
  size?: Size;
  className?: string;
  invert?: boolean;
}) {
  const scol = invert ? "text-white/95" : "text-[#1A2E22]";
  const ia = invert
    ? "text-[#4ADE80]"
    : "bg-gradient-to-r from-[#2F6B4A] to-[#E8A317] bg-clip-text text-transparent";

  return (
    <span
      className={`inline-flex items-baseline ${SIZE[size]} ${className}`}
      aria-label={MARKETING.productName}
    >
      <span className={`${scolFont.className} font-normal tracking-tight ${scol}`}>Scol</span>
      <span
        className={`${iaFont.className} ml-[0.32em] text-[0.76em] font-extrabold uppercase tracking-[0.22em] ${ia}`}
        title="Intelligence artificielle"
      >
        IA
      </span>
    </span>
  );
}

/** Sous-titre « School · IA ». */
export function BrandOrigin({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={`${scolFont.className} text-xs font-normal text-[#1A2E22]/85`}>
        School
      </span>
      <span className="text-[10px] font-light text-stone-400" aria-hidden>
        ·
      </span>
      <span
        className={`${iaFont.className} bg-gradient-to-r from-[#2F6B4A] to-[#E8A317] bg-clip-text text-[10px] font-extrabold uppercase tracking-[0.22em] text-transparent`}
      >
        IA
      </span>
    </span>
  );
}
