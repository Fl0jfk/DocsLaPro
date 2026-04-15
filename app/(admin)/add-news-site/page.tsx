"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import type { NewsItem, NewsCategory } from "@/app/api/news/get/route";

const CATEGORIES: { value: NewsCategory; label: string; color: string }[] = [
  { value: "groupe",  label: "Groupe scolaire", color: "bg-indigo-100 text-indigo-700" },
  { value: "école",   label: "École",           color: "bg-yellow-100 text-yellow-700" },
  { value: "collège", label: "Collège",         color: "bg-blue-100 text-blue-700" },
  { value: "lycée",   label: "Lycée",           color: "bg-pink-100 text-pink-700" },
];

const categoryColor = (cat?: string) =>
  CATEGORIES.find((c) => c.value === cat)?.color ?? "bg-slate-100 text-slate-500";

const createEmptyItem = (): NewsItem => ({
  id: `news-${Date.now()}`,
  type: "article",
  category: "collège",
  title: "",
  subtitle: "",
  description: "",
  body: "",
  image: "",
  images: [],
  buttonText: "En savoir plus",
  textColor: "white",
  buttonStyle: "light",
  imageFit: "cover",
});

async function uploadImageToS3(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/news/upload-image", { method: "POST", body: formData });
  if (!res.ok) throw new Error(await res.text());
  const { fileUrl } = await res.json();
  return fileUrl as string;
}

function NewsCard({ item, index, isExpanded, onToggle, onRemove, onMoveUp, onMoveDown, onUpdate, onUploadMain, onAddGallery, onRemoveGallery, uploading}: {
  item: NewsItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (patch: Partial<NewsItem>) => void;
  onUploadMain: (file: File) => void;
  onAddGallery: (file: File) => void;
  onRemoveGallery: (idx: number) => void;
  uploading: boolean;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`rounded-2xl border transition-all ${isExpanded ? "border-indigo-200 shadow-md" : "border-slate-100 hover:border-slate-200"} bg-white overflow-hidden`}>
      <div className="flex items-center gap-3 p-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
          {item.image ? (
            <Image src={item.image} alt="" width={100} height={100} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl">🖼</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ item.type === "article" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
              {item.type === "article" ? "Article" : "Lien"}
            </span>
            {item.category && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColor(item.category)}`}>
                {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
              </span>
            )}
            <span className="text-xs text-slate-400">#{index + 1}</span>
          </div>
          <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
            {item.title || <span className="text-slate-400 font-normal italic">Sans titre</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 text-xs" onClick={onMoveUp} title="Monter">↑</button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 text-xs" onClick={onMoveDown} title="Descendre">↓</button>
          <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 text-xs" onClick={onRemove} title="Supprimer">✕</button>
          <span className={`ml-1 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          <div className="flex gap-2">
            <button type="button"
              onClick={() => onUpdate({ type: "article", link: undefined })}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${
                item.type === "article" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}>
              Article (page générée)
            </button>
            <button type="button"
              onClick={() => onUpdate({ type: "lien", category: undefined, body: undefined, images: [] })}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${
                item.type === "lien" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
              }`}>
              Lien interne
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-600">Titre <span className="text-red-400">*</span></label>
              <input className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="ex : Journée Portes Ouvertes"
                value={item.title}
                onChange={(e) => onUpdate({ title: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-600">Sous-titre</label>
              <input className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="ex : Ce samedi à La Providence"
                value={item.subtitle}
                onChange={(e) => onUpdate({ subtitle: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-600">Texte du bouton <span className="text-red-400">*</span></label>
              <input className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder={`ex : "En savoir plus" ou "S'inscrire"`}
                value={item.buttonText}
                onChange={(e) => onUpdate({ buttonText: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-600">Couleur du texte (slider)</label>
              <select
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={item.textColor ?? "white"}
                onChange={(e) => onUpdate({ textColor: e.target.value as "white" | "black" })}
              >
                <option value="white">Blanc</option>
                <option value="black">Noir</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-600">Style du bouton</label>
              <select
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={item.buttonStyle ?? "light"}
                onChange={(e) => onUpdate({ buttonStyle: e.target.value as "light" | "dark" })}
              >
                <option value="light">Noir sur blanc</option>
                <option value="dark">Blanc sur noir</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-600">Ajustement de l&apos;image</label>
              <select
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={item.imageFit ?? "cover"}
                onChange={(e) => onUpdate({ imageFit: e.target.value as "cover" | "contain" })}
              >
                <option value="cover">Remplir (object-cover)</option>
                <option value="contain">Contenir (object-contain)</option>
              </select>
            </div>
            {item.type === "lien" && (
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-600">Lien <span className="text-red-400">*</span></label>
                <input className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="ex : /portesouvertes"
                  value={item.link ?? ""}
                  onChange={(e) => onUpdate({ link: e.target.value })} />
              </div>
            )}
            {item.type === "article" && (
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-600">Établissement</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={item.category ?? ""}
                  onChange={(e) => onUpdate({ category: (e.target.value as NewsCategory) || undefined })}>
                  <option value="">— Aucun —</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1 text-slate-600">Description (accroche slider)</label>
              <textarea className="w-full p-2.5 rounded-xl border border-slate-200 text-sm min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Courte description visible sur le slider…"
                value={item.description}
                onChange={(e) => onUpdate({ description: e.target.value })} />
            </div>
            {item.type === "article" && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1 text-slate-600">Contenu de l&apos;article</label>
                <textarea className="w-full p-2.5 rounded-xl border border-slate-200 text-sm min-h-[140px] resize-y font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Rédigez le contenu complet de l'article ici…"
                  value={item.body ?? ""}
                  onChange={(e) => onUpdate({ body: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">Lien du bouton : <code>/articles/{item.id}</code></p>
                <p className="text-xs text-slate-400 mt-1">
                  Image dans le texte : <code>[[image:https://...]]</code> (ou format markdown <code>![alt](https://...)</code>) sur une ligne seule.
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-600">Image principale (slider)</label>
            <div className="flex items-start gap-3">
              {item.image && (
                <Image src={item.image} alt="" width={100} height={100} className="h-20 w-32 object-cover rounded-xl border border-slate-100 flex-shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <input className="w-full p-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="https://... ou /image.png"
                  value={item.image}
                  onChange={(e) => onUpdate({ image: e.target.value })} />
                <div className="flex items-center gap-2">
                  <button type="button"
                    disabled={uploading}
                    onClick={() => mainRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 disabled:opacity-50 transition">
                    {uploading ? "Upload…" : "📁 Choisir une image"}
                  </button>
                  <input ref={mainRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadMain(f); e.target.value = ""; }} />
                </div>
              </div>
            </div>
          </div>
          {item.type === "article" && (
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-600">Images supplémentaires (galerie article)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(item.images ?? []).map((url, gi) => (
                  <div key={gi} className="relative group">
                    <Image src={url} alt="" width={100} height={100} className="h-20 w-28 object-cover rounded-xl border border-slate-100" />
                    <button
                      type="button"
                      onClick={() => onRemoveGallery(gi)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button"
                  disabled={uploading}
                  onClick={() => galleryRef.current?.click()}
                  className="h-20 w-28 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition disabled:opacity-50 text-2xl">
                  +
                </button>
                <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onAddGallery(f); e.target.value = ""; }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddNewsSitePage() {
  const { user, isLoaded } = useUser();
  const roles = ((user?.publicMetadata?.role as string[]) || []) as string[];
  const canManageNews = useMemo(() =>
      roles.includes("administratif") || roles.includes("comptabilite") ||
      roles.includes("comptabilité") || roles.includes("education") ||
      roles.includes("maintenance") || roles.some((r) => r.startsWith("direction_")),
    [roles]
  );
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/news/get?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur chargement des news");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isLoaded && canManageNews) loadNews();
    else if (isLoaded) setLoading(false);
  }, [isLoaded, canManageNews]);
  const updateItem = (id: string, patch: Partial<NewsItem>) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (expandedId === id) setExpandedId(null);
  };
  const moveItem = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };
  const addNew = () => {
    const item = createEmptyItem();
    setItems((prev) => [...prev, item]);
    setExpandedId(item.id);
    setTimeout(() => document.getElementById(`card-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };
  const uploadMain = async (id: string, file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageToS3(file);
      updateItem(id, { image: url });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur upload");
    } finally { setUploading(false);
    }
  };
  const addGalleryImage = async (id: string, file: File) => {
    setUploading(true);
    try {
      const url = await uploadImageToS3(file);
      setItems((prev) =>
        prev.map((it) => it.id === id ? { ...it, images: [...(it.images ?? []), url] } : it)
      );
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur upload galerie");
    } finally { setUploading(false);
    }
  };
  const removeGalleryImage = (id: string, gi: number) => {
    setItems((prev) =>
      prev.map((it) => it.id === id ? { ...it, images: (it.images ?? []).filter((_, i) => i !== gi) } : it)
    );
  };
  const saveAll = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const valid = items.filter((it) => it.id && it.title && it.buttonText);
      if (valid.length === 0) { setError("Aucune news valide (titre et texte bouton requis)."); return; }
      const res = await fetch("/api/news/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: valid }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadNews();
      setExpandedId(null);
      setStatus(`${valid.length} news enregistrée(s) avec succès.`);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3500);
    }
  };
  if (!isLoaded || loading) return (
    <main className="max-w-4xl mx-auto p-8">
      <p className="text-sm text-slate-500">Chargement des news...</p>
    </main>
  );
  if (!canManageNews) return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center">
        <p className="font-bold text-slate-700">Accès restreint</p>
        <p className="text-sm text-slate-500 mt-2">Vous n&apos;avez pas les droits pour gérer les news.</p>
      </div>
    </main>
  );
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-5">
      <section className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Ajout d'actualités sur le site</h1>
            <p className="text-sm text-slate-500 mt-1">{items.length} actualité{items.length > 1 ? "s" : ""} · seules les 10 dernières sont affichées sur le slider.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
              onClick={addNew}>
              + Nouvelle news
            </button>
            <button type="button"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              onClick={saveAll}
              disabled={saving || uploading}>
              {saving ? "Enregistrement..." : "Enregistrer tout"}
            </button>
          </div>
        </div>
        {error  && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
        {status && <p className="mt-3 text-sm font-bold text-emerald-600">{status}</p>}
        {uploading && <p className="mt-3 text-sm text-slate-500">Upload image en cours…</p>}
      </section>
      <section className="space-y-2">
        {items.map((item, idx) => (
          <div id={`card-${item.id}`} key={item.id}>
            <NewsCard
              item={item}
              index={idx}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onRemove={() => removeItem(item.id)}
              onMoveUp={() => moveItem(item.id, -1)}
              onMoveDown={() => moveItem(item.id, 1)}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onUploadMain={(file) => uploadMain(item.id, file)}
              onAddGallery={(file) => addGalleryImage(item.id, file)}
              onRemoveGallery={(gi) => removeGalleryImage(item.id, gi)}
              uploading={uploading}
            />
          </div>
        ))}
        {items.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-500 text-sm">
            Aucune news pour le moment. Cliquez sur &quot;+ Nouvelle news&quot;.
          </div>
        )}
      </section>
    </main>
  );
}
