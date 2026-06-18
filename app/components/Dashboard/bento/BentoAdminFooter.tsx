"use client";

import Link from "next/link";
import { useIsOrgAdmin } from "@/app/hooks/useIsOrgAdmin";
import { dash } from "@/app/lib/dashboard-brand";

const ADMIN_LINKS = [
  { href: "/parametres", label: "Paramètres généraux" },
  { href: "/membres", label: "Utilisateurs" },
] as const;

export default function BentoAdminFooter() {
  const isOrgAdmin = useIsOrgAdmin();
  if (!isOrgAdmin) return null;

  return (
    <footer
      className={`mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t pt-5 text-[11px] font-semibold text-stone-400 ${dash.border}`}
    >
      {ADMIN_LINKS.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-3">
          {index > 0 ? <span aria-hidden className="text-stone-300">·</span> : null}
          <Link href={link.href} className={`transition ${dash.hoverPrimary}`}>
            {link.label}
          </Link>
        </span>
      ))}
    </footer>
  );
}
