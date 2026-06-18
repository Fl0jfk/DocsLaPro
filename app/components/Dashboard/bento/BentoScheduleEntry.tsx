"use client";

import type { CSSProperties } from "react";
import {
  appearanceForTeacherIndex,
  buildTeacherColorIndexMap,
  teacherColorKey,
} from "@/app/lib/absences-calendar";
import { getSubjectColorPresentation } from "@/app/lib/prof-room-subject-colors";

export type ScheduleEntryPresentation = {
  className?: string;
  style?: CSSProperties;
};

/** Carte compacte pour un créneau / une ligne d’emploi du temps (widgets bento). */
export function BentoScheduleEntry({
  time,
  primary,
  secondary,
  title,
  presentation,
}: {
  time?: string;
  primary: string;
  secondary?: string;
  title?: string;
  presentation?: ScheduleEntryPresentation;
}) {
  const tinted = Boolean(presentation?.className || presentation?.style);

  return (
    <div
      className={`rounded-md border px-1.5 py-1 shadow-[0_1px_0_rgba(0,0,0,0.04)] ${
        presentation?.className ||
        "border-[color:var(--dash-border)]/70 border-l-[3px] border-l-stone-300 bg-white/90"
      }`}
      style={presentation?.style}
      title={title}
    >
      {time ? (
        <p
          className={`text-[9px] font-black tabular-nums leading-none ${
            tinted ? "opacity-90" : "text-[var(--dash-primary)]"
          }`}
        >
          {time}
        </p>
      ) : null}
      <p
        className={`mt-0.5 truncate text-[9px] font-bold leading-tight sm:text-[8px] ${
          tinted ? "" : "text-[#14231A]"
        }`}
      >
        {primary}
      </p>
      {secondary ? (
        <p
          className={`truncate text-[8px] font-medium leading-tight ${
            tinted ? "opacity-85" : "text-stone-500"
          }`}
        >
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

export function formatDashboardSlotTime(iso: string): string {
  const part = iso.split("T")[1];
  if (!part) return "";
  return part.slice(0, 5).replace(":", "h");
}

export function subjectSchedulePresentation(colorValue?: string): ScheduleEntryPresentation | undefined {
  if (!colorValue) return undefined;
  return getSubjectColorPresentation(colorValue);
}

export function teacherSchedulePresentation(
  teacherName: string,
  colorIndexMap: Map<string, number>,
): ScheduleEntryPresentation {
  const key = teacherColorKey(teacherName);
  const index = key ? (colorIndexMap.get(key) ?? 0) : 0;
  const { cardStyle } = appearanceForTeacherIndex(index);
  return {
    style: {
      ...cardStyle,
      borderLeftWidth: 3,
      borderLeftColor: cardStyle.borderColor,
    },
  };
}

export function buildAbsenceTeacherColorMap(names: string[]): Map<string, number> {
  return buildTeacherColorIndexMap(names);
}
