import type { RgpdEntPresetId } from "@/app/lib/rgpd-types";

export const RGPD_ENT_PRESETS: Record<
  RgpdEntPresetId,
  { label: string; products: string; editor: string }
> = {
  charlemagne_ecoledirecte: {
    label: "Charlemagne & ÉcoleDirecte (Aplim)",
    products: "Charlemagne & ÉcoleDirecte",
    editor: "Aplim",
  },
  pronote: {
    label: "Pronote (Index Éducation)",
    products: "Pronote",
    editor: "Index Éducation",
  },
  ecole_directe: {
    label: "École Directe (Index Éducation)",
    products: "École Directe",
    editor: "Index Éducation",
  },
  autre: {
    label: "Autre logiciel ou ENT",
    products: "",
    editor: "",
  },
};

export function applyRgpdEntPreset(preset: RgpdEntPresetId) {
  const p = RGPD_ENT_PRESETS[preset];
  return {
    entPreset: preset,
    entProducts: p.products,
    entEditor: p.editor,
    entName: p.products,
  };
}
