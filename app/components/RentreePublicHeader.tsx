"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Logo from "../../public/Logo header.png";

const NAV = [
  { href: "/rentree", label: "Rentrée" },
  { href: "/simulateurTarifs", label: "Simulateur tarifs" },
  { href: "/simulateurFournitures", label: "Simulateur fournitures" },
];

type SitePublicIdentity = {
  name?: string;
  shortName?: string;
  headerLogoUrl?: string | null;
};

export default function RentreePublicHeader() {
  const pathname = usePathname();
  const [siteIdentity, setSiteIdentity] = useState<SitePublicIdentity | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/site/public", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok) setSiteIdentity(data);
      } catch {
        /* logo par défaut */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const logoAlt = siteIdentity?.shortName || siteIdentity?.name || "La Providence Nicolas Barré";
  const customLogoUrl = siteIdentity?.headerLogoUrl?.trim() || "";

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/rentree" className="hover:opacity-75 transition flex-shrink-0 relative">
          <div className="w-[110px] h-[110px]">
            {customLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customLogoUrl}
                alt={logoAlt}
                className="absolute top-7 left-[-20px] sm:left-0 max-h-[80px] w-auto object-contain [image-rendering:auto]"
              />
            ) : (
              <Image src={Logo} alt={logoAlt} width={300} height={300} className="absolute top-7 left-[-20px] sm:left-0" />
            )}
          </div>
        </Link>

        <nav className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`py-1 transition-colors hover:text-blue-600 ${active ? "text-blue-600" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/sign-in"
          className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
        >
          Espace personnel
        </Link>
      </div>
    </header>
  );
}
