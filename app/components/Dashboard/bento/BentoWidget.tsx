"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import DashboardModuleIcon from "@/app/components/Dashboard/bento/DashboardModuleIcon";
import { dash } from "@/app/lib/dashboard-brand";

type Props = {
  title: string;
  href: string;
  external?: boolean;
  iconSrc?: string;
  pulse?: boolean;
  headerExtra?: ReactNode;
  /** false = hauteur au contenu (ne remplit pas la cellule grille) */
  fillHeight?: boolean;
  children: ReactNode;
};

export default function BentoWidget({
  title,
  href,
  external,
  iconSrc,
  pulse,
  headerExtra,
  fillHeight = false,
  children,
}: Props) {
  const titleClass = `truncate text-sm font-black transition sm:text-base ${dash.ink} ${dash.hoverPrimary}`;

  const titleEl = external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={titleClass}>
      {title}
    </a>
  ) : (
    <Link href={href} className={titleClass}>
      {title}
    </Link>
  );

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white/92 shadow-sm backdrop-blur-sm transition duration-300 hover:shadow-md ${dash.tileBorder} ${dash.tileBorderHover} ${
        fillHeight ? "h-full min-h-[8.5rem]" : "h-auto min-h-0"
      } ${pulse ? `ring-2 ring-offset-1 ${dash.ringBright35}` : ""}`}
    >
      <header
        className={`flex shrink-0 items-center justify-between gap-2 rounded-t-2xl border-b px-3 py-2.5 sm:px-4 ${dash.border} ${dash.gradientHeader}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <DashboardModuleIcon src={iconSrc} label={title} />
          {pulse ? (
            <span className={`h-2 w-2 shrink-0 animate-pulse rounded-full ${dash.bgPrimary}`} aria-hidden />
          ) : null}
          {titleEl}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtra}
          {external ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`text-[11px] ${dash.linkBold}`}>
              Ouvrir ↗
            </a>
          ) : (
            <Link href={href} className={`text-[11px] ${dash.linkBold}`}>
              Ouvrir →
            </Link>
          )}
        </div>
      </header>
      <div className={`overflow-auto p-3 sm:p-4 ${fillHeight ? "min-h-0 flex-1" : ""}`}>{children}</div>
    </article>
  );
}

