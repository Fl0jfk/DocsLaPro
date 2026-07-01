"use client";

import { Suspense, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { canAccessDomainPlanningSettingsFromRoles } from "@/app/lib/intranet-role-utils";
import DomainPlanningSettingsTab from "@/app/components/domain-planning/DomainPlanningSettingsTab";
import TransversalSessionsTab from "@/app/components/domain-planning/TransversalSessionsTab";
import ReplayModuleTourButton from "@/app/components/module-tour/ReplayModuleTourButton";
import { useIsOrgAdmin } from "@/app/hooks/useIsOrgAdmin";

function DomainPlanningPageContent() {
  const { user, isLoaded } = useUser();
  const isOrgAdmin = useIsOrgAdmin();
  const intranetRoles = intranetRolesFromMetadata(user?.publicMetadata);
  const [domains, setDomains] = useState<{ id: string; coordinatorClerkUserIds?: string[] }[]>([]);
  const [activeTab, setActiveTab] = useState<"positionnements" | "settings">("positionnements");

  const isEvarsCoordinator =
    isOrgAdmin ||
    Boolean(user?.id && domains.find((d) => d.id === "evars")?.coordinatorClerkUserIds?.includes(user.id));

  const canAccessSettings =
    isOrgAdmin ||
    canAccessDomainPlanningSettingsFromRoles(intranetRoles) ||
    Boolean(user?.id && domains.some((d) => d.coordinatorClerkUserIds?.includes(user.id)));

  useEffect(() => {
    fetch("/api/domain-planning/domains", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setDomains(j.domains || []))
      .catch(() => setDomains([]));
  }, []);

  if (!isLoaded || !user) {
    return <div className="p-20 text-center font-bold">Initialisation…</div>;
  }

  return (
    <div className="px-0 py-4 md:px-4 pb-0 sm:pb-4 max-w-6xl mx-auto">
      <h1 className="text-4xl font-black text-slate-900 tracking-tight p-4">
        Enseignements transversaux — EVARS
      </h1>

      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <button
          type="button"
          data-domain-planning-tab="reservation"
          onClick={() => setActiveTab("positionnements")}
          className={`px-6 py-3 rounded-xl text-sm font-black ${
            activeTab === "positionnements" ? "bg-violet-600 text-white shadow-lg" : "bg-slate-100 text-slate-700"
          }`}
        >
          Positionnements
        </button>
        {canAccessSettings && (
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 rounded-xl text-sm font-black ${
              activeTab === "settings" ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-700"
            }`}
          >
            Paramétrage
          </button>
        )}
      </div>

      {activeTab === "settings" && canAccessSettings ? (
        <DomainPlanningSettingsTab />
      ) : (
        <>
          {canAccessSettings && domains.some((d) => d.id === "evars" && !d.coordinatorClerkUserIds?.length) && (
            <div className="px-4 mb-4 rounded-2xl bg-amber-50 border border-amber-200 py-3 text-sm text-amber-900">
              <span className="font-black">Première configuration :</span> ouvrez l&apos;onglet{" "}
              <button type="button" className="font-black underline" onClick={() => setActiveTab("settings")}>
                Paramétrage
              </button>{" "}
              pour désigner la responsable EVARS.
            </div>
          )}
          <TransversalSessionsTab isCoordinator={isEvarsCoordinator} />
        </>
      )}

      <ReplayModuleTourButton moduleId="domain-planning" />
    </div>
  );
}

export default function DomainPlanningPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Chargement…</div>}>
      <DomainPlanningPageContent />
    </Suspense>
  );
}
