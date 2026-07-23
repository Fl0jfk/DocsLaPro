import { MARKETING } from "@/app/lib/marketing-site";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl md:text-3xl",
  xl: "text-4xl sm:text-5xl",
};

/**
 * Marque ScolIA : « Scol » (école) + « IA » mis en évidence.
 * Accessible : le nom complet reste lisible (aria / texte).
 */
export default function BrandMark({
  size = "md",
  className = "",
  invert = false,
}: {
  size?: Size;
  className?: string;
  /** Sur fond sombre (footer CTA, etc.) */
  invert?: boolean;
}) {
  const scol = invert ? "text-white" : "text-[#14231A]";
  const ia = invert
    ? "font-black text-[#4ADE80]"
    : "bg-gradient-to-r from-[#3D8A5C] to-[#F59E0B] bg-clip-text font-black text-transparent";

  return (
    <span
      className={`inline-flex items-baseline tracking-tight ${SIZE[size]} ${className}`}
      aria-label={MARKETING.productName}
    >
      <span className={`font-semibold ${scol}`}>Scol</span>
      <span className={ia}>IA</span>
    </span>
  );
}

/** Sous-titre « School · IA » avec le même contraste. */
export function BrandOrigin({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="font-semibold text-[#14231A]/80">School</span>
      <span className="font-light text-stone-400" aria-hidden>
        ·
      </span>
      <span className="bg-gradient-to-r from-[#3D8A5C] to-[#F59E0B] bg-clip-text font-black tracking-wide text-transparent">
        IA
      </span>
    </span>
  );
}
