"use client";

import Image from "next/image";
import type { ExternalQuickLink } from "@/app/contexts/data";

export default function ExternalQuickLinks({ links }: { links: ExternalQuickLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 mb-4 px-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1 hidden sm:inline">
        Accès rapides
      </span>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.link}
          target="_blank"
          rel="noopener noreferrer"
          title={link.name}
          className="group flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl px-2.5 py-1.5 transition-all"
        >
          <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
            <Image src={link.img} alt="" fill sizes="28px" className="object-contain p-0.5" />
          </div>
          <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700 max-w-[120px] truncate hidden md:inline">
            {link.name}
          </span>
        </a>
      ))}
    </div>
  );
}
