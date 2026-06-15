"use client";

export function BoardDropZone({
  label,
  hint,
  active,
  tone,
  dropPile,
  className = "",
}: {
  label: string;
  hint?: string;
  active?: boolean;
  tone: "rose" | "red" | "sky";
  dropPile: string;
  className?: string;
}) {
  const tones = {
    rose: "border-rose-300 bg-gradient-to-br from-rose-50 to-pink-50/60 text-rose-900",
    red: "border-red-300 bg-gradient-to-br from-red-50 to-rose-50/60 text-red-900",
    sky: "border-indigo-300 bg-gradient-to-br from-indigo-50 to-sky-50/60 text-indigo-900",
  };
  return (
    <div
      data-drop-pile={dropPile}
      className={`rounded-xl border-2 border-dashed px-4 py-3 text-center transition-all ${tones[tone]} ${
        active ? "ring-2 ring-sky-400 scale-[1.01] shadow-md" : ""
      } ${className}`}
    >
      <p className="text-xs font-black">{label}</p>
      {hint ? <p className="text-[10px] opacity-80 mt-0.5">{hint}</p> : null}
    </div>
  );
}
