import { Montserrat } from "next/font/google";
import { MARKETING } from "@/app/lib/marketing-site";

/**
 * Montserrat ≈ esprit Gotham (géométrique, contemporain) — libre via Google Fonts.
 * Gotham (Hoefler) est propriétaire ; on ne peut pas l’embarquer sans licence.
 */
const brandFont = Montserrat({
  weight: ["500", "600", "700", "800"],
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
 * Marque ScolIA : même famille moderne, contraste poids / couleur / tracking
 * pour éviter la confusion entre le L de « Scol » et le I de « IA ».
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
  const scol = invert ? "text-white/95" : "text-[#14231A]";
  const ia = invert
    ? "text-[#4ADE80]"
    : "bg-gradient-to-r from-[#2F6B4A] via-[#3D8A5C] to-[#F59E0B] bg-clip-text text-transparent";

  return (
    <span
      className={`${brandFont.className} inline-flex items-baseline ${SIZE[size]} ${className}`}
      aria-label={MARKETING.productName}
    >
      <span className={`font-semibold tracking-[-0.02em] ${scol}`}>Scol</span>
      <span
        className={`ml-[0.18em] font-extrabold tracking-[0.18em] ${ia}`}
        title="Intelligence artificielle"
      >
        IA
      </span>
    </span>
  );
}

/** Sous-titre « School · IA » — même famille. */
export function BrandOrigin({ className = "" }: { className?: string }) {
  return (
    <span className={`${brandFont.className} inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="font-semibold tracking-tight text-[#14231A]/85">School</span>
      <span className="font-light text-stone-400" aria-hidden>
        ·
      </span>
      <span className="bg-gradient-to-r from-[#2F6B4A] to-[#F59E0B] bg-clip-text font-extrabold tracking-[0.16em] text-transparent">
        IA
      </span>
    </span>
  );
}
