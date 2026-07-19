"use client";

import { useState } from "react";
import { isPersonnelDropFile } from "@/app/lib/personnel-upload-client";

type Props = {
  title: string;
  hint: string;
  disabled?: boolean;
  onFile?: (file: File) => void | Promise<void>;
  onFiles?: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
};

export default function PersonnelDropZone({
  title,
  hint,
  disabled,
  onFile,
  onFiles,
  accept,
  multiple,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputId = "personnel-drop-zone-input";

  const handleOne = async (file: File | undefined) => {
    if (!file || disabled) return;
    if (!isPersonnelDropFile(file)) {
      alert("Format non supporté. Utilisez Excel (.xlsx, .xls), PDF ou Word.");
      return;
    }
    if (onFiles) await onFiles([file]);
    else if (onFile) await onFile(file);
  };

  const handleMany = async (list: FileList | undefined) => {
    if (!list?.length || disabled) return;
    const files = Array.from(list).filter(isPersonnelDropFile);
    if (files.length === 0) {
      alert("Format non supporté. Utilisez Excel (.xlsx, .xls), PDF ou Word.");
      return;
    }
    if (onFiles) await onFiles(files);
    else if (files[0]) await onFile?.(files[0]);
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
        if (multiple) void handleMany(e.dataTransfer.files);
        else void handleOne(e.dataTransfer.files?.[0]);
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
        multiple={multiple}
        onChange={(e) => {
          if (multiple) void handleMany(e.target.files ?? undefined);
          else void handleOne(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <p className="text-sm font-black text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-2">{hint}</p>
    </label>
  );
}
