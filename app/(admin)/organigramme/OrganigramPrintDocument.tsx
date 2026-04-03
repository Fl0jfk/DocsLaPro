"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { SCHOOL } from "@/app/lib/school";
import {
  ORGANIGRAM_DIRECTORS,
  ORGANIGRAM_ADMIN,
  ORGANIGRAM_ACCOUNTING,
  ORGANIGRAM_RECEPTION,
  ORGANIGRAM_HEALTH,
  ORGANIGRAM_MAINTENANCE,
  ORGANIGRAM_POLES,
  ORGANIGRAM_PASTORAL,
  ORGANIGRAM_OGEC,
  ORGANIGRAM_TUTELLE,
  type OrganigramPerson,
} from "@/app/lib/organigramme";

const DIRECTION_TITLE = "Direction du groupe scolaire";
const DIRECTION_DESC =
  "Les trois directions de l'école, du collège et du lycée pilotent chacune leur cycle et coordonnent les projets communs.";

const POLES_TITLE = "Pôles éducatifs & vie scolaire";
const POLES_DESC =
  "Équipes par cycle — CPE et accompagnement, distincts du seul pôle administratif.";

/** Teintes très légères (lisibles à l’impression, regroupement visuel type tuiles). */
type PrintTone =
  | "direction"
  | "admin"
  | "accounting"
  | "reception"
  | "health"
  | "maintenance"
  | "poles"
  | "poleEcole"
  | "poleCollege"
  | "poleLycee"
  | "pastoral"
  | "ogec"
  | "tutelle";

const TILE: Record<
  PrintTone,
  { shell: string; heading: string; rule: string; missionBar: string }
> = {
  direction: {
    shell: "bg-indigo-50/80 border-indigo-100/90",
    heading: "text-indigo-900",
    rule: "border-indigo-200/70",
    missionBar: "border-indigo-200/50",
  },
  admin: {
    shell: "bg-sky-50/80 border-sky-100/90",
    heading: "text-sky-900",
    rule: "border-sky-200/70",
    missionBar: "border-sky-200/50",
  },
  accounting: {
    shell: "bg-emerald-50/80 border-emerald-100/90",
    heading: "text-emerald-900",
    rule: "border-emerald-200/70",
    missionBar: "border-emerald-200/50",
  },
  reception: {
    shell: "bg-violet-50/80 border-violet-100/90",
    heading: "text-violet-900",
    rule: "border-violet-200/70",
    missionBar: "border-violet-200/50",
  },
  health: {
    shell: "bg-teal-50/80 border-teal-100/90",
    heading: "text-teal-900",
    rule: "border-teal-200/70",
    missionBar: "border-teal-200/50",
  },
  maintenance: {
    shell: "bg-amber-50/80 border-amber-100/90",
    heading: "text-amber-900",
    rule: "border-amber-200/70",
    missionBar: "border-amber-200/50",
  },
  poles: {
    shell: "bg-cyan-50/75 border-cyan-100/90",
    heading: "text-cyan-900",
    rule: "border-cyan-200/70",
    missionBar: "border-cyan-200/45",
  },
  poleEcole: {
    shell: "bg-green-50/70 border-green-100/80",
    heading: "text-green-900",
    rule: "border-green-200/60",
    missionBar: "border-green-200/45",
  },
  poleCollege: {
    shell: "bg-blue-50/70 border-blue-100/80",
    heading: "text-blue-900",
    rule: "border-blue-200/60",
    missionBar: "border-blue-200/45",
  },
  poleLycee: {
    shell: "bg-fuchsia-50/65 border-fuchsia-100/80",
    heading: "text-fuchsia-900",
    rule: "border-fuchsia-200/60",
    missionBar: "border-fuchsia-200/45",
  },
  pastoral: {
    shell: "bg-rose-50/80 border-rose-100/90",
    heading: "text-rose-900",
    rule: "border-rose-200/70",
    missionBar: "border-rose-200/50",
  },
  ogec: {
    shell: "bg-slate-50/90 border-slate-200/90",
    heading: "text-slate-800",
    rule: "border-slate-300/80",
    missionBar: "border-slate-300/55",
  },
  tutelle: {
    shell: "bg-amber-50/85 border-amber-200/80",
    heading: "text-amber-950",
    rule: "border-amber-300/70",
    missionBar: "border-amber-300/50",
  },
};

function displayName(p: OrganigramPerson): string {
  const f = (p.firstName ?? "").trim();
  const l = (p.lastName ?? "").trim();
  if (f || l) return [f, l].filter(Boolean).join(" ");
  return "À compléter";
}

function PrintPerson({ person, missionBarClass }: { person: OrganigramPerson; missionBarClass: string }) {
  return (
    <div className="mb-1 print:break-inside-avoid last:mb-0">
      <p className="font-bold text-[7.5pt] leading-tight text-slate-800 m-0">
        {displayName(person)}
        <span className="font-semibold text-slate-700"> — {person.role}</span>
      </p>
      {person.email ? (
        <p className="text-[6.5pt] text-slate-600 m-0 mt-0.5 leading-tight">{person.email}</p>
      ) : null}
      <ul className={`list-none m-0 mt-0.5 pl-1.5 border-l ${missionBarClass} space-y-0`}>
        {person.missions.map((m, i) => (
          <li key={i} className="text-[6.5pt] leading-snug text-slate-700 pl-1 py-0">
            • {m.trim()}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrintTile({
  tone,
  title,
  description,
  children,
}: {
  tone: PrintTone;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const t = TILE[tone];
  return (
    <section
      className={`print:break-inside-avoid rounded-md border p-1.5 mb-1.5 last:mb-0 ${t.shell}`}
    >
      <h2
        className={`m-0 text-[7.5pt] font-bold uppercase tracking-wide pb-0.5 mb-0.5 border-b ${t.heading} ${t.rule}`}
      >
        {title}
      </h2>
      {description ? (
        <p className="text-[6.5pt] text-slate-600 m-0 mb-1 leading-snug">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

function PrintBlockTile({
  tone,
  title,
  description,
  people,
}: {
  tone: PrintTone;
  title: string;
  description?: string;
  people: OrganigramPerson[];
}) {
  const t = TILE[tone];
  return (
    <PrintTile tone={tone} title={title} description={description}>
      {people.map((p) => (
        <PrintPerson key={p.id} person={p} missionBarClass={t.missionBar} />
      ))}
    </PrintTile>
  );
}

function poleTone(id: string): PrintTone {
  if (id === "pole-ecole") return "poleEcole";
  if (id === "pole-college") return "poleCollege";
  return "poleLycee";
}

/**
 * Version papier A4 : mêmes données que l’écran, tuiles pastel légères, ordre vertical condensé (comme l’organigramme).
 */
export function OrganigramPrintDocument() {
  const printedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const dirT = TILE.direction;

  return (
    <article className="organigram-print-root bg-white text-slate-800 max-w-[210mm] mx-auto print:max-w-none">
      <header className="rounded-md border border-slate-200/90 bg-slate-50/70 p-2 mb-1.5 print:break-inside-avoid">
        <h1 className="m-0 text-[11.5pt] font-black tracking-tight leading-tight text-slate-800">
          Organigramme interne
        </h1>
        <p className="m-0 mt-0.5 text-[8.5pt] font-semibold text-slate-700">{SCHOOL.shortName}</p>
        <p className="m-0 mt-0.5 text-[6.5pt] text-slate-600">{SCHOOL.address.fullCompact}</p>
        <p className="m-0 mt-1 text-[6pt] text-slate-500">Document du {printedAt} — usage interne</p>
      </header>

      {/* Une colonne, ordre identique à l’écran : direction → admin → … */}
      <div className="flex flex-col text-[7pt] leading-[1.3]">
        <PrintTile tone="direction" title={DIRECTION_TITLE} description={DIRECTION_DESC}>
          {ORGANIGRAM_DIRECTORS.map((p) => (
            <PrintPerson key={p.id} person={p} missionBarClass={dirT.missionBar} />
          ))}
        </PrintTile>

        <PrintBlockTile tone="admin" title={ORGANIGRAM_ADMIN.title} description={ORGANIGRAM_ADMIN.description} people={ORGANIGRAM_ADMIN.people} />
        <PrintBlockTile
          tone="accounting"
          title={ORGANIGRAM_ACCOUNTING.title}
          description={ORGANIGRAM_ACCOUNTING.description}
          people={ORGANIGRAM_ACCOUNTING.people}
        />
        <PrintBlockTile
          tone="reception"
          title={ORGANIGRAM_RECEPTION.title}
          description={ORGANIGRAM_RECEPTION.description}
          people={ORGANIGRAM_RECEPTION.people}
        />
        <PrintBlockTile tone="health" title={ORGANIGRAM_HEALTH.title} description={ORGANIGRAM_HEALTH.description} people={ORGANIGRAM_HEALTH.people} />
        <PrintBlockTile
          tone="maintenance"
          title={ORGANIGRAM_MAINTENANCE.title}
          description={ORGANIGRAM_MAINTENANCE.description}
          people={ORGANIGRAM_MAINTENANCE.people}
        />

        <PrintTile tone="poles" title={POLES_TITLE} description={POLES_DESC}>
          {ORGANIGRAM_POLES.map((pole) => {
            const pt = TILE[poleTone(pole.id)];
            return (
              <div
                key={pole.id}
                className={`mt-1 first:mt-0 rounded border p-1 print:break-inside-avoid ${pt.shell}`}
              >
                <h3 className={`m-0 text-[7pt] font-bold pb-0.5 mb-0.5 border-b ${pt.heading} ${pt.rule}`}>
                  {pole.label}
                </h3>
                {pole.blocks.map((block) => (
                  <div key={block.id} className="mt-0.5 print:break-inside-avoid">
                    <p className="text-[6.5pt] font-semibold m-0 text-slate-800">{block.title}</p>
                    {block.description ? (
                      <p className="text-[6pt] text-slate-600 m-0 mb-0.5 leading-snug">{block.description}</p>
                    ) : null}
                    {block.people.map((p) => (
                      <PrintPerson key={p.id} person={p} missionBarClass={pt.missionBar} />
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </PrintTile>

        <PrintBlockTile
          tone="pastoral"
          title={ORGANIGRAM_PASTORAL.title}
          description={ORGANIGRAM_PASTORAL.description}
          people={ORGANIGRAM_PASTORAL.people}
        />
        <PrintBlockTile tone="ogec" title={ORGANIGRAM_OGEC.title} description={ORGANIGRAM_OGEC.description} people={ORGANIGRAM_OGEC.people} />
        <PrintBlockTile
          tone="tutelle"
          title={ORGANIGRAM_TUTELLE.title}
          description={ORGANIGRAM_TUTELLE.description}
          people={ORGANIGRAM_TUTELLE.people}
        />
      </div>
    </article>
  );
}
