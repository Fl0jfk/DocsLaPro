"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ORGANIGRAM_DIRECTORS, ORGANIGRAM_ADMIN, ORGANIGRAM_ACCOUNTING, ORGANIGRAM_RECEPTION, ORGANIGRAM_HEALTH, ORGANIGRAM_POLES, ORGANIGRAM_MAINTENANCE, ORGANIGRAM_PASTORAL, ORGANIGRAM_OGEC, ORGANIGRAM_TUTELLE, type OrganigramPerson} from "@/app/lib/organigramme";
import { OrganigramServiceFrame, OrganigramPoleColumn } from "./OrganigramServiceFrame";
import { OrganigramPrintDocument } from "./OrganigramPrintDocument";

function poleVariantFor(id: string): "poleEcole" | "poleCollege" | "poleLycee" {
  if (id === "pole-ecole") return "poleEcole";
  if (id === "pole-college") return "poleCollege";
  return "poleLycee";
}

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

function PersonCard({ person, onSelect, compact}: { person: OrganigramPerson; onSelect: (p: OrganigramPerson) => void; compact?: boolean}) {
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
            <Image src={person.photoUrl} alt="" width={56} height={56} className="w-full h-full object-cover"/>
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

export default function OrganigrammePage() {
  const [selected, setSelected] = useState<OrganigramPerson | null>(null);
  const modalMissions = useMemo(() => {
    if (!selected) return [];
    return selected.missions.map((m) => m.trim()).filter(Boolean);
  }, [selected]);
  return (
    <main className="relative min-h-screen w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-[4vh] overflow-x-clip print:max-w-none print:mx-0 print:px-4 print:pb-0 print:pt-2 print:overflow-visible">
      <div className="print:hidden">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Organigramme interne</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="shrink-0 self-start px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors border border-slate-700"
        >
          Imprimer / PDF (A4)
        </button>
      </header>
      <div className="relative flex flex-col gap-4 sm:gap-6 md:gap-9 lg:gap-12">
      <OrganigramServiceFrame
        variant="direction"
        slotIndex={0}
        title="Direction du groupe scolaire"
        description="Les trois directions de l'école, du collège et du lycée pilotent chacune leur cycle et coordonnent les projets communs."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ORGANIGRAM_DIRECTORS.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame slotIndex={1} variant="admin" title={ORGANIGRAM_ADMIN.title} description={ORGANIGRAM_ADMIN.description}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ORGANIGRAM_ADMIN.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame
        slotIndex={2}
        variant="accounting"
        title={ORGANIGRAM_ACCOUNTING.title}
        description={ORGANIGRAM_ACCOUNTING.description}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ORGANIGRAM_ACCOUNTING.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame
        slotIndex={6}
        variant="poles"
        bareContent
        title="Pôles éducatifs & vie scolaire"
        description="Équipes par cycle — CPE et accompagnement, distincts du seul pôle administratif."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          {ORGANIGRAM_POLES.map((pole) => (
            <OrganigramPoleColumn key={pole.id} poleVariant={poleVariantFor(pole.id)} label={pole.label}>
              {pole.blocks.map((block) => (
                <div key={block.id} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-slate-600 mb-1">{block.title}</p>
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
            </OrganigramPoleColumn>
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame
        slotIndex={3}
        variant="reception"
        title={ORGANIGRAM_RECEPTION.title}
        description={ORGANIGRAM_RECEPTION.description}
      >
        {ORGANIGRAM_RECEPTION.people.map((p) => (
          <PersonCard key={p.id} person={p} onSelect={setSelected} />
        ))}
      </OrganigramServiceFrame>
      <OrganigramServiceFrame slotIndex={4} variant="health" title={ORGANIGRAM_HEALTH.title} description={ORGANIGRAM_HEALTH.description}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {ORGANIGRAM_HEALTH.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame
        slotIndex={5}
        variant="maintenance"
        title={ORGANIGRAM_MAINTENANCE.title}
        description={ORGANIGRAM_MAINTENANCE.description}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ORGANIGRAM_MAINTENANCE.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame
        slotIndex={7}
        variant="pastoral"
        title={ORGANIGRAM_PASTORAL.title}
        description={ORGANIGRAM_PASTORAL.description}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ORGANIGRAM_PASTORAL.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame slotIndex={8} variant="ogec" title={ORGANIGRAM_OGEC.title} description={ORGANIGRAM_OGEC.description}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {ORGANIGRAM_OGEC.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      <OrganigramServiceFrame slotIndex={9} variant="tutelle" title={ORGANIGRAM_TUTELLE.title} description={ORGANIGRAM_TUTELLE.description}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {ORGANIGRAM_TUTELLE.people.map((p) => (
            <PersonCard key={p.id} person={p} onSelect={setSelected} />
          ))}
        </div>
      </OrganigramServiceFrame>
      </div>
      </div>
      <div className="hidden print:block print:p-0">
        <OrganigramPrintDocument />
      </div>
      {selected ? (
        <div
          className="print:hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
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
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                    <span className="shrink-0 text-slate-400 select-none" aria-hidden>
                      •
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 5mm;
          }
          /* Masque les widgets flottants externes (bouton IA/assistant, etc.) */
          [aria-label*="IA" i],
          [aria-label*="assistant" i],
          [title*="IA" i],
          [title*="assistant" i],
          iframe[title*="assistant" i],
          iframe[title*="chat" i] {
            display: none !important;
            visibility: hidden !important;
          }
          html,
          body {
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}