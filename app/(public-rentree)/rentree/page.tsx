"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RentreePublicHeader from "@/app/components/RentreePublicHeader";
import { RENTREE_LINKS, RentreeLevel, RentreeLinksByLevel } from "./rentree-links";

function accentClasses(accent: RentreeLinksByLevel["accent"]) {
  if (accent === "yellow") {
    return {
      pillActive: "bg-yellow-500 text-white border-yellow-500",
      pillIdle: "bg-white text-slate-700 border-slate-200 hover:border-yellow-300",
      badge: "bg-yellow-50 text-yellow-700 border-yellow-100",
      sectionTitle: "text-yellow-700",
      cta: "bg-yellow-500 hover:bg-yellow-600 text-white",
      hero: "from-yellow-500 via-yellow-500/60 to-white",
    };
  }
  if (accent === "sky") {
    return {
      pillActive: "bg-sky-600 text-white border-sky-600",
      pillIdle: "bg-white text-slate-700 border-slate-200 hover:border-sky-300",
      badge: "bg-sky-50 text-sky-700 border-sky-100",
      sectionTitle: "text-sky-700",
      cta: "bg-sky-600 hover:bg-sky-700 text-white",
      hero: "from-sky-600 via-sky-600/60 to-white",
    };
  }
  return {
    pillActive: "bg-pink-600 text-white border-pink-600",
    pillIdle: "bg-white text-slate-700 border-slate-200 hover:border-pink-300",
    badge: "bg-pink-50 text-pink-700 border-pink-100",
    sectionTitle: "text-pink-700",
    cta: "bg-pink-600 hover:bg-pink-700 text-white",
    hero: "from-pink-600 via-pink-600/60 to-white",
  };
}

function normalizeLevel(v: string | null): RentreeLevel {
  if (v === "college" || v === "lycee" || v === "ecole") return v;
  return "ecole";
}

function LinkCard({ title, description, href, kind }: { title: string; description?: string; href: string; kind?: "pdf" | "link" }) {
  const isPdf = kind === "pdf" || href.toLowerCase().endsWith(".pdf");
  const badge = isPdf ? "PDF" : "Lien";
  const icon = isPdf ? "📄" : "🔗";
  const external = href.startsWith("http://") || href.startsWith("https://");
  const isInternal = href.startsWith("/");
  const targetProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const Comp = isInternal ? Link : "a";
  return (
    <Comp
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(isInternal ? ({ href } as any) : ({ href, ...targetProps } as any))}
      className="group block rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-black text-slate-900 text-lg leading-snug">{title}</p>
          {description ? <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p> : null}
        </div>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-lg">{icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-slate-50">
            {badge}
          </span>
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
      
        <span className="font-black text-indigo-600 group-hover:text-indigo-700 transition-colors">
          Ouvrir →
        </span>
      </div>
    </Comp>
  );
}

function RentreePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const selected = normalizeLevel(params.get("level"));
  const active = useMemo(() => RENTREE_LINKS.find((x) => x.level === selected) ?? RENTREE_LINKS[0], [selected]);
  const a = accentClasses(active.accent);

  const setLevel = (level: RentreeLevel) => {
    const url = new URL(window.location.href);
    url.searchParams.set("level", level);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  };

  return (
    <div className="bg-white min-h-screen">
      <RentreePublicHeader />
      <section className={`relative overflow-hidden bg-gradient-to-b ${a.hero}`}>
        <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-12">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-white/90 font-bold uppercase tracking-widest text-xs">Informations familles</p>
              <h1 className="text-5xl md:text-6xl font-black text-white leading-[0.95] mt-3">
                Rentrée prochaine
              </h1>
            </div>
            <div className="bg-white/90 backdrop-blur-md border border-white/60 rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="min-w-0">
                <p className="font-black text-slate-900">Fournitures scolaires</p>
                <p className="text-sm text-slate-600 mt-1">Accès direct au simulateur (impression par classe / options).</p>
              </div>
              <Link
                href="/simulateurFournitures"
                className={`px-6 py-3 rounded-full font-black text-sm transition ${a.cta} whitespace-nowrap shadow-sm`}
              >
                Ouvrir le simulateur →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {RENTREE_LINKS.map((lvl) => {
                const isActive = lvl.level === active.level;
                const cls = accentClasses(lvl.accent);
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setLevel(lvl.level)}
                    className={`px-4 py-2 rounded-full border text-sm font-black transition ${isActive ? cls.pillActive : cls.pillIdle}`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <main className="max-w-[1200px] mx-auto px-6 pb-12">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">{active.label}</h2>
          </div>
        </div>
        <div className="space-y-10">
          {active.sections.map((section) => (
            <section key={section.title} className="bg-slate-50 rounded-[2.5rem] p-6 md:p-8 border border-slate-100">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className={`text-xl md:text-2xl font-black ${a.sectionTitle}`}>{section.title}</h3>
                <span className="text-xs font-bold text-slate-400">{section.items.length} lien(s)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((it) => (
                  <LinkCard
                    key={`${section.title}-${it.title}`}
                    title={it.title}
                    description={it.description}
                    href={it.href}
                    kind={it.kind}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-xs">
        <p>Besoin d’aide ? Contacte l’établissement concerné ou repasse par la page du niveau.</p>
        <div className="flex gap-6 justify-center mt-3">
          <Link href="/rentree?level=ecole" className="hover:text-white transition">École</Link>
          <Link href="/rentree?level=college" className="hover:text-white transition">Collège</Link>
          <Link href="/rentree?level=lycee" className="hover:text-white transition">Lycée</Link>
        </div>
      </footer>
    </div>
  );
}

function RentreePageFallback() {
  return (
    <div className="bg-white min-h-screen">
      <RentreePublicHeader />
      <div className="max-w-[1200px] mx-auto px-6 py-16 animate-pulse">
        <div className="h-40 rounded-3xl bg-slate-100 mb-8" />
        <div className="h-8 w-48 rounded-lg bg-slate-100 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 rounded-3xl bg-slate-100" />
          <div className="h-32 rounded-3xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function RentreePage() {
  return (
    <Suspense fallback={<RentreePageFallback />}>
      <RentreePageContent />
    </Suspense>
  );
}

