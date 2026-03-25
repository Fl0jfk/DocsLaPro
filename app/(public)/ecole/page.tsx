"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-yellow-600 transition-colors"
      >
        <span>{title}</span>
        <span className={`text-xl text-slate-400 transition-transform duration-300 flex-shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="pb-6 text-slate-600 leading-relaxed space-y-3">{children}</div>}
    </div>
  );
}

export default function EcolePage() {
  return (
    <div className="bg-white min-h-screen">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden bg-yellow-400">
        <Image src="/PO.png" alt="École La Providence" fill sizes="100vw" className="object-cover mix-blend-multiply opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/60 to-yellow-600/80" />
        <div className="relative h-full flex flex-col items-start justify-end max-w-[1200px] mx-auto px-6 pb-16">
          <p className="text-yellow-200 font-bold uppercase tracking-widest text-sm mb-3">Maternelle · Élémentaire</p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4">L&apos;École</h1>
          <p className="text-xl text-yellow-50 max-w-xl leading-relaxed">
            De 3 ans à 11 ans, un lieu de vie où chaque enfant grandit à son rythme, dans la confiance et l&apos;émerveillement.
          </p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-yellow-50 border-b border-yellow-100">
        <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "3 → 11 ans", l: "Maternelle à CM2" },
            { n: "15 classes", l: "4 maternelle · 11 élémentaire" },
            { n: "7h30 – 18h30", l: "Garderie & étude" },
            { n: "ASH", l: "Adaptation scolaire incluse" },
          ].map(({ n, l }) => (
            <div key={n}>
              <p className="text-2xl font-black text-yellow-600">{n}</p>
              <p className="text-xs text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Maternelle ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-3">3 → 6 ans</p>
            <h2 className="text-4xl font-black text-slate-900 mb-5">La maternelle</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              C&apos;est le lieu des premiers engagements dans la vie collective, des premières expériences et acquisitions. On y aide l&apos;enfant à se socialiser, être autonome, développer toutes formes de mémoire, maîtriser son corps et l&apos;espace.
            </p>
            <p className="text-slate-600 leading-relaxed">
              L&apos;imaginaire tient une place importante : plusieurs fois par an, des compagnies théâtrales pour enfants viennent nourrir cet imaginaire et enrichir le travail sur le langage.
            </p>
          </div>
          <div className="relative h-72 rounded-3xl overflow-hidden bg-yellow-100">
            <Image src="/PigeonnierPagode.jpg" alt="Bâtiment La Providence" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>

        {/* Accordion: structure classes */}
        <div className="mt-12 bg-slate-50 rounded-3xl p-6">
          <Accordion title="Structure des classes maternelles">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { c: "Toute Petite & Petite sections", e: "C. Bayel · I. David" },
                { c: "Petite & Moyenne sections", e: "C. Cartier · S. Larigot" },
                { c: "Moyenne & Grande sections", e: "S. Doughty · M.-A. Perez" },
                { c: "Grande section", e: "A. Douere · M.-A. Perez" },
              ].map(({ c, e }) => (
                <div key={c} className="bg-white rounded-xl p-4 border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm">{c}</p>
                  <p className="text-xs text-slate-500 mt-1">{e}</p>
                </div>
              ))}
            </div>
          </Accordion>
        </div>
      </section>

      {/* ── Élémentaire ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-3">6 → 11 ans</p>
          <h2 className="text-4xl font-black text-slate-900 mb-6">L&apos;élémentaire</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl mb-8">
            Notre école applique les programmes de l&apos;Éducation Nationale et vise à faire de tout élève un adulte en devenir, dans un environnement de qualité et une <strong>ambiance familiale</strong>. L&apos;équipe enseignante pratique une pédagogie différenciée, fidèle à Nicolas Barré : <em>« Accueillir, instruire, éduquer chacun selon son génie propre. »</em>
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: "🌍", title: "Anglais dès la GS", desc: "Initiation de la grande section au CP, enseignement du CE1 au CM2." },
              { icon: "🏔", title: "Classes transplantées", desc: "Classe de cirque, ferme, littoral, neige dans les Alpes (CM1/CM2)." },
              { icon: "♟", title: "Sport & culture", desc: "Hockey, handball, basket, football… et des sorties pédagogiques régulières." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-slate-100">
                <span className="text-3xl">{icon}</span>
                <p className="font-bold text-slate-800 mt-3 mb-1">{title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-6">
            <Accordion title="Structure des classes élémentaires" defaultOpen>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                {["CP · CP · CP/CE1 · CE1 · CE1", "CE2 · CE2 · CE2", "CM1 · CM1 · CM2 · CM2 · CM2"].map((row, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <p className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-2">{["Cycle 2 — début", "Cycle 2 — consolidation", "Cycle 3"][i]}</p>
                    {row.split(" · ").map((c, j) => <p key={`${i}-${j}`} className="text-slate-600">{c}</p>)}
                  </div>
                ))}
              </div>
            </Accordion>
            <Accordion title="Projets par cycle & activités spéciales">
              <ul className="space-y-2 text-sm">
                <li><strong>CP/CE1 :</strong> Classe transplantée tous les 2 ans (cirque, ferme, littoral, environnement).</li>
                <li><strong>CE2 :</strong> Projet Artistique et Culturel théâtre avec une professionnelle.</li>
                <li><strong>CM1/CM2 :</strong> Classe de neige dans les Alpes (ski + apprentissages hors les murs).</li>
                <li><strong>CM2 :</strong> Participation au Conseil Municipal des Enfants.</li>
                <li><strong>Toute l&apos;école :</strong> Cross caritatif, Carnaval, Marché de Noël, Fête de l&apos;établissement.</li>
              </ul>
            </Accordion>
            <Accordion title="Classe ASH — Adaptation Scolaire">
              <p className="text-sm">Une enseignante spécialisée à mi-temps permet de prévenir et réduire les difficultés d&apos;apprentissage. L&apos;enfant reste dans sa classe de référence et bénéficie de séances en petits groupes (3 à 6 élèves).</p>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ── Infos pratiques ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-slate-900 mb-8">Informations pratiques</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
            <h3 className="font-black text-slate-800 mb-4">🕐 Horaires</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><span className="font-bold">Garderie matin :</span> 7h30 – 8h15</li>
              <li><span className="font-bold">Cours :</span> 8h30 – 11h30 / 13h15 – 16h30</li>
              <li><span className="font-bold">Garderie / étude :</span> 16h45 – 18h30</li>
              <li><span className="font-bold">Jours :</span> Lundi, mardi, jeudi, vendredi</li>
            </ul>
          </div>
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4">📞 Contact & inscription</h3>
            <p className="text-sm text-slate-600 mb-1"><span className="font-bold">Directrice :</span> {SCHOOL.ecole.directrice}</p>
            <p className="text-sm text-slate-600 mb-1">{SCHOOL.address.street} BP 28 – {SCHOOL.address.city}</p>
            <a href={SCHOOL.phone.tel} className="text-sm font-bold text-yellow-600 block mt-2">{SCHOOL.phone.display}</a>
            <a href={SCHOOL.ecole.emailHref} className="text-sm text-slate-500 block">{SCHOOL.ecole.email}</a>
            <p className="text-xs text-slate-400 mt-3">Inscriptions toute l&apos;année sur rendez-vous. L&apos;école accueille les enfants à partir de 3 ans½.</p>
          </div>
        </div>
      </section>

      {/* ── Identité CTA ── */}
      <section className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="bg-indigo-50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between border border-indigo-100">
          <div>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Établissement catholique sous contrat</p>
            <h3 className="text-2xl font-black text-slate-900">Notre histoire & projet pastoral</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">Héritiers de Nicolas Barré depuis le XVII<sup>e</sup> siècle — découvrez les valeurs et la spiritualité qui animent notre communauté éducative.</p>
          </div>
          <Link href="/notre-identite" className="flex-shrink-0 bg-indigo-600 text-white font-black text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform whitespace-nowrap">
            Découvrir →
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-yellow-400 py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Prêt à rejoindre l&apos;aventure ?</h2>
          <p className="text-yellow-50 mb-8 max-w-md mx-auto">Les inscriptions sont ouvertes toute l&apos;année. Prenez rendez-vous avec la directrice pour découvrir l&apos;école.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={SCHOOL.preinscriptionUrl} className="bg-white text-yellow-600 font-black px-8 py-4 rounded-full hover:scale-105 transition-transform text-sm">
              S&apos;inscrire
            </Link>
            <a href={SCHOOL.phone.tel} className="border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition text-sm">
              {SCHOOL.phone.display}
            </a>
            <a href={SCHOOL.reglementFinancier} target="_blank" rel="noopener noreferrer" className="border-2 border-yellow-200/60 text-yellow-50 font-bold px-8 py-4 rounded-full hover:bg-white/10 transition text-sm">
              📄 Tarifs
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-xs">
        <p>© {new Date().getFullYear()} {SCHOOL.name} · {SCHOOL.address.city} (76)</p>
        <div className="flex gap-6 justify-center mt-3">
          <Link href="/ecole" className="hover:text-white transition">École</Link>
          <Link href="/college" className="hover:text-white transition">Collège</Link>
          <Link href="/lycee" className="hover:text-white transition">Lycée</Link>
          <Link href={SCHOOL.preinscriptionUrl} className="hover:text-white transition">Inscription</Link>
        </div>
      </footer>
    </div>
  );
}
