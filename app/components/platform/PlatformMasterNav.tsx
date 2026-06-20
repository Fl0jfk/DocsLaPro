"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useIsPlatformMaster } from "@/app/hooks/useIsPlatformMaster";

/** Bouton connexion / espace Master dans le header marketing. */
export default function PlatformMasterNav() {
  const { isLoaded, isSignedIn } = useUser();
  const isMaster = useIsPlatformMaster();

  if (!isLoaded) {
    return <div className="h-9 w-24 rounded-full bg-stone-100 animate-pulse" />;
  }

  if (!isSignedIn) {
    return (
      <Link
        href="/connexion"
        className="rounded-full bg-gradient-to-r from-[#2F6B4A] via-[#25633F] to-[#1E4A32] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:scale-[1.02] hover:brightness-110"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isMaster && (
        <Link
          href="/plateforme"
          className="hidden rounded-full border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-800 sm:inline-flex"
        >
          Espace plateforme
        </Link>
      )}
      <UserButton />
    </div>
  );
}
