"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import BentoDashboard from "@/app/components/Dashboard/bento/BentoDashboard";
import DashboardWeather from "@/app/components/Dashboard/DashboardWeather";
import { ExternalQuickLinksBar } from "@/app/components/Dashboard/ExternalQuickLinks";
import { useData } from "@/app/contexts/data";
import { useIsOrgAdmin } from "@/app/hooks/useIsOrgAdmin";
import { hasRole } from "@/app/lib/absences-types";
import { hasGlobalAdminRole, intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { isEleveBienEtreProfile } from "@/app/lib/bien-etre-profile";
import DashboardThemeRoot from "@/app/components/Dashboard/DashboardThemeRoot";
import { dash } from "@/app/lib/dashboard-brand";
import { isBentoFooterAdminModule } from "@/app/lib/dashboard-bento-constraints";
import { toDashboardQuickLinks } from "@/app/lib/dashboard-quick-links";

export default function Home() {
  const { isLoaded, user } = useUser();
  const isOrgAdmin = useIsOrgAdmin();
  const data = useData();

  const firstName =
    user?.firstName ||
    user?.fullName?.split(/\s+/)[0] ||
    user?.username ||
    null;

  const uniqueCategories = useMemo(() => {
    if (!isLoaded || !user || !data?.categories) return [];
    const roles = intranetRolesFromMetadata(user.publicMetadata);
    const filtered = data.categories.filter((category) => {
      if (category.orgAdminOnly) return isOrgAdmin;
      if (hasGlobalAdminRole(roles)) return true;
      return (category.allowedRoles ?? []).some((r) => hasRole(roles, r));
    });
    return Array.from(new Map(filtered.map((cat) => [cat.moduleId, cat])).values());
  }, [isLoaded, user, data, isOrgAdmin]);

  const dashboardCategories = useMemo(() => {
    return uniqueCategories.filter((c) => !isBentoFooterAdminModule(c.moduleId));
  }, [uniqueCategories]);

  const quickLinks = useMemo(() => {
    if (!isLoaded || !user || !data?.externalQuickLinks) return [];
    const rawRoles = user.publicMetadata?.role;
    const roles = Array.isArray(rawRoles) ? rawRoles : typeof rawRoles === "string" ? [rawRoles] : [];
    return toDashboardQuickLinks(
      data.externalQuickLinks.filter((l) => (l.allowedRoles ?? []).some((r) => roles.includes(r))),
    );
  }, [isLoaded, user, data]);

  const eleveBienEtre = useMemo(() => {
    if (!user) return false;
    const roles = intranetRolesFromMetadata(user.publicMetadata);
    return isEleveBienEtreProfile(roles);
  }, [user]);

  if (!isLoaded) return null;

  return (
    <DashboardThemeRoot>
    <main className="mx-auto mt-[1vh] flex w-full max-w-[1600px] flex-col px-4 pb-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 grid grid-cols-1 gap-4 pb-6 lg:grid-cols-[auto_1fr_auto] lg:items-end lg:gap-x-6 xl:gap-x-8"
        style={{ borderBottom: "1px solid var(--dash-border)" }}
      >
        <div className="min-w-0">
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${dash.label}`}>Tableau de bord</p>
          <h1 className={`mt-1 text-2xl font-black md:text-3xl ${dash.ink}`}>
            {firstName ? (
              <>
                Bonjour <span className={dash.gradientText}>{firstName}</span>
              </>
            ) : (
              "Bienvenue"
            )}
          </h1>
        </div>
        <div className="justify-self-start lg:pl-2 xl:pl-4">
          <DashboardWeather />
        </div>
        <div className="justify-self-start lg:justify-self-end">
          <ExternalQuickLinksBar links={quickLinks} />
        </div>
      </motion.div>

      <div className="z-10 mx-auto flex w-full flex-grow flex-col">
        {dashboardCategories.length > 0 ? (
          <BentoDashboard categories={dashboardCategories} userId={user?.id} />
        ) : (
          user && (
            <div className={`mx-auto mt-8 w-full max-w-3xl rounded-2xl border bg-white/80 px-6 py-12 text-center shadow-sm ${dash.border}`}>
              {eleveBienEtre ? (
                <>
                  <p className="text-lg font-black text-violet-900 mb-2">Espace bien-être</p>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Ouvre la bulle <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-sm">💜</span> en bas à
                    droite pour parler au bot d&apos;écoute. Ce n&apos;est pas le même assistant que pour le personnel de
                    l&apos;établissement.
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-stone-500">Aucun contenu disponible pour votre profil.</p>
              )}
            </div>
          )
        )}

        {!user && (
          <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[2px]">
            <div className={`mx-4 flex w-full max-w-sm flex-col items-center rounded-3xl border bg-white p-8 shadow-xl ${dash.border}`}>
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white shadow-lg ${dash.btnPrimaryGrad}`}>
                🔒
              </div>
              <h2 className={`mb-2 text-2xl font-black ${dash.ink}`}>Espace privé</h2>
              <p className="mb-8 text-center text-sm leading-relaxed text-stone-500">
                Veuillez vous identifier pour accéder à vos services.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/sign-in";
                }}
                className={`w-full rounded-2xl px-8 py-4 font-bold text-white shadow-lg transition hover:brightness-110 ${dash.btnPrimaryGrad}`}
              >
                Se connecter
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
    </DashboardThemeRoot>
  );
}
