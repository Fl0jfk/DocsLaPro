"use client";

import { useMemo, useState } from "react";
import {
  FOURNITURES_PROFILES,
  getDefaultProfileSections,
  getMergedProfileSections,
  profileHasOverride,
} from "@/app/lib/fournitures-profiles";
import type { FournituresSection, FournituresToolConfig } from "@/app/lib/fournitures-types";

type StageFilter = "ecole" | "college" | "lycee";

type Props = {
  config: FournituresToolConfig;
  onChange: (patch: Partial<FournituresToolConfig>) => void;
};

function emptySection(): FournituresSection {
  return { title: "Nouvelle rubrique", items: [] };
}

type PdfField = "colbertPdfUrl" | "arbsPdfUrl";

function FournituresPdfField({
  label,
  hint,
  value,
  field,
  uploading,
  onUpload,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  field: PdfField;
  uploading: boolean;
  onUpload: (field: PdfField, file: File) => void;
  onChange: (url: string) => void;
}) {
  const trimmed = value.trim();
  return (
    <label className="block sm:col-span-2">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          className="min-w-[12rem] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… (ou chargez un PDF ci-contre)"
        />
        <label className="cursor-pointer shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
          {uploading ? "Envoi…" : "📎 Charger PDF"}
          <input
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(field, file);
              e.target.value = "";
            }}
          />
        </label>
        {trimmed ? (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold text-blue-600 underline"
          >
            Voir →
          </a>
        ) : null}
      </div>
    </label>
  );
}

export default function FournituresEditor({ config, onChange }: Props) {
  const [uploadingField, setUploadingField] = useState<PdfField | null>(null);
  const [stage, setStage] = useState<StageFilter>("ecole");
  const profilesInStage = useMemo(
    () => FOURNITURES_PROFILES.filter((p) => p.stage === stage),
    [stage],
  );
  const [selectedId, setSelectedId] = useState<string>(FOURNITURES_PROFILES[0]?.id ?? "");

  const activeId = profilesInStage.some((p) => p.id === selectedId)
    ? selectedId
    : (profilesInStage[0]?.id ?? selectedId);
  const activeMeta = FOURNITURES_PROFILES.find((p) => p.id === activeId);
  const sections = getMergedProfileSections(activeId, config.profiles);
  const isCustom = profileHasOverride(activeId, config.profiles);

  function setProfileSections(profileId: string, next: FournituresSection[]) {
    onChange({
      profiles: {
        ...config.profiles,
        [profileId]: next,
      },
    });
  }

  function resetProfile(profileId: string) {
    const next = { ...config.profiles };
    delete next[profileId];
    onChange({ profiles: next });
  }

  function updateSection(sectionIdx: number, patch: Partial<FournituresSection>) {
    const next = sections.map((s, i) => (i === sectionIdx ? { ...s, ...patch } : s));
    setProfileSections(activeId, next);
  }

  function updateItem(sectionIdx: number, itemIdx: number, value: string) {
    const next = sections.map((s, si) => {
      if (si !== sectionIdx) return s;
      return { ...s, items: s.items.map((it, ii) => (ii === itemIdx ? value : it)) };
    });
    setProfileSections(activeId, next);
  }

  function addSection() {
    setProfileSections(activeId, [...sections, emptySection()]);
  }

  function removeSection(sectionIdx: number) {
    setProfileSections(
      activeId,
      sections.filter((_, i) => i !== sectionIdx),
    );
  }

  function addItem(sectionIdx: number) {
    const next = sections.map((s, si) => (si === sectionIdx ? { ...s, items: [...s.items, ""] } : s));
    setProfileSections(activeId, next);
  }

  function removeItem(sectionIdx: number, itemIdx: number) {
    const next = sections.map((s, si) =>
      si === sectionIdx ? { ...s, items: s.items.filter((_, ii) => ii !== itemIdx) } : s,
    );
    setProfileSections(activeId, next);
  }

  async function uploadPdf(field: PdfField, file: File) {
    const kind = field === "colbertPdfUrl" ? "colbert" : "arbs";
    setUploadingField(field);
    try {
      const res = await fetch("/api/toolbox/fournitures/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/pdf",
          kind,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload impossible");

      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!put.ok) throw new Error("Envoi du fichier vers S3 échoué");

      onChange({ [field]: data.fileUrl as string });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <div className="space-y-6 border-t border-slate-100 pt-6">
      <div>
        <h3 className="text-lg font-black text-slate-900">Listes par classe</h3>
        <p className="mt-1 text-sm text-slate-500">
          Modifiez les fournitures classe par classe. Les changements sont publiés sur{" "}
          <span className="font-semibold">/simulateurFournitures</span> après enregistrement.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase text-slate-500">Titre page</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={config.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-slate-500">Année scolaire</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={config.schoolYear}
            onChange={(e) => onChange({ schoolYear: e.target.value })}
          />
        </label>
        <FournituresPdfField
          label="PDF Colbert (optionnel)"
          hint="Flyer librairie Colbert — lien HTTPS affiché aux familles."
          value={config.colbertPdfUrl || ""}
          field="colbertPdfUrl"
          uploading={uploadingField === "colbertPdfUrl"}
          onUpload={uploadPdf}
          onChange={(url) => onChange({ colbertPdfUrl: url })}
        />
        <FournituresPdfField
          label="Lien ARBS location manuels (optionnel)"
          hint="Flyer ARBS — location de manuels scolaires (lycée)."
          value={config.arbsPdfUrl || ""}
          field="arbsPdfUrl"
          uploading={uploadingField === "arbsPdfUrl"}
          onUpload={uploadPdf}
          onChange={(url) => onChange({ arbsPdfUrl: url })}
        />
      </div>

      <nav className="flex flex-wrap gap-2">
        {(["ecole", "college", "lycee"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStage(s);
              const first = FOURNITURES_PROFILES.find((p) => p.stage === s);
              if (first) setSelectedId(first.id);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              stage === s ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s === "ecole" ? "École" : s === "college" ? "Collège" : "Lycée"}
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap gap-2">
        {profilesInStage.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              activeId === p.id
                ? "bg-slate-900 text-white"
                : profileHasOverride(p.id, config.profiles)
                  ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activeMeta && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900">{activeMeta.label}</h4>
              {activeMeta.hint && <p className="mt-1 text-xs text-slate-500">{activeMeta.hint}</p>}
              {isCustom && (
                <p className="mt-1 text-xs font-semibold text-emerald-700">Liste personnalisée (différente du défaut)</p>
              )}
            </div>
            <div className="flex gap-2">
              {isCustom && (
                <button
                  type="button"
                  onClick={() => resetProfile(activeId)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Réinitialiser
                </button>
              )}
              <button
                type="button"
                onClick={() => setProfileSections(activeId, getDefaultProfileSections(activeId))}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white"
              >
                Charger le modèle par défaut
              </button>
            </div>
          </div>

          {sections.map((section, sectionIdx) => (
            <div key={`${activeId}-${sectionIdx}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
                  value={section.title}
                  onChange={(e) => updateSection(sectionIdx, { title: e.target.value })}
                  placeholder="Titre de la rubrique"
                />
                <button
                  type="button"
                  onClick={() => removeSection(sectionIdx)}
                  className="text-xs font-bold text-rose-600"
                >
                  Supprimer
                </button>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={item}
                      onChange={(e) => updateItem(sectionIdx, itemIdx, e.target.value)}
                      placeholder="Élément de la liste"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(sectionIdx, itemIdx)}
                      className="shrink-0 text-xs font-bold text-rose-600 px-2"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => addItem(sectionIdx)}
                className="text-xs font-bold text-emerald-700"
              >
                + Ajouter un élément
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
          >
            + Ajouter une rubrique
          </button>
        </div>
      )}
    </div>
  );
}
