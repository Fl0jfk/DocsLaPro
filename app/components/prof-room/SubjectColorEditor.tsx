"use client";

import {
  isHexSubjectColor,
  isPresetSubjectColor,
  PROF_ROOM_COLOR_PRESETS,
  subjectColorToHex,
} from "@/app/lib/prof-room-subject-colors";
import SubjectColorBadge from "./SubjectColorBadge";

const CUSTOM_VALUE = "__custom__";

export default function SubjectColorEditor({
  label,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onRemove?: () => void;
}) {
  const selectValue = isPresetSubjectColor(value) ? value : CUSTOM_VALUE;
  const hex = subjectColorToHex(value);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <SubjectColorBadge label={label} colorValue={value} />
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CUSTOM_VALUE) {
            if (!isHexSubjectColor(value)) onChange(hex);
            return;
          }
          onChange(v);
        }}
        className="border rounded-lg p-2 text-sm font-bold flex-1 min-w-[140px]"
      >
        {PROF_ROOM_COLOR_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Couleur personnalisée</option>
      </select>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
          title="Choisir une couleur"
        />
        {isHexSubjectColor(value) ? value.toUpperCase() : "Personnalisée"}
      </label>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-red-600 text-xs font-bold">
          Supprimer
        </button>
      )}
    </div>
  );
}
