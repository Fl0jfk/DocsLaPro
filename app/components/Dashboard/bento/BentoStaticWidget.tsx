"use client";

import type { ReactNode } from "react";
import DashboardModuleIcon from "@/app/components/Dashboard/bento/DashboardModuleIcon";
import { dash } from "@/app/lib/dashboard-brand";

type Props = {
  title: string;
  iconSrc?: string;
  headerExtra?: ReactNode;
  subtitle?: string;
  bodyClassName?: string;
  articleClassName?: string;
  children: ReactNode;
};

/** Tuile bento sans lien — affichage seul (feuille de semaine, etc.). */
export default function BentoStaticWidget({
  title,
  iconSrc,
  headerExtra,
  subtitle,
  bodyClassName,
  articleClassName,
  children,
}: Props) {
  return (
    <article
      className={`flex min-h-[8.5rem] flex-col rounded-2xl border bg-white/92 shadow-sm backdrop-blur-sm ${dash.tileBorder} ${articleClassName ?? "h-full overflow-hidden"}`}
    >
      <header
        className={`flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 ${dash.border} ${dash.gradientHeader}`}
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <DashboardModuleIcon src={iconSrc} label={title} />
            <h2 className={`truncate text-sm font-black sm:text-base ${dash.ink}`}>{title}</h2>
          </div>
          {subtitle ? (
            <p className="mt-0.5 truncate pl-9 text-[10px] font-semibold text-stone-500">{subtitle}</p>
          ) : null}
        </div>
        {headerExtra ? <div className="flex shrink-0 items-center gap-2">{headerExtra}</div> : null}
      </header>
      <div className={bodyClassName ?? "min-h-0 flex-1 overflow-auto p-2 sm:p-3"}>{children}</div>
    </article>
  );
}
