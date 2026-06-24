"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Charge le widget bento (et ses API) seulement quand il entre dans le viewport. */
export default function LazyBentoWidget({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "180px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full min-h-[8.5rem]">
      {visible ? (
        children
      ) : (
        <div
          className="h-full min-h-[8.5rem] animate-pulse rounded-2xl border border-stone-200/80 bg-white/70"
          aria-hidden
        />
      )}
    </div>
  );
}
