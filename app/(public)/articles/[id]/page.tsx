import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/app/components/Header/Header";
import type { NewsItem } from "@/app/api/news/get/route";

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

function parseInlineImage(line: string): { src: string; alt: string } | null {
  const trimmed = line.trim();
  const shortTag = trimmed.match(/^\[\[image:(.+)\]\]$/i);
  if (shortTag?.[1]) return { src: shortTag[1].trim(), alt: "Image article" };
  const markdown = trimmed.match(/^!\[(.*?)\]\((.+)\)$/);
  if (markdown?.[2]) return { src: markdown[2].trim(), alt: (markdown[1] || "Image article").trim() };
  return null;
}

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
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12">
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
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">{article.title}</h1>
        {article.description && (
          <p className="text-lg text-slate-500 mb-8 leading-relaxed border-l-4 border-blue-200 pl-4">{article.description}</p>
        )}
        {article.body ? (
          <div className="prose prose-slate max-w-none">
            {article.body.split("\n").map((line, i) => {
              const inline = parseInlineImage(line);
              if (inline) {
                const src = resolveNewsImage(inline.src);
                if (!src) return null;
                return (
                  <div key={i} className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 my-5">
                    <Image src={src} alt={inline.alt} fill sizes="(max-width: 1024px) 100vw, 768px" className="object-contain" />
                  </div>
                );
              }
              return line.trim() === "" ? (
                <br key={i} />
              ) : (
                <p key={i} className="text-slate-700 leading-relaxed mb-4">
                  {line}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 italic">Aucun contenu disponible pour cet article.</p>
        )}
        {article.images && article.images.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Galerie</h2>
            <div className="grid grid-cols-1  gap-4">
              {article.images.map((url, i) => {
                const src = resolveNewsImage(url);
                if (!src) return null;
                return (
                  <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <Image
                      src={src}
                      alt={`Photo ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 80vw"
                      className="object-contain"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
