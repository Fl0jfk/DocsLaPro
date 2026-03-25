"use client";

import Link from 'next/link';
import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import Image from 'next/image';
import SiteHeader from '../components/Header/Header';

function resolveNewsImage(url: string): string | null {
  if (!url || !url.trim()) return null;
  if (url.includes("docslapro.s3.") && !url.includes("docslaproimage.s3.")) {
    return `/api/news/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
type NewsItem = {
  id: string;
  type: "article" | "lien";
  category?: string;
  title: string;
  subtitle: string;
  description: string;
  body?: string;
  image: string;
  link?: string;
  buttonText: string;
};

export default function HomePage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const slideWidth = 90; 
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadNews = async () => {
      try {
        setNewsLoading(true);
        const res = await fetch("/api/news/get");
        const data = await res.json();
        // Keep only the last 10 items for the slider.
        const all: NewsItem[] = Array.isArray(data) ? data : [];
        if (!cancelled) setNewsItems(all.slice(-10));
      } catch (e) {
        console.error("Erreur chargement news:", e);
        if (!cancelled) setNewsItems([]);
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    };
    loadNews();
    return () => {
      cancelled = true;
    };
  }, []);

  const newsCount = newsItems.length;
  const extendedNews = useMemo(
    () => (newsCount > 0 ? [...newsItems, ...newsItems, ...newsItems] : []),
    [newsItems, newsCount]
  );

  useEffect(() => {
    if (newsCount > 0) setCurrentIndex(newsCount);
  }, [newsCount]);

  useEffect(() => {
    if (isPaused || newsCount === 0) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, [isPaused, newsCount]);
  useLayoutEffect(() => {
    if (!isTransitioning && newsCount > 0) {
      if (currentIndex >= newsCount * 2) {
        setCurrentIndex(newsCount);
      } else if (currentIndex < newsCount) {
        setCurrentIndex(newsCount * 2 - 1);
      }
    }
  }, [currentIndex, isTransitioning, newsCount]);

  if (newsLoading) {
    return (
      <div className="bg-[#f5f5f7] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500 shadow-sm"></div>
          <p className="mt-6 text-sm font-bold uppercase tracking-widest text-blue-500/80">Chargement</p>
        </div>
      </div>
    );
  }
  const handleInteraction = (index: number) => {
    setIsPaused(true);
    setIsTransitioning(true);
    setCurrentIndex(index);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 10000);
  };
  return (
    <div className="bg-[#f5f5f7] min-h-screen">
      <SiteHeader />
      <main className="bg-white overflow-hidden">
        <section className="py-10">
          {newsCount === 0 ? (
            <div className="h-[500px] flex items-center justify-center text-slate-400 text-sm">
              Aucune actualité disponible pour le moment.
            </div>
          ) : (
            <>
              <div className="relative w-full">
                <div
                  onTransitionEnd={() => setIsTransitioning(false)}
                  className="flex h-[500px]"
                  style={{
                    transform: `translate3d(calc(50vw - (${slideWidth}vw / 2) - (${currentIndex} * ${slideWidth}vw)), 0, 0)`,
                    transition: isTransitioning ? 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                    willChange: 'transform',
                  }}
                >
                  {extendedNews.map((actu, index) => {
                    const isActive = index === currentIndex;
                    const baseIndex = index % newsCount;
                    const shouldPreload = baseIndex === 0 || baseIndex === newsCount - 1;
                    return (
                      <div
                        key={`slide-fixed-${index}`}
                        className="relative h-full flex-shrink-0 px-2"
                        style={{ width: `${slideWidth}vw` }}
                        onClick={() => !isActive && handleInteraction(index)}
                      >
                        <div className="relative w-full h-[500px] overflow-hidden bg-slate-100 shadow-sm">
                          {resolveNewsImage(actu.image) && (
                            <Image
                              src={resolveNewsImage(actu.image)!}
                              alt={actu.title}
                              fill
                              sizes="90vw"
                              className={`object-cover ${isActive ? "opacity-100" : "opacity-30"}`}
                              priority={
                                (index >= newsCount && index < newsCount * 2) ||
                                shouldPreload
                              }
                              quality={100}
                            />
                          )}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute bottom-12 left-24 right-24 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                              <div className="max-w-xl text-white">
                                <span className="text-blue-400 font-bold uppercase tracking-widest text-xs">{actu.subtitle}</span>
                                <h2 className="text-4xl md:text-5xl font-black mt-2 mb-4 leading-tight">{actu.title}</h2>
                                <p className="text-lg text-slate-200 font-medium line-clamp-2">{actu.description}</p>
                              </div>
                              <Link
                                href={actu.type === "article" ? `/articles/${actu.id}` : (actu.link ?? "#")}
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all"
                              >
                                {actu.buttonText}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-8">
                {newsItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleInteraction(i + newsCount)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex % newsCount ? "w-8 bg-slate-900" : "w-2 bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* ── Three schools ── */}
      <section className="py-20 bg-[#f5f5f7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-blue-500 font-bold uppercase tracking-widest text-xs text-center mb-3">Le Mesnil-Esnard · Seine-Maritime</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-4">Trois établissements, un seul esprit</h2>
          <p className="text-slate-500 text-center mb-14 max-w-2xl mx-auto leading-relaxed">
            De la maternelle à la terminale, un parcours guidé par les valeurs de Nicolas Barré : accueillir, instruire, éduquer chacun selon son génie propre.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                href: "/ecole",
                color: "bg-yellow-400 hover:bg-yellow-500",
                light: "bg-yellow-50",
                text: "text-yellow-600",
                label: "Maternelle & Élémentaire",
                title: "L'École",
                desc: "Un environnement familial et bienveillant où chaque enfant découvre le plaisir d'apprendre, dans la confiance et l'émerveillement.",
                cta: "Découvrir l'école →",
              },
              {
                href: "/college",
                color: "bg-blue-500 hover:bg-blue-600",
                light: "bg-blue-50",
                text: "text-blue-600",
                label: "De la 6ème à la 3ème",
                title: "Le Collège",
                desc: "Quatre années pour construire sa personnalité, choisir ses options et grandir dans un cadre exigeant et stimulant.",
                cta: "Découvrir le collège →",
              },
              {
                href: "/lycee",
                color: "bg-pink-500 hover:bg-pink-600",
                light: "bg-pink-50",
                text: "text-pink-600",
                label: "Général & Technologique",
                title: "Le Lycée",
                desc: "5 labels d'excellence, un internat de 125 places, des options rares — le lycée qui prépare à l'avenir avec ambition.",
                cta: "Découvrir le lycée →",
              },
            ].map(({ href, color, light, text, label, title, desc, cta }) => (
              <Link key={href} href={href} className="group rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                <div className={`${color} transition-colors px-6 py-8`}>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-xs mb-1">{label}</p>
                  <h3 className="text-4xl font-black text-white">{title}</h3>
                </div>
                <div className="px-6 py-6">
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">{desc}</p>
                  <span className={`font-bold text-sm ${text} group-hover:underline`}>{cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Valeurs ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center mb-3">Inspiré de Nicolas Barré · XVIIe siècle</p>
          <h2 className="text-4xl font-black text-slate-900 text-center mb-14">Notre projet éducatif</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: "🤝", title: "Accueillir", quote: "Sans distinction ni acception de personne", desc: "Chaque élève est reçu tel qu'il est, quels que soient ses talents ou ses difficultés." },
              { emoji: "💡", title: "Instruire", quote: "En éveillant l'intelligence et la curiosité", desc: "L'élève construit lui-même son savoir, développe sa capacité d'adaptation." },
              { emoji: "🌱", title: "Éduquer", quote: "Chacun doit porter le fruit de son espèce", desc: "Préparer à une vie d'adulte libre et responsable, en référence à des valeurs universelles." },
              { emoji: "🌍", title: "Ouvrir", quote: "La beauté de l'Univers est dans ses différences", desc: "Langues, sciences, culture, humanitaire, sport — une ouverture sur le monde dès le plus jeune âge." },
            ].map(({ emoji, title, quote, desc }) => (
              <div key={title} className="text-center p-6 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors">
                <span className="text-4xl">{emoji}</span>
                <h3 className="text-xl font-black text-slate-900 mt-4 mb-2">{title}</h3>
                <p className="text-xs text-blue-500 font-bold italic mb-3 leading-relaxed">&ldquo;{quote}&rdquo;</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key facts ── */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: "3 → 18 ans", l: "Maternelle à Terminale" },
            { n: "70 internes", l: "Internat mixte 6ème – Terminale" },
            { n: "Sous contrat", l: "Établissement catholique & État" },
            { n: "XVIIe siècle", l: "Fondé dans l'esprit de Nicolas Barré" },
          ].map(({ n, l }) => (
            <div key={n}>
              <p className="text-3xl font-black text-white">{n}</p>
              <p className="text-xs text-slate-400 mt-2">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Inscription ── */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Rejoignez La Providence</h2>
          <p className="text-blue-100 mb-10 max-w-lg mx-auto leading-relaxed">
            Les inscriptions sont ouvertes toute l&apos;année.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="https://preinscriptions.ecoledirecte.com/fr/?RNE=0761713Z" className="bg-white text-blue-600 font-black px-10 py-4 rounded-full hover:scale-105 transition-transform text-sm shadow-lg">
              S&apos;inscrire
            </Link>
            <a href="tel:0232865090" className="border-2 border-white text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition text-sm">
              02 32 86 50 90
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-center text-xs">
        <p className="font-bold text-slate-300 mb-2">Groupe Scolaire La Providence Nicolas Barré</p>
        <p>6 rue de Neuvillette · 76240 Le Mesnil-Esnard · 02 32 86 50 90</p>
        <div className="flex gap-6 justify-center mt-4">
          <Link href="/ecole" className="hover:text-white transition">École</Link>
          <Link href="/college" className="hover:text-white transition">Collège</Link>
          <Link href="/lycee" className="hover:text-white transition">Lycée</Link>
          <Link href="/https://preinscriptions.ecoledirecte.com/fr/?RNE=0761713Z" className="hover:text-white transition">Inscription</Link>
          <Link href="/dashboard" className="hover:text-white transition">Espace pro</Link>
        </div>
      </footer>
    </div>
  );
}