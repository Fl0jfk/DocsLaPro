"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import Logo from "../../../public/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp";
import { SCHOOL } from "../../lib/school";

const NAV = [
  { href: "/ecole",   label: "École",   activeColor: "text-yellow-500", hoverClass: "hover:text-yellow-500", dot: "bg-yellow-500" },
  { href: "/college", label: "Collège", activeColor: "text-blue-500",   hoverClass: "hover:text-blue-500",   dot: "bg-blue-500"   },
  { href: "/lycee",   label: "Lycée",   activeColor: "text-pink-500",   hoverClass: "hover:text-pink-500",   dot: "bg-pink-500"   },
];

function UserPopover({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
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
          onClick={() => { signOut({ redirectUrl: "/" }); onClose(); }}
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
export default function SiteHeader({ adminMode = false }: { adminMode?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
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
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
    <>
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 print:!hidden">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="hover:opacity-75 transition flex-shrink-0">
            <div className="w-[44px] h-[44px]">
              <Image src={Logo} alt="La Providence Nicolas Barré" width={150} height={150}/>
            </div>
          </Link>
          <nav className={`${adminMode ? "flex" : "hidden md:flex"} gap-8 text-sm font-medium text-slate-600`}>
            {adminMode && !isActive("/dashboard") ? (
              <Link
                href="/dashboard"
                className={`px-4 py-1.5 rounded-full border text-xs font-bold transition ${
                  isActive("/dashboard")
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                }`}
              >
                Dashboard
              </Link>
            ) : !adminMode ? (
              NAV.map(({ href, label, activeColor, hoverClass }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-1 transition-colors ${hoverClass} ${isActive(href) ? `${activeColor} font-bold` : ""}`}
                >
                  {label}
                  {isActive(href) && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-current" />
                  )}
                </Link>
              ))
            ) : null}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {!adminMode && (
              <a href={SCHOOL.preinscriptionUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 transition-all">
                Pré-inscription
              </a>
            )}
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
            {(adminMode
              ? [{ href: "/dashboard", label: "Dashboard", activeColor: "text-slate-800", hoverClass: "hover:text-slate-600", dot: "bg-slate-600" }, ...NAV]
              : NAV
            ).map(({ href, label, activeColor, hoverClass, dot }, i) => (
              <Link
                key={href}
                href={href}
                className={`group flex items-center justify-between py-4 border-b border-slate-100 text-[1.6rem] font-black tracking-tight transition-all duration-300 ${hoverClass} ${isActive(href) ? activeColor : "text-slate-900"}`}
                style={{
                  transform: mobileOpen ? "translateX(0)" : "translateX(-16px)",
                  opacity: mobileOpen ? 1 : 0,
                  transition: `transform 0.45s cubic-bezier(0.32,0.72,0,1) ${i * 55}ms, opacity 0.35s ease ${i * 55}ms, color 0.2s`,
                }}
              >
                <span className="flex items-center gap-3">
                  {isActive(href) && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
                  {label}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30 group-hover:opacity-60 transition">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
            <Link
              href="/internat"
              className={`group flex items-center justify-between py-4 border-b border-slate-100 text-[1.6rem] font-black tracking-tight transition-all duration-300 hover:text-slate-500 ${isActive("/internat") ? "text-slate-600" : "text-slate-400"}`}
              style={{
                transform: mobileOpen ? "translateX(0)" : "translateX(-16px)",
                opacity: mobileOpen ? 1 : 0,
                transition: `transform 0.45s cubic-bezier(0.32,0.72,0,1) ${NAV.length * 55}ms, opacity 0.35s ease ${NAV.length * 55}ms, color 0.2s`,
              }}
            >
              <span className="flex items-center gap-3">
                {isActive("/internat") && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-400" />}
                L&apos;Internat
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30 group-hover:opacity-60 transition">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link
              href="/notre-identite"
              className={`group flex items-center justify-between py-4 border-b border-slate-100 text-[1.6rem] font-black tracking-tight transition-all duration-300 hover:text-slate-500 ${isActive("/notre-identite") ? "text-slate-600" : "text-slate-400"}`}
              style={{
                transform: mobileOpen ? "translateX(0)" : "translateX(-16px)",
                opacity: mobileOpen ? 1 : 0,
                transition: `transform 0.45s cubic-bezier(0.32,0.72,0,1) ${(NAV.length + 1) * 55}ms, opacity 0.35s ease ${(NAV.length + 1) * 55}ms, color 0.2s`,
              }}
            >
              <span className="flex items-center gap-3">
                {isActive("/notre-identite") && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-indigo-400" />}
                Notre identité
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30 group-hover:opacity-60 transition">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link
              href="/projet-educatif"
              className={`group flex items-center justify-between py-4 border-b border-slate-100 text-[1.6rem] font-black tracking-tight transition-all duration-300 hover:text-indigo-500 ${isActive("/projet-educatif") ? "text-indigo-600" : "text-slate-400"}`}
              style={{
                transform: mobileOpen ? "translateX(0)" : "translateX(-16px)",
                opacity: mobileOpen ? 1 : 0,
                transition: `transform 0.45s cubic-bezier(0.32,0.72,0,1) ${(NAV.length + 2) * 55}ms, opacity 0.35s ease ${(NAV.length + 2) * 55}ms, color 0.2s`,
              }}
            >
              <span className="flex items-center gap-3">
                {isActive("/projet-educatif") && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-indigo-500" />}
                Projet éducatif
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30 group-hover:opacity-60 transition">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </nav>
          <div
            className="mt-5 flex flex-col gap-3"
            style={{
              transform: mobileOpen ? "translateX(0)" : "translateX(-16px)",
              opacity: mobileOpen ? 1 : 0,
              transition: `transform 0.45s cubic-bezier(0.32,0.72,0,1) ${(NAV.length + 3) * 55}ms, opacity 0.35s ease ${(NAV.length + 3) * 55}ms`,
            }}
          >
            {!adminMode && (
              <Link href="/portesouvertes" className="bg-blue-600 text-white font-bold text-center py-3.5 rounded-2xl text-sm hover:bg-blue-700 transition">
                Pré-inscription
              </Link>
            )}
            {isSignedIn ? (
              <div className="flex gap-3">
                <Link href="/dashboard" className="flex-1 bg-slate-100 text-slate-700 font-bold text-center py-3.5 rounded-2xl text-sm hover:bg-slate-200 transition">
                  Mon espace
                </Link>
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="flex-1 bg-red-50 text-red-500 font-bold text-center py-3.5 rounded-2xl text-sm hover:bg-red-100 transition"
                >
                  Se déconnecter
                </button>
              </div>
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
