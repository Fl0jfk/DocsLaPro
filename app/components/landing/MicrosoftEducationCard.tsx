"use client";

import Image from "next/image";
import { useState } from "react";
import { MICROSOFT_PRICING_NOTE } from "@/app/lib/marketing-site";

/**
 * Encart licences Microsoft Éducation + badge Microsoft Partner Program.
 * Déposez le badge officiel (Partner Center → Logo Builder) dans
 * public/partners/microsoft-partner.png
 */
export default function MicrosoftEducationCard() {
  const [badgeOk, setBadgeOk] = useState(true);
  const note = MICROSOFT_PRICING_NOTE;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#0078D4]/25 bg-gradient-to-br from-[#F3F9FD] via-white to-amber-50/40 shadow-sm">
      <div className="flex flex-col gap-5 px-5 py-5 md:flex-row md:items-start md:gap-8 md:px-8 md:py-6">
        <div className="flex shrink-0 flex-col items-center gap-2 md:w-[140px]">
          <div className="flex h-[88px] w-full max-w-[140px] items-center justify-center rounded-xl border border-[#0078D4]/20 bg-white px-2 shadow-sm">
            {badgeOk ? (
              <Image
                src={note.partnerLogoPath}
                alt="Badge Microsoft Partner Program"
                width={120}
                height={80}
                className="h-16 w-auto max-w-full object-contain"
                unoptimized={note.partnerLogoPath.endsWith(".svg")}
                onError={() => setBadgeOk(false)}
              />
            ) : (
              <div className="px-1 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0078D4]">
                  Microsoft
                </p>
                <p className="mt-0.5 text-[11px] font-black leading-tight text-[#14231A]">
                  Partner
                </p>
                <p className="mt-1 text-[9px] text-stone-500">Program</p>
              </div>
            )}
          </div>
          <p className="text-center text-[10px] font-semibold leading-snug text-[#0078D4]">
            {note.partnerBadgeLabel}
          </p>
        </div>

        <div className="min-w-0 flex-1 border-t border-[#0078D4]/15 pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0078D4]">
            {note.eyebrow}
          </p>
          <h2 className="mt-1 text-base font-black text-[#14231A] md:text-lg">{note.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{note.intro}</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[#1B4F72]">{note.partnerNote}</p>
          <ul className="mt-3 space-y-2">
            {note.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-stone-700">
                <span className="mt-0.5 shrink-0 font-bold text-[#0078D4]">→</span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">{note.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
