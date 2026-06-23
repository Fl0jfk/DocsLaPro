"use client";

import type { CSSProperties, ReactNode } from "react";

export const DASHBOARD_ABSENCES_MAX_SLOTS = 10;

type SlotSize = "compact" | "card";

/** Hauteur max. CSS pour N lignes visibles (le reste défile). */
export function dashboardScrollMaxHeightValue(
  slots: number,
  size: SlotSize = "card",
): string {
  if (size === "compact") {
    return `calc(${slots} * 1.35rem + ${Math.max(0, slots - 1)} * 0.125rem)`;
  }
  return `calc(${slots} * 2.75rem + ${Math.max(0, slots - 1)} * 0.375rem)`;
}

export function dashboardScrollListStyle(
  slots: number,
  size: SlotSize = "card",
): CSSProperties {
  return { maxHeight: dashboardScrollMaxHeightValue(slots, size) };
}

export function absencesTodayCountLabel(count: number): string {
  const word = count > 1 ? "absents" : "absent";
  return `${count} ${word}\u00a0aujourd\u2019hui`;
}

export function DashboardScrollList({
  totalCount,
  maxSlots = DASHBOARD_ABSENCES_MAX_SLOTS,
  slotSize = "card",
  className = "",
  children,
}: {
  totalCount: number;
  maxSlots?: number;
  slotSize?: SlotSize;
  className?: string;
  children: ReactNode;
}) {
  const overflow = totalCount > maxSlots;

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div
        className="min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin]"
        style={dashboardScrollListStyle(maxSlots, slotSize)}
      >
        {children}
      </div>
      {overflow ? (
        <p className="mt-1.5 shrink-0 text-center text-[9px] font-bold leading-tight text-stone-400">
          +{totalCount - maxSlots} autre{totalCount - maxSlots > 1 ? "s" : ""} · faire défiler ↓
        </p>
      ) : null}
    </div>
  );
}

/** Indication discrète sous une colonne scrollable (n’empiète pas sur le contenu). */
export function DashboardColumnScrollHint({
  totalCount,
  maxSlots = DASHBOARD_ABSENCES_MAX_SLOTS,
}: {
  totalCount: number;
  maxSlots?: number;
}) {
  if (totalCount <= maxSlots) return null;
  return (
    <p className="mt-0.5 shrink-0 text-center text-[8px] font-bold leading-tight text-stone-400">
      +{totalCount - maxSlots} ↓
    </p>
  );
}
