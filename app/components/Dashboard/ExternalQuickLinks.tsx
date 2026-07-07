"use client";

import type { DashboardQuickLink } from "@/app/lib/dashboard-quick-links";
import { dash } from "@/app/lib/dashboard-brand";

export function QuickLinkIcon({ src, name }: { src: string; name: string }) {
  if (!src) {
    return (
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${dash.bgSoftMuted} ${dash.textMid}`}>
        {name.slice(0, 1).toUpperCase() || "?"}
      </div>
    );
  }
  return (
    <div className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-lg ${dash.bgSoftMuted}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain p-0.5" />
    </div>
  );
}

export function ExternalQuickLinksBar({ links }: { links: DashboardQuickLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
      <span className={`w-full text-[10px] font-bold uppercase tracking-widest sm:mr-1 sm:w-auto ${dash.label}`}>
        Accès rapides
      </span>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.link}
          target="_blank"
          rel="noopener noreferrer"
          title={link.name}
          className={`group flex items-center gap-2 rounded-xl border bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${dash.borderSoft} ${dash.hoverBorder}`}
        >
          <QuickLinkIcon src={link.img} name={link.name} />
          <span className={`max-w-[8rem] truncate text-xs font-bold text-stone-600 sm:max-w-[10rem] ${dash.hoverPrimary}`}>
            {link.name}
          </span>
        </a>
      ))}
    </div>
  );
}
