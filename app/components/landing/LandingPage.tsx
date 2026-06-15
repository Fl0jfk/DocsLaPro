"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "../../../public/Logo header.png";

const FEATURES = [
  {
    icon: "📁",
    title: "Documents & cloud",
    desc: "Stockage personnel, partages ciblés et classement par équipe.",
    accent: "from-amber-400/20 to-orange-500/10",
  },
  {
    icon: "👥",
    title: "RH & personnel",
    desc: "Dossiers salariés, signatures, congés et suivi des arrivées.",
    accent: "from-violet-400/20 to-purple-600/10",
  },
  {
    icon: "🚌",
    title: "Vie scolaire",
    desc: "Sorties, absences, internat et demandes au même endroit.",
    accent: "from-sky-400/20 to-blue-600/10",
  },
  {
    icon: "📅",
    title: "Salles & planning",
    desc: "Réservations, enseignements transversaux et créneaux partagés.",
    accent: "from-emerald-400/20 to-teal-600/10",
  },
  {
    icon: "✨",
    title: "Assistant IA",
    desc: "Chatbot d'aide, OCR documentaire et base de connaissances.",
    accent: "from-fuchsia-400/20 to-pink-600/10",
  },
  {
    icon: "🔐",
    title: "Rôles & sécurité",
    desc: "Chaque métier voit uniquement ce qui le concerne — direction, profs, admin.",
    accent: "from-slate-400/20 to-slate-600/10",
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#06080f] text-white selection:bg-amber-400/30">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute -top-[20%] left-[10%] h-[50vh] w-[50vh] rounded-full bg-[#fbb800]/12 blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] h-[45vh] w-[45vh] rounded-full bg-[#e94f8a]/10 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-[35vh] w-[40vh] rounded-full bg-blue-600/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Image src={Logo} alt="DocsLaPro" width={48} height={48} className="rounded-xl" />
          <span className="text-lg font-black tracking-tight">
            Docs<span className="text-amber-400">La</span>Pro
          </span>
        </div>
        <Link
          href="/sign-in"
          className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold backdrop-blur transition hover:border-amber-400/40 hover:bg-white/10"
        >
          Se connecter
        </Link>
      </header>

      <main>
        <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-10 pt-8 text-center md:pt-14">
          <motion.span
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Plateforme intranet scolaire
          </motion.span>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[3.4rem]"
          >
            Tout votre établissement,{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              un seul espace.
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg"
          >
            DocsLaPro centralise documents, RH, sorties, absences, réservations et communication interne —
            avec des accès adaptés à chaque métier.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/sign-in"
              className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-3.5 text-sm font-black text-slate-900 shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] hover:shadow-amber-500/40 active:scale-[0.98]"
            >
              Accéder à la plateforme
            </Link>
            <a
              href="#modules"
              className="rounded-2xl border border-white/10 px-8 py-3.5 text-sm font-bold text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              Voir les modules
            </a>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-500 md:gap-10"
          >
            <span>20+ modules métier</span>
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span>Multi-établissements</span>
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span>Accès par rôles Clerk</span>
          </motion.div>
        </section>

        <section id="modules" className="mx-auto max-w-6xl px-6 pb-20 pt-4">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-500"
          >
            Ce que DocsLaPro fait pour vous
          </motion.h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.45 }}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${f.accent} p-5 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.04]`}
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-3 text-base font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-snug text-slate-400">{f.desc}</p>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] px-6 py-8 text-center backdrop-blur md:flex-row md:justify-between md:text-left"
          >
            <div>
              <p className="text-lg font-black text-white">Prêt à entrer dans votre espace ?</p>
              <p className="mt-1 text-sm text-slate-400">
                Connectez-vous avec votre compte — le chatbot vous guide si besoin.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="shrink-0 rounded-2xl bg-white px-7 py-3 text-sm font-black text-slate-900 transition hover:bg-amber-50"
            >
              Se connecter
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-slate-600">
        DocsLaPro — plateforme intranet pour établissements scolaires
      </footer>
    </div>
  );
}
