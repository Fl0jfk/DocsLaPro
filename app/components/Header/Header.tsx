"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSignOutWithPortalReset } from "@/app/hooks/useSignOutWithPortalReset";
import { useAdminBootstrap } from "@/app/contexts/admin-bootstrap";
import { dashboardBrandCssVars, parseDashboardAccent } from "@/app/lib/dashboard-brand-presets";
import { SCOLA_HEADER_ACCENT } from "@/app/lib/marketing-theme";
import Logo from "../../../public/Logo header.png";

const MOBILE_MODULE_LINKS = [
  { href: "/documents", label: "Mes documents", icon: "📁" },
  { href: "/requests?nouvelle=1", label: "Faire une demande", icon: "📋" },
  { href: "/prof-room?new=1", label: "Faire une réservation de salle", icon: "🏫" },
  { href: "/rh?tab=absences&view=se-declarer#nouvelle-absence", label: "Déclarer une absence", icon: "📅" },
] as const;

function UserPopover({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const signOutWithPortalReset = useSignOutWithPortalReset();
  return (
    <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in">
      <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-100">
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName ?? ""} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-black text-sm">
            {(user?.firstName?.[0] ?? "?").toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{user?.fullName ?? user?.username ?? "—"}</p>
          <p className="text-xs text-slate-400 truncate">{user?.primaryEmailAddress?.emailAddress ?? user?.username ?? ""}</p>
        </div>
      </div>
      <div className="p-2 flex flex-col gap-0.5">
        <button
          onClick={() => { openUserProfile(); onClose(); }}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
        >
          <span className="text-base">⚙️</span> Modifier mon profil
        </button>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
        >
          <span className="text-base">🏠</span> Tableau de bord
        </Link>
        <div className="h-px bg-slate-100 my-1" />
        <button
          onClick={() => { signOutWithPortalReset("/"); onClose(); }}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm text-red-500 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { openUserProfile } = useClerk();
  const signOutWithPortalReset = useSignOutWithPortalReset();
  const { appContext, sitePublic: siteIdentity, loading: bootstrapLoading } = useAdminBootstrap();

  useEffect(() => { setMobileOpen(false); setPopoverOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const dashVars = isDashboard
    ? dashboardBrandCssVars(parseDashboardAccent(appContext?.identity?.dashboardAccent))
    : null;
  const homeHref = isSignedIn ? "/dashboard" : "/";
  const logoAlt = siteIdentity?.shortName || siteIdentity?.name || "Établissement";
  const customLogoUrl = siteIdentity?.headerLogoUrl?.trim() || "";

  return (
    <>
      <header
        className={`relative sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md print:!hidden ${
          isDashboard ? "" : "border-emerald-200/50"
        }`}
        style={
          isDashboard && dashVars
            ? { borderBottomColor: dashVars["--dash-border"] }
            : undefined
        }
      >
        <div
          className={
            isDashboard && dashVars
              ? "pointer-events-none absolute inset-x-0 bottom-0 h-px"
              : SCOLA_HEADER_ACCENT
          }
          style={
            isDashboard && dashVars
              ? {
                  background: `linear-gradient(to right, transparent, ${dashVars["--dash-bright"]}80, transparent)`,
                }
              : undefined
          }
          aria-hidden
        />
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href={homeHref} className="group flex shrink-0 items-center transition hover:opacity-90">
            <div className="flex h-10 shrink-0 items-center justify-center min-w-[56px]">
              {!bootstrapLoading &&
                (customLogoUrl ? (
                  <Image
                    src={customLogoUrl}
                    alt={logoAlt}
                    width={180}
                    height={48}
                    unoptimized
                    className="max-h-12 max-w-[180px] h-auto w-auto object-contain [image-rendering:auto]"
                  />
                ) : (
                  <Image
                    src={Logo}
                    alt={logoAlt}
                    width={56}
                    height={56}
                    className="drop-shadow-[0_3px_10px_rgba(47,107,74,0.22)]"
                  />
                ))}
            </div>
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            {isSignedIn && !isDashboard && (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-full border text-xs font-bold transition bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900"
              >
                Dashboard
              </Link>
            )}
            {!isSignedIn && (
              <Link
                href="/"
                className="px-4 py-1.5 rounded-full border text-xs font-bold transition bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900"
              >
                Accueil
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {isSignedIn ? (
              <div ref={popoverRef} className="relative">
                <button
                  onClick={() => setPopoverOpen((v) => !v)}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all shadow-sm ${popoverOpen ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white"}`}
                  title="Mon compte"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                </button>
                {popoverOpen && <UserPopover onClose={() => setPopoverOpen(false)} />}
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center justify-center bg-slate-100 text-slate-600 w-9 h-9 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                title="Se connecter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
          </div>

          <button
            className="md:hidden relative z-50 flex flex-col justify-center items-center w-10 h-10 gap-[5px]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <span
              className="block h-[1.5px] bg-slate-800 rounded-full transition-all duration-300 origin-center"
              style={{ width: 24, transform: mobileOpen ? "translateY(6.5px) rotate(45deg)" : "none" }}
            />
            <span
              className="block h-[1.5px] bg-slate-800 rounded-full transition-all duration-300"
              style={{ width: 16, opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "none" }}
            />
            <span
              className="block h-[1.5px] bg-slate-800 rounded-full transition-all duration-300 origin-center"
              style={{ width: 24, transform: mobileOpen ? "translateY(-6.5px) rotate(-45deg)" : "none" }}
            />
          </button>
        </div>
      </header>

      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-500 print:!hidden"
        style={{
          background: "rgba(0,0,0,0.18)",
          backdropFilter: "blur(4px)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className="fixed top-14 left-0 right-0 z-40 md:hidden bg-white/96 backdrop-blur-2xl border-b border-slate-100 shadow-2xl print:!hidden"
        style={{
          transform: mobileOpen ? "translateY(0)" : "translateY(-12px)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          transition: "transform 0.48s cubic-bezier(0.32,0.72,0,1), opacity 0.3s ease",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 pt-4 pb-8">
          <nav className="flex flex-col">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`group flex items-center justify-between py-4 border-b border-slate-100 text-[1.35rem] font-black tracking-tight transition-all duration-300 hover:text-slate-600 ${isDashboard ? "text-slate-800" : "text-slate-900"}`}
                >
                  <span className="flex items-center gap-3">
                    {isDashboard && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-600" />}
                    Tableau de bord
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30 group-hover:opacity-60 transition">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
                {MOBILE_MODULE_LINKS.map((item) => {
                  const linkPath = item.href.split("?")[0].split("#")[0];
                  const active = pathname === linkPath || pathname.startsWith(`${linkPath}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between py-3.5 border-b border-slate-100 text-[1.1rem] font-bold tracking-tight transition-all duration-300 hover:text-slate-600 ${active ? "text-slate-800" : "text-slate-900"}`}
                    >
                      <span className="flex items-center gap-3">
                        {active && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-600" />}
                        <span>{item.icon}</span>
                        {item.label}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30 group-hover:opacity-60 transition">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  );
                })}
              </>
            ) : (
              <Link
                href="/"
                className={`group flex items-center justify-between py-4 border-b border-slate-100 text-[1.35rem] font-black tracking-tight transition-all duration-300 hover:text-slate-600 ${pathname === "/" ? "text-slate-800" : "text-slate-900"}`}
              >
                <span className="flex items-center gap-3">
                  {pathname === "/" && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-600" />}
                  Accueil
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30 group-hover:opacity-60 transition">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            {isSignedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    openUserProfile();
                    setMobileOpen(false);
                  }}
                  className="w-full bg-slate-100 text-slate-700 font-bold text-center py-3.5 rounded-2xl text-sm hover:bg-slate-200 transition"
                >
                  Modifier mon profil
                </button>
                <button
                  type="button"
                  onClick={() => signOutWithPortalReset("/")}
                  className="w-full bg-red-50 text-red-500 font-bold text-center py-3.5 rounded-2xl text-sm hover:bg-red-100 transition"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link href="/sign-in" className="bg-slate-100 text-slate-700 font-bold text-center py-3.5 rounded-2xl text-sm hover:bg-slate-200 transition">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
