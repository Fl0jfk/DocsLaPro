"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";
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
import { SCHOOL } from "@/app/lib/school";

function initials(p: OrganigramPerson): string {
  const f = (p.firstName ?? "").trim();
  const l = (p.lastName ?? "").trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (l) return l.slice(0, 2).toUpperCase();
  const r = p.role.replace(/[^a-zA-ZÀ-ÿ]/g, " ").trim();
  const parts = r.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return "?";
}

function displayName(p: OrganigramPerson): string {
  const f = (p.firstName ?? "").trim();
  const l = (p.lastName ?? "").trim();
  if (f || l) return [f, l].filter(Boolean).join(" ");
  return "À compléter";
}

function PersonCard({
  person,
  onSelect,
  compact,
}: {
  person: OrganigramPerson;
  onSelect: (p: OrganigramPerson) => void;
  compact?: boolean;
}) {
  const name = displayName(person);
  const ini = initials(person);

  return (
    <button
      type="button"
      onClick={() => onSelect(person)}
      className={`group text-left w-full rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm hover:shadow-md hover:border-sky-300/60 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex gap-3 items-start">
        <div
          className={`shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold ${
            compact ? "w-12 h-12 text-sm" : "w-14 h-14 text-base"
          }`}
        >
          {person.photoUrl ? (
            <Image
              src={person.photoUrl}
              alt=""
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{ini}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-slate-900 truncate ${compact ? "text-sm" : "text-[15px]"}`}>
            {name}
          </p>
          <p className={`text-sky-800/90 font-medium leading-snug mt-0.5 ${compact ? "text-xs" : "text-sm"}`}>
            {person.role}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Voir les missions →
          </p>
        </div>
      </div>
    </button>
  );
}

function SectionTitle({
  title,
  description,
  dark,
}: {
  title: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-4">
      <h2
        className={`text-lg sm:text-xl font-bold tracking-tight ${dark ? "text-amber-950" : "text-slate-900"}`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`text-sm mt-1 max-w-3xl leading-relaxed ${dark ? "text-amber-950/85" : "text-slate-600"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Ornement bouclier pour la section tutelle (distinct visuellement de l’OGEC). */
function TutelleShieldBackdrop({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  const gradId = `organigramme-shield-grad-${gid}`;
  return (
    <svg
      className={className}
      viewBox="0 0 140 168"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#78350f" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M70 6 L124 28 v46 c0 28-18 52-54 84 C18 126 16 102 16 74 V28 Z"
        fill={`url(#${gradId})`}
        stroke="rgb(120 53 15 / 0.35)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M70 22 L106 38 v32 c0 20-12 40-36 64 C26 110 34 90 34 70 V38 Z"
        fill="none"
        stroke="rgb(180 83 9 / 0.25)"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function ShieldIconSmall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 28" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2 L20 5.2 V14.2 C20 18.5 17 22.3 12 26 C7 22.3 4 18.5 4 14.2 V5.2 Z"
        fill="rgb(251 191 36 / 0.95)"
        stroke="rgb(120 53 15 / 0.85)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function OrganigrammePage() {
  const [selected, setSelected] = useState<OrganigramPerson | null>(null);

  const modalMissions = useMemo(() => {
    if (!selected) return [];
    return selected.missions.map((m) => m.trim()).filter(Boolean);
  }, [selected]);

  return (
    <main className="relative min-h-screen w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-[10vh]">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 mb-2">Espace administration</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Organigramme interne</h1>
        <p className="text-slate-600 mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">
          Vue d&apos;ensemble des fonctions au {SCHOOL.shortName}. Cliquez sur une fiche pour afficher les missions
          détaillées. Les noms et photos sont à compléter dans le fichier{" "}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">app/lib/organigramme.ts</code>.
        </p>
      </header>

      {/* Direction */}
      <section className="mb-12">
        <SectionTitle
          title="Direction du groupe scolaire"
          description="Les trois directions de l'école, du collège et du lycée pilotent chacune leur cycle et coordonnent les projets communs."
        />
        <div className="grid sm:grid-cols-3 gap-4">
          {ORGANIGRAM_DIRECTORS.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Administration transverse */}
      <section className="mb-12 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-6 sm:p-8">
        <SectionTitle title={ORGANIGRAM_ADMIN.title} description={ORGANIGRAM_ADMIN.description} />
        <div className="grid md:grid-cols-3 gap-4">
          {ORGANIGRAM_ADMIN.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Comptabilité */}
      <section className="mb-12">
        <SectionTitle title={ORGANIGRAM_ACCOUNTING.title} description={ORGANIGRAM_ACCOUNTING.description} />
        <div className="grid md:grid-cols-3 gap-3">
          {ORGANIGRAM_ACCOUNTING.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} compact />
          ))}
        </div>
      </section>

      {/* Accueil / standard : seul, non regroupé avec le pôle santé */}
      <section className="mb-12 max-w-md mx-auto">
        <SectionTitle title={ORGANIGRAM_RECEPTION.title} description={ORGANIGRAM_RECEPTION.description} />
        {ORGANIGRAM_RECEPTION.people.map((p) => (
          <PersonCard key={p.id} person={p} onSelect={setSelected} />
        ))}
      </section>

      {/* Pôle santé (infirmière, psychologue, extensions futures) */}
      <section className="mb-12 rounded-3xl border border-emerald-100 bg-emerald-50/35 p-6 sm:p-8">
        <SectionTitle title={ORGANIGRAM_HEALTH.title} description={ORGANIGRAM_HEALTH.description} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ORGANIGRAM_HEALTH.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Pôle maintenance */}
      <section className="mb-12 rounded-3xl border border-amber-200/80 bg-amber-50/50 p-6 sm:p-8">
        <SectionTitle title={ORGANIGRAM_MAINTENANCE.title} description={ORGANIGRAM_MAINTENANCE.description} />
        <div className="grid sm:grid-cols-2 gap-4">
          {ORGANIGRAM_MAINTENANCE.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Pôles éducatifs par cycle */}
      <section className="mb-12">
        <SectionTitle
          title="Pôles éducatifs & vie scolaire"
          description="Équipes présentées par cycle pour distinguer clairement les CPE et les fonctions, sans les fondre dans un seul bloc « secrétariat »."
        />
        <div className="grid lg:grid-cols-3 gap-6">
          {ORGANIGRAM_POLES.map((pole) => (
            <div
              key={pole.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-sky-700 border-b border-slate-100 pb-2">
                {pole.label}
              </h3>
              {pole.blocks.map((block) => (
                <div key={block.id}>
                  <p className="text-xs font-semibold text-slate-500 mb-1">{block.title}</p>
                  {block.description ? (
                    <p className="text-[11px] text-slate-500 mb-2">{block.description}</p>
                  ) : null}
                  <div className="space-y-2">
                    {block.people.map((p) => (
                      <PersonCard key={p.id} person={p} onSelect={setSelected} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Pastorale */}
      <section className="mb-12 rounded-3xl border border-amber-100 bg-amber-50/40 p-6 sm:p-8">
        <SectionTitle title={ORGANIGRAM_PASTORAL.title} description={ORGANIGRAM_PASTORAL.description} />
        <div className="grid sm:grid-cols-3 gap-4">
          {ORGANIGRAM_PASTORAL.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* OGEC — distinct de la tutelle */}
      <section className="mb-10 rounded-3xl border border-slate-200 bg-slate-50/90 p-6 sm:p-8 shadow-sm">
        <SectionTitle title={ORGANIGRAM_OGEC.title} description={ORGANIGRAM_OGEC.description} />
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          {ORGANIGRAM_OGEC.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Tutelle congrégation — traitement « bouclier », instance à part */}
      <section className="mb-8 relative">
        <div className="relative overflow-hidden rounded-[1.75rem] border-[3px] border-amber-900/25 bg-gradient-to-b from-amber-50 via-amber-50/95 to-amber-100/50 p-6 sm:p-10 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_20px_45px_-24px_rgba(120,53,15,0.35)]">
          <TutelleShieldBackdrop className="absolute -right-4 top-1/2 -translate-y-1/2 w-[min(42vw,220px)] h-auto opacity-90 pointer-events-none select-none" />
          <TutelleShieldBackdrop className="absolute -left-8 top-8 w-32 h-auto opacity-40 pointer-events-none select-none rotate-[-8deg]" />
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-3 mb-1">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-950 shadow-md"
                aria-hidden
              >
                <ShieldIconSmall className="w-5 h-6" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-900/70">Tutelle</p>
            </div>
            <SectionTitle dark title={ORGANIGRAM_TUTELLE.title} description={ORGANIGRAM_TUTELLE.description} />
            <div className="grid gap-4 mt-6">
              {ORGANIGRAM_TUTELLE.people.map((p) => (
                <PersonCard key={p.id} person={p} onSelect={setSelected} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="organigramme-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Fermer"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-lg">
                {selected.photoUrl ? (
                  <Image src={selected.photoUrl} alt="" width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  initials(selected)
                )}
              </div>
              <div className="min-w-0">
                <h3 id="organigramme-modal-title" className="text-lg font-bold text-slate-900">
                  {displayName(selected)}
                </h3>
                <p className="text-sky-800 font-medium text-sm mt-0.5">{selected.role}</p>
                {selected.email ? (
                  <a href={`mailto:${selected.email}`} className="text-xs text-sky-600 hover:underline mt-2 inline-block">
                    {selected.email}
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-auto shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer la fenêtre"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Missions & périmètre</p>
              <ul className="space-y-2">
                {modalMissions.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                    <span className="shrink-0 w-4 h-4 mt-0.5 rounded border border-slate-300 bg-white" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
