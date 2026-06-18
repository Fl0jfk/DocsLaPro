"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PricingSimulator from "@/app/components/landing/PricingSimulator";
import { SectionReveal } from "@/app/components/landing/SectionReveal";
import {
  BILLING_OPTIONS,
  computePricing,
  formatEur,
  getSubscribeCta,
  PRICE_PER_STUDENT_MONTHLY_EUR,
  STRIPE_BILLING,
} from "@/app/lib/pricing";
import {
  MARKETING,
  MICROSOFT_PRICING_NOTE,
  PRICING_FAQ,
  PRICING_INCLUDED,
} from "@/app/lib/marketing-site";

const EXAMPLE_STUDENTS = 500;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function TarifsContent() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-10 md:pt-14">
        <div className="text-center">
          <motion.span
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-[#2F6B4A]/20 bg-emerald-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#2F6B4A]"
          >
            Abonnement tout inclus
          </motion.span>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-3xl font-black tracking-tight text-[#14231A] md:text-5xl"
          >
            <span className="bg-gradient-to-r from-[#2F6B4A] via-[#3D8A5C] to-[#4ADE80] bg-clip-text text-transparent">
              {formatEur(PRICE_PER_STUDENT_MONTHLY_EUR, { decimals: 2 })}
            </span>{" "}
            <span className="text-[#14231A]">par élève et par mois</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-600"
          >
            {MARKETING.pricingPromise} Style Netflix : abonnez-vous, résiliez quand vous voulez.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-4 flex flex-wrap justify-center gap-2"
          >
            {["Sans engagement", "Annuel −10 %", "Tout inclus"].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-stone-600 shadow-sm ring-1 ring-stone-200/80"
              >
                {tag}
              </span>
            ))}
          </motion.div>

          <motion.p
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-5 max-w-xl text-sm text-stone-500"
          >
            Ex. {EXAMPLE_STUDENTS} élèves →{" "}
            <strong className="text-[#2F6B4A]">
              {formatEur(computePricing(EXAMPLE_STUDENTS, "monthly").monthlyTotal)} / mois
            </strong>{" "}
            ({formatEur(computePricing(EXAMPLE_STUDENTS, "monthly").annualTotal)} / an)
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <SectionReveal>
          <PricingSimulator />
        </SectionReveal>
      </section>

      {/* Formules */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SectionReveal>
          <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-[#3D8A5C]">
            Formules
          </p>
          <h2 className="mt-2 text-center text-2xl font-black text-[#14231A] md:text-3xl">
            Deux façons de payer
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-stone-600">
            Mensuel sans engagement, ou annuel à la rentrée avec 10 % de réduction.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            {BILLING_OPTIONS.map((opt, i) => {
              const cta = getSubscribeCta(opt.mode);
              const example = computePricing(EXAMPLE_STUDENTS, opt.mode);
              return (
                <motion.article
                  key={opt.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  whileHover={{ y: -4 }}
                  className={`relative flex flex-col rounded-3xl border-2 p-6 ${
                    opt.highlighted
                      ? "border-[#2F6B4A] bg-white shadow-xl shadow-emerald-900/15 ring-2 ring-[#4ADE80]/20"
                      : "border-emerald-100 bg-white/90 shadow-md shadow-emerald-900/5"
                  }`}
                >
                  {opt.highlighted ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#2F6B4A] to-[#1E4A32] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                      Le plus flexible
                    </span>
                  ) : null}
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#3D8A5C]">
                    {opt.badge}
                  </span>
                  <h3 className="mt-1 text-xl font-black text-[#14231A]">{opt.name}</h3>
                  <p className="mt-2 text-2xl font-black text-[#2F6B4A]">{opt.priceLine}</p>
                  <p className="mt-2 text-sm text-stone-600">{opt.summary}</p>
                  <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-[#2F6B4A]">
                    {EXAMPLE_STUDENTS} élèves :{" "}
                    {opt.mode === "monthly"
                      ? `${formatEur(example.monthlyTotal)} / mois`
                      : `${formatEur(example.annualTotal)} / an (−10 %)`}
                  </p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {opt.perks.map((p) => (
                      <li key={p} className="flex gap-2 text-sm text-stone-700">
                        <span className="shrink-0 font-bold text-[#4ADE80]">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={cta.href}
                    className={`mt-6 block rounded-2xl py-3.5 text-center text-sm font-black transition ${
                      opt.highlighted
                        ? "bg-gradient-to-r from-[#2F6B4A] to-[#1E4A32] text-white shadow-lg shadow-emerald-900/25 hover:brightness-110"
                        : "border-2 border-[#2F6B4A]/25 text-[#2F6B4A] hover:border-[#2F6B4A] hover:bg-emerald-50"
                    }`}
                  >
                    {cta.label}
                  </a>
                </motion.article>
              );
            })}
          </div>

          {!STRIPE_BILLING.isConfigured ? (
            <p className="mx-auto mt-8 max-w-lg text-center text-xs text-stone-500">
              Paiement en ligne via Stripe — disponible dès l&apos;ouverture de notre structure. En
              attendant, contactez-nous pour souscrire.
            </p>
          ) : null}
        </SectionReveal>
      </section>

      {/* Tout inclus */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SectionReveal>
          <h2 className="text-center text-2xl font-black text-[#14231A] md:text-3xl">
            Tout est <span className="text-[#2F6B4A]">inclus</span>
          </h2>
          <p className="mx-auto mb-8 mt-2 max-w-xl text-center text-sm text-stone-600">
            Établissement seul ou groupe école–collège–lycée — pas de module en option.
          </p>
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-900/5 md:p-8">
            <ul className="grid gap-3 sm:grid-cols-2">
              {PRICING_INCLUDED.map((f) => (
                <li
                  key={f}
                  className="flex gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/30 p-3"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-black text-[#2F6B4A]">
                    ✓
                  </span>
                  <span className="text-sm text-stone-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionReveal>
      </section>

      {/* Microsoft */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SectionReveal>
          <div className="rounded-2xl border-l-4 border-[#F59E0B] bg-gradient-to-r from-amber-50 to-white px-5 py-5 shadow-sm md:px-8">
            <h2 className="text-base font-black text-[#2F6B4A]">{MICROSOFT_PRICING_NOTE.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              {MICROSOFT_PRICING_NOTE.intro}
            </p>
            <ul className="mt-3 space-y-2">
              {MICROSOFT_PRICING_NOTE.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-sm text-stone-700">
                  <span className="mt-0.5 shrink-0 font-bold text-[#2F6B4A]">→</span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-500">{MICROSOFT_PRICING_NOTE.disclaimer}</p>
          </div>
        </SectionReveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <SectionReveal>
          <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-[#3D8A5C]">
            FAQ
          </p>
          <h2 className="mt-2 text-center text-2xl font-black text-[#14231A]">
            Questions fréquentes
          </h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {PRICING_FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm open:border-[#2F6B4A]/30 open:shadow-md"
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-[#2F6B4A] marker:content-none [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.a}</p>
              </details>
            ))}
          </div>
        </SectionReveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <SectionReveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2F6B4A] via-[#25633F] to-[#1E4A32] px-6 py-10 text-center shadow-2xl shadow-emerald-900/30 md:px-12">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#4ADE80]/20 blur-2xl" />
            <h2 className="relative text-xl font-black text-white md:text-2xl">
              Une question sur les tarifs ?
            </h2>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-emerald-100/90">
              Demandez une démo personnalisée selon la taille de votre établissement.
            </p>
            <a
              href={`mailto:${MARKETING.contactEmail}?subject=Devis%20Scola`}
              className="relative mt-6 inline-block rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-[#2F6B4A] shadow-lg transition hover:scale-[1.02]"
            >
              {MARKETING.demoCtaLabel}
            </a>
          </div>
        </SectionReveal>
      </section>

      <p className="mx-auto max-w-6xl px-6 pb-16 text-center text-xs text-stone-500">
        Tarifs indicatifs TTC — effectif déclaré à la souscription, révisable en cours d&apos;année.{" "}
        <Link href="/mentions-legales" className="font-semibold text-[#2F6B4A] hover:underline">
          Mentions légales
        </Link>
        {" · "}
        <Link href="/" className="font-semibold text-[#2F6B4A] hover:underline">
          Accueil
        </Link>
      </p>
    </main>
  );
}
