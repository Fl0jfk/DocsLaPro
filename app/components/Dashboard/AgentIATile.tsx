"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Categories } from "@/app/contexts/data";
import { stageDashboardUpload } from "@/app/lib/dashboard-upload-bridge";
import {
  DASHBOARD_ENTER_CTA,
  DASHBOARD_ROW_SHELL,
} from "@/app/lib/dashboard-theme";

function DropSlot({
  label,
  hint,
  badge,
  multiple,
  onFiles,
}: {
  label: string;
  hint: string;
  badge: string;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
}) {
  const [drag, setDrag] = useState(false);
  const inputId = `agent-drop-${badge.replace(/\s+/g, "-").toLowerCase()}`;
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
        e.stopPropagation();
        setDrag(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      className={`min-h-[4.5rem] flex-1 cursor-pointer rounded-xl border-2 border-dashed p-2 text-center transition ${
        drag
          ? "border-[var(--dash-bright)] bg-[color:var(--dash-soft-muted)]"
          : "border-[color:var(--dash-border)]/80 bg-white/80 hover:border-[color:var(--dash-primary)]/35"
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="mb-1 inline-block rounded-full bg-[color:var(--dash-soft)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--dash-primary)]">
        {badge}
      </span>
      <p className="text-[11px] font-bold leading-tight text-[#14231A]">{label}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-stone-500">{hint}</p>
    </div>
  );
}

export default function AgentIATile({ category, priority }: { category: Categories; priority?: boolean }) {
  const router = useRouter();
  const isPriorityImage = priority || category.img.includes("reservationsalle.jpg");

  const goWithFiles = (mode: "standard" | "class", files: FileList) => {
    if (!stageDashboardUpload(mode, files)) return;
    router.push("/agentIAOCR?from=dashboard");
  };

  return (
    <div className={`${DASHBOARD_ROW_SHELL} flex-col`}>
      <div className="flex min-h-[6.5rem] flex-row">
        <Link
          href={category.link}
          className="relative w-24 shrink-0 overflow-hidden bg-[color:var(--dash-soft)]/50 sm:w-28"
        >
          {category.img ? (
            <Image
              src={category.img}
              alt=""
              fill
              sizes="112px"
              priority={isPriorityImage}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
          <Link
            href={category.link}
            className="text-base font-black text-[#14231A] transition hover:text-[var(--dash-primary)] sm:text-lg"
          >
            {category.name}
          </Link>
          <p className="text-xs text-stone-500">Déposez un PDF pour lancer l&apos;OCR directement</p>
        </div>
        <div className="flex shrink-0 items-center p-3 sm:pl-0">
          <Link href={category.link} className={DASHBOARD_ENTER_CTA}>
            Ouvrir <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <div className="flex gap-2 border-t border-[color:var(--dash-border)]/80 bg-[color:var(--dash-soft-muted)]/25 p-3">
        <DropSlot
          badge="Unité"
          label="PDF unité"
          hint="1 élève = 1 PDF"
          multiple
          onFiles={(files) => goWithFiles("standard", files)}
        />
        <DropSlot
          badge="Découpage"
          label="Bloc PDF"
          hint="Export classe, découpe IA"
          onFiles={(files) => goWithFiles("class", files)}
        />
      </div>
    </div>
  );
}
