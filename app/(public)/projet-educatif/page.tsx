"use client";

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import Header from "../../components/Header/Header";
import { SCHOOL } from "../../lib/school";

const PILIERS = [
  {
    icon: "🤝",
    title: "ACCUEILLIR",
    subtitle: "Sans distinction ni acception de personne",
    points: [
      "Accueillir chaque jeune, fille ou garçon, de la maternelle à la terminale.",
      "Respecter les personnes, les parcours et les différences de chacun.",
      "Exiger le respect du projet éducatif et du règlement pour tous.",
    ],
    color: "yellow",
  },
  {
    icon: "📚",
    title: "INSTRUIRE",
    subtitle: "Éveiller l'intelligence et la curiosité",
    points: [
      "Ne pas s'arrêter aux facilités ou aux difficultés des élèves.",
      "Aider l'élève à construire son propre savoir avec méthode.",
      "Développer l'adaptation, la réflexion et le goût d'apprendre.",
    ],
    color: "blue",
  },
  {
    icon: "🌱",
    title: "ÉDUQUER",
    subtitle: "Préparer à une vie libre et responsable",
    points: [
      "Apprendre à connaître, choisir et vouloir.",
      "S'appuyer sur des valeurs universelles: justice, respect, solidarité.",
      "Grandir en autonomie tout en acceptant les contraintes nécessaires.",
    ],
    color: "green",
  },
  {
    icon: "🌍",
    title: "OUVRIR SUR LE MONDE",
    subtitle: "La beauté de l'Univers est dans ses différences",
    points: [
      "Développer les langues, les sciences et la culture.",
      "S'engager dans le développement durable et l'humanitaire.",
      "Valoriser le sport, la vie associative et l'orientation professionnelle.",
    ],
    color: "pink",
  },
] as const;

const COLOR_CLASSES = {
  yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
  blue: "bg-blue-50 border-blue-100 text-blue-700",
  green: "bg-green-50 border-green-100 text-green-700",
  pink: "bg-pink-50 border-pink-100 text-pink-700",
} as const;

export default function ProjetEducatifPage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />
      <section className="max-w-[1200px] mx-auto px-6 pt-2 pb-6">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-5 mb-2">
          Le mot des directrices
        </h2>
        <p className="text-slate-600 text-sm md:text-base max-w-3xl mb-7">
          De la maternelle à la terminale, nos directions partagent une même conviction:
          accueillir chaque jeune avec confiance, exigence et bienveillance.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              etab: "École",
              nom: "Direction École",
              role: "Maternelle & Élémentaire",
              color: "bg-yellow-50 border-yellow-100",
              badge: "text-yellow-700 bg-yellow-200",
              href: "/ecole",
              img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/organigram/Plantec-Elise-1.png",
              objectMobile: "center -10%",
              objectSm: "center 12%",
              objectMd: "center -400%",
              objectLg: "center -10%",
              scaleMobile: "1",
              scaleMd: "1.25",
              scaleLg: "1.1",
            },
            {
              etab: "Collège",
              nom: "Direction Collège",
              role: "6ème à 3ème",
              color: "bg-blue-50 border-blue-100",
              badge: "text-blue-700 bg-blue-200",
              href: "/college",
              img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/organigram/Direction_5-removebg-preview.png",
              objectMobile: "center 15%",
              objectMd: "center 10%",
              objectLg: "center 10%",
              scaleMobile: "1",
              scaleMd: "1",
              scaleLg: "1",
            },
            {
              etab: "Lycée",
              nom: "Direction Lycée",
              role: "Général & Technologique",
              color: "bg-pink-50 border-pink-100",
              badge: "text-pink-700 bg-pink-200",
              href: "/lycee",
              img: "https://docslaproimage.s3.eu-west-3.amazonaws.com/organigram/mme-dona-directrice-lycee-la-providence-nicolas-barre-mesnil-esnard.png",
              objectMobile: "center 20%",
              objectMd: "center 20%",
              objectLg: "center 20%",
              scaleMobile: "1",
              scaleMd: "1",
              scaleLg: "1",
            },
          ].map((d) => (
            <article key={d.etab} className={`rounded-3xl hover:scale-105 transition-transform duration-300 border p-5 ${d.color}`}>
              <span className={`inline-block text-[11px] font-black px-3 py-1 rounded-full ${d.badge}`}>
                {d.etab}
              </span>
              <Link href={d.href} className="block mt-4 group">
                <div className="relative overflow-hidden rounded-2xl h-64 sm:min-h-[500px] md:min-h-64">
                  <Image src={d.img} alt={d.nom} fill
                    style={
                      {
                        "--obj-mobile": d.objectMobile,
                        "--obj-sm": d.objectSm,
                        "--obj-md": d.objectMd,
                        "--obj-lg": d.objectLg,
                        "--scale-mobile": d.scaleMobile,
                        "--scale-md": d.scaleMd,
                        "--scale-lg": d.scaleLg,
                      } as CSSProperties
                    }
                    className="w-full h-full object-cover object-[var(--obj-mobile)] sm:object-[var(--obj-sm)] md:object-[var(--obj-md)] lg:object-[var(--obj-lg)] scale-[var(--scale-mobile)] sm:scale-[var(--scale-mobile)] md:scale-[var(--scale-md)] lg:scale-[var(--scale-lg)]"
                  />
                </div>
                <p className="mt-3 font-black text-slate-900">{d.nom}</p>
                <p className="text-xs text-slate-500">{d.role}</p>
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section id="maternelle-terminale" className="bg-gradient-to-b from-indigo-900 to-indigo-700 py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-3">
            De la maternelle à la terminale
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-5">Projet éducatif</h1>
          <p className="text-indigo-100 text-lg max-w-3xl leading-relaxed">
            À La Providence Nicolas Barré, chaque jeune est accueilli tel qu&apos;il est.
            Notre projet éducatif affirme une conviction simple: croire en chacun, espérer
            en chacun, et l&apos;aider à grandir dans toutes les dimensions de sa personne.
          </p>
          <div className="mt-8 inline-flex bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-indigo-50 text-sm italic">
            « Comme je vous ai aimés, aimez-vous les uns les autres. »
          </div>
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-7">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notre mission</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Un seul esprit, trois établissements</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Trois directions, une même tutelle, un projet commun: accompagner les enfants
              et les jeunes dans leur croissance intellectuelle, humaine et spirituelle.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Inspiré par Nicolas Barré et porté par la communauté éducative, ce projet met
              la confiance, la douceur et la droiture au cœur des relations.
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-7">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Message aux jeunes</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Nous croyons en toi</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              « Je crois en toi, j&apos;espère en toi, tu es capable de grandir, de surmonter les
              difficultés, je te fais confiance. »
            </p>
            <p className="text-slate-600 leading-relaxed">« Je t&apos;aime comme tu es, c&apos;est-à-dire comme Dieu t&apos;aime. »</p>
          </div>
        </div>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-indigo-500 font-bold uppercase tracking-widest text-xs mb-3">Les 4 piliers</p>
          <h2 className="text-4xl font-black text-slate-900 mb-10">Accueillir, instruire, éduquer, ouvrir</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {PILIERS.map((pilier) => (
              <article key={pilier.title} className={`rounded-3xl border p-6 ${COLOR_CLASSES[pilier.color]}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{pilier.icon}</span>
                  <h3 className="text-2xl font-black">{pilier.title}</h3>
                </div>
                <p className="text-sm font-bold mb-4">{pilier.subtitle}</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {pilier.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-slate-100 p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Projet pastoral</p>
          <h2 className="text-3xl font-black text-slate-900 mb-5">Cheminer dans la foi et la confiance</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            La communauté éducative accompagne chaque élève dans son cheminement de foi, en
            respectant les convictions de chacun. Notre ambition est de gagner les cœurs
            « par la douceur et la droiture ».
          </p>
          <p className="text-slate-600 leading-relaxed italic">
            « Il faut s&apos;appliquer davantage à établir le bien qu&apos;à détruire le mal. »
          </p>
        </div>
      </section>
      <section className="bg-indigo-600 py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Découvrir nos établissements</h2>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
            Maternelle, élémentaire, collège, lycée général et lycée technologique: un parcours
            complet, un même engagement éducatif.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <Link href="/ecole" className="bg-white text-yellow-600 font-black text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform">
              École
            </Link>
            <Link href="/college" className="bg-white text-blue-600 font-black text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform">
              Collège
            </Link>
            <Link href="/lycee" className="bg-white text-pink-600 font-black text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform">
              Lycée
            </Link>
          </div>
          <a href={SCHOOL.phone.tel} className="inline-block mt-6 text-indigo-100 hover:text-white text-sm font-bold">📞 {SCHOOL.phone.display}</a>
        </div>
      </section>
    </div>
  );
}
