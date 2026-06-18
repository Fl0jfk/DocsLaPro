/** Tokens visuels du tableau de bord intranet — utilisent les variables CSS du thème. */

export const DASHBOARD_ROW_SHELL =
  "group relative flex min-h-[6.5rem] w-full overflow-hidden rounded-2xl border border-[color:var(--dash-border)]/70 bg-gradient-to-r from-white via-white to-[color:var(--dash-soft-muted)]/40 shadow-sm transition-all duration-300 ease-out hover:border-[color:var(--dash-primary)]/35 hover:shadow-md";

export const DASHBOARD_ROW_PULSE =
  "border-l-[3px] border-l-[var(--dash-bright)] shadow-md";

export const DASHBOARD_BTN_BASE =
  "whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]";

export const DASHBOARD_BTN_PRIMARY = `${DASHBOARD_BTN_BASE} bg-gradient-to-r from-[var(--dash-primary)] to-[var(--dash-dark)]`;
export const DASHBOARD_BTN_INDIGO = `${DASHBOARD_BTN_BASE} bg-indigo-600 shadow-indigo-900/20 hover:bg-indigo-700`;
export const DASHBOARD_BTN_EMERALD = `${DASHBOARD_BTN_BASE} bg-[var(--dash-primary)] hover:brightness-110`;
export const DASHBOARD_BTN_VIOLET = `${DASHBOARD_BTN_BASE} bg-violet-600 shadow-violet-900/20 hover:bg-violet-700`;
export const DASHBOARD_BTN_SLATE = `${DASHBOARD_BTN_BASE} bg-slate-800 shadow-slate-900/20 hover:bg-slate-900`;

export const DASHBOARD_TILE_META = "text-xs text-stone-500 leading-snug";
export const DASHBOARD_TILE_META_STRONG =
  "text-[10px] font-black uppercase tracking-wide text-[var(--dash-mid)]";
export const DASHBOARD_TILE_HIGHLIGHT = "text-xs font-semibold text-[var(--dash-ink)] leading-snug";

export const DASHBOARD_SELECT =
  "max-w-[11rem] rounded-lg border border-[color:var(--dash-border)] bg-white/90 px-2 py-1.5 text-xs font-bold text-[var(--dash-ink)] outline-none focus:border-[var(--dash-primary)] focus:ring-2 focus:ring-[color:var(--dash-bright)]/25";

export const DASHBOARD_ENTER_CTA =
  "inline-flex items-center gap-1 rounded-full bg-[color:var(--dash-soft-muted)] px-3 py-1.5 text-xs font-bold text-[var(--dash-primary)] transition group-hover:bg-[var(--dash-primary)] group-hover:text-white";

/** @deprecated use DASHBOARD_ROW_SHELL */
export const DASHBOARD_TILE_SHELL = DASHBOARD_ROW_SHELL;
export const DASHBOARD_TILE_PULSE = DASHBOARD_ROW_PULSE;
