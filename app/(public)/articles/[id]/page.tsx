import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { NewsItem } from "@/app/api/news/get/route";

// docslaproimage is public — use directly. docslapro (private) needs the proxy.
function resolveNewsImage(url: string): string | null {
  if (!url || !url.trim()) return null;
  if (url.includes("docslapro.s3.") && !url.includes("docslaproimage.s3.")) {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${base}/api/news/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const CATEGORY_COLORS: Record<string, string> = {
  groupe: "bg-indigo-100 text-indigo-700",
  école: "bg-yellow-100 text-yellow-700",
  collège: "bg-blue-100 text-blue-700",
  lycée: "bg-pink-100 text-pink-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  groupe: "Groupe scolaire",
  école: "École",
  collège: "Collège",
  lycée: "Lycée",
};

async function getArticle(id: string): Promise<NewsItem | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/news/get`, { cache: "no-store" });
    if (!res.ok) return null;
    const items: NewsItem[] = await res.json();
    return items.find((it) => it.id === id && it.type === "article") ?? null;
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  const categoryColor = article.category ? (CATEGORY_COLORS[article.category] ?? "bg-slate-100 text-slate-600") : null;

  return (
    <div className="bg-[#f5f5f7] min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between text-sm font-medium text-slate-600">
          <Link href="/" className="hover:opacity-80 transition font-black text-slate-800">
            ← Accueil
          </Link>
          <div className="flex gap-8">
            <Link href="/ecole" className="hover:text-yellow-600 transition-colors">École</Link>
            <Link href="/college" className="hover:text-blue-400 transition-colors">Collège</Link>
            <Link href="/lycee" className="hover:text-pink-600 transition-colors">Lycée</Link>
          </div>
          <Link href="/dashboard" className="flex items-center justify-center bg-slate-100 text-slate-600 w-10 h-10 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero image */}
        {resolveNewsImage(article.image) && (
          <div className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-md">
            <Image
              src={resolveNewsImage(article.image)!}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Category + subtitle */}
        <div className="flex items-center gap-3 mb-4">
          {categoryColor && article.category && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${categoryColor}`}>
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
          )}
          {article.subtitle && (
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">
              {article.subtitle}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
          {article.title}
        </h1>

        {/* Description */}
        {article.description && (
          <p className="text-lg text-slate-500 mb-8 leading-relaxed border-l-4 border-blue-200 pl-4">
            {article.description}
          </p>
        )}

        {/* Body */}
        {article.body ? (
          <div className="prose prose-slate max-w-none">
            {article.body.split("\n").map((line, i) =>
              line.trim() === "" ? (
                <br key={i} />
              ) : (
                <p key={i} className="text-slate-700 leading-relaxed mb-4">
                  {line}
                </p>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-400 italic">Aucun contenu disponible pour cet article.</p>
        )}

        {/* Gallery */}
        {article.images && article.images.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Galerie</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {article.images.map((url, i) => {
                const src = resolveNewsImage(url);
                if (!src) return null;
                return (
                  <div key={i} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
                    <Image src={src} alt={`Photo ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
