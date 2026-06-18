"use client";

import { useCallback, useId, useState } from "react";

type Props = {
  onFiles: (files: FileList) => void | Promise<void>;
  compact?: boolean;
  label?: string;
};

export default function BentoDropZone({ onFiles, compact, label }: Props) {
  const inputId = useId();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!files.length || busy) return;
      setBusy(true);
      try {
        await onFiles(files);
      } finally {
        setBusy(false);
      }
    },
    [busy, onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => document.getElementById(inputId)?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") document.getElementById(inputId)?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition ${
        compact ? "min-h-[3.25rem] px-2 py-2" : "min-h-[4.5rem] px-3 py-3"
      } ${
        drag
          ? "border-[var(--dash-bright)] bg-[color:var(--dash-soft-muted)]"
          : "border-[color:var(--dash-border)]/90 bg-[color:var(--dash-soft-muted)]/30 hover:border-[color:var(--dash-primary)]/35"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        id={inputId}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-[11px] font-bold text-[var(--dash-primary)]">
        {busy ? "Envoi…" : label ?? "Glisser des fichiers ici"}
      </p>
      {!compact ? (
        <p className="mt-0.5 text-[10px] text-stone-500">Déposés dans votre cloud personnel</p>
      ) : null}
    </div>
  );
}
