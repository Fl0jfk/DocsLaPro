"use client";

import { useState } from "react";
import { isPersonnelDropFile } from "@/app/lib/personnel-upload-client";

type Props = {
  title: string;
  hint: string;
  disabled?: boolean;
  onFile: (file: File) => void | Promise<void>;
  accept?: string;
};

export default function PersonnelDropZone({ title, hint, disabled, onFile, accept }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputId = "personnel-drop-zone-input";

  const handleFiles = async (file: File | undefined) => {
    if (!file || disabled) return;
    if (!isPersonnelDropFile(file)) {
      alert("Format non supporté. Utilisez Excel (.xlsx, .xls), PDF ou Word.");
      return;
    }
    await onFile(file);
  };

  return (
    <label
      htmlFor={inputId}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (disabled) return;
        void handleFiles(e.dataTransfer.files?.[0]);
      }}
      className={[
        "block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors",
        dragOver ? "border-indigo-500 bg-indigo-50/70" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <input
        id={inputId}
        type="file"
        className="hidden"
        disabled={disabled}
        accept={accept}
        onChange={(e) => {
          void handleFiles(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <p className="text-sm font-black text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-2">{hint}</p>
    </label>
  );
}
