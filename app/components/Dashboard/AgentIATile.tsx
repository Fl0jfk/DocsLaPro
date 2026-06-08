"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Categories } from "@/app/contexts/data";
import { stageDashboardUpload } from "@/app/lib/dashboard-upload-bridge";

function DropSlot({
  label,
  hint,
  badge,
  badgeClass,
  multiple,
  onFiles,
}: {
  label: string;
  hint: string;
  badge: string;
  badgeClass: string;
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
      className={`flex-1 min-h-[88px] rounded-xl border-2 border-dashed p-2 text-center transition cursor-pointer ${
        drag ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white/95 hover:border-violet-300"
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
      <span className={`inline-block mb-1 px-1.5 py-0.5 text-[9px] font-black uppercase rounded-full ${badgeClass}`}>
        {badge}
      </span>
      <p className="text-[11px] font-bold text-slate-800 leading-tight">{label}</p>
      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{hint}</p>
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
    <div className="bg-white border shadow-xs hover:shadow-lg border-gray-200 flex flex-col h-[350px] md:max-lg:h-[300px] sm:max-md:h-[450px] min-w-[250px] rounded-3xl m-3 relative overflow-hidden transition-transform duration-300 ease-in-out xl:hover:scale-[1.02]">
      <Link href={category.link} className="absolute inset-0 z-0 h-[55%]">
        <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/70 to-transparent z-[1] pointer-events-none" />
        {category.img && (
          <Image
            src={category.img}
            fill
            alt={category.name}
            sizes="35vw"
            priority={isPriorityImage}
            className="object-contain pointer-events-none"
          />
        )}
        <p className="absolute bottom-3 left-4 z-[2] text-xl font-bold text-white drop-shadow">
          {category.name}
        </p>
      </Link>

      <div className="relative z-[3] mt-auto p-3 pt-2 space-y-2 pointer-events-auto">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 text-center">
          Glisser-déposer un PDF
        </p>
        <div className="flex gap-2">
          <DropSlot
            badge="Unité"
            badgeClass="bg-blue-100 text-blue-800"
            label="PDF unité"
            hint="1 élève = 1 PDF"
            multiple
            onFiles={(files) => goWithFiles("standard", files)}
          />
          <DropSlot
            badge="Découpage"
            badgeClass="bg-violet-100 text-violet-800"
            label="Bloc PDF"
            hint="Export classe, découpe IA"
            onFiles={(files) => goWithFiles("class", files)}
          />
        </div>
      </div>
    </div>
  );
}
