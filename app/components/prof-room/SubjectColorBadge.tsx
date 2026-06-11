"use client";

import { getSubjectColorPresentation } from "@/app/lib/prof-room-subject-colors";

export default function SubjectColorBadge({
  label,
  colorValue,
  className = "",
}: {
  label: string;
  colorValue: string;
  className?: string;
}) {
  const { className: colorClass, style } = getSubjectColorPresentation(colorValue);
  return (
    <span
      className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${colorClass || ""} ${className}`}
      style={style}
    >
      {label}
    </span>
  );
}
