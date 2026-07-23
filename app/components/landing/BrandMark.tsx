import { MARKETING } from "@/app/lib/marketing-site";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl md:text-3xl",
  xl: "text-4xl sm:text-5xl",
};

/**
 * Marque ScolIA — même famille que le site marketing.
 * Séparation Scol / IA par graisse, couleur, tracking et un léger espace.
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
  const scol = invert ? "text-white" : "text-[#14231A]";
  const ia = invert
    ? "text-[#4ADE80]"
    : "text-[#2F6B4A]";

  return (
    <span
      className={`inline-flex items-baseline tracking-tight ${SIZE[size]} ${className}`}
      aria-label={MARKETING.productName}
    >
      <span className={`font-semibold ${scol}`}>Scol</span>
      <span className={`ml-[0.2em] font-black tracking-wide ${ia}`}>IA</span>
    </span>
  );
}
