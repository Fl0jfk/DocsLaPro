"use client";

import { useEffect, useState } from "react";

const FADE_MS = 480;

type Props = {
  open: boolean;
  accentReady?: boolean;
};

export default function DashboardBootstrapOverlay({ open, accentReady = false }: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center print:!hidden transition-opacity duration-[480ms] ease-out"
      style={{
        backgroundColor: accentReady ? "var(--dash-soft-muted)" : "#FAFAF8",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-live="polite"
      aria-busy={visible}
      role="status"
    >
      <div
        className="flex flex-col items-center transition-all duration-[480ms] ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.96)",
        }}
      >
        <div className="relative">
          <div
            className="h-16 w-16 animate-spin rounded-full border-4 shadow-sm"
            style={
              accentReady
                ? { borderColor: "var(--dash-soft)", borderTopColor: "var(--dash-primary)" }
                : { borderColor: "#e2e8f0", borderTopColor: "#64748b" }
            }
          />
          {accentReady ? (
            <div
              className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 opacity-20"
              style={{ borderColor: "var(--dash-bright)" }}
            />
          ) : null}
        </div>
        <p
          className="mt-6 text-sm font-bold uppercase tracking-widest"
          style={{ color: accentReady ? "var(--dash-mid)" : "#64748b" }}
        >
          Chargement
        </p>
      </div>
    </div>
  );
}
