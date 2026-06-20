"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { resolveOnboardingGate } from "@/app/lib/onboarding-gate";

type OnboardingStatus = {
  completed: boolean;
  step: number;
  isOrgAdmin: boolean;
  isPlatformMaster: boolean;
};

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reviewMode = searchParams.get("review") === "1";
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/status", { cache: "no-store" });
        const j = (await res.json()) as OnboardingStatus & { error?: string };
        if (!cancelled && res.ok) setStatus(j);
      } catch {
        /* laisser passer en cas d'erreur réseau */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (checking || !status) return;
    const decision = resolveOnboardingGate({
      pathname,
      onboardingCompleted: status.completed,
      isOrgAdmin: status.isOrgAdmin,
      isPlatformMaster: status.isPlatformMaster,
      reviewMode,
    });
    if (decision.action === "redirect" && decision.path !== pathname) {
      router.replace(decision.path);
    }
  }, [checking, status, pathname, router, reviewMode]);

  if (checking) return null;

  const decision = status
    ? resolveOnboardingGate({
        pathname,
        onboardingCompleted: status.completed,
        isOrgAdmin: status.isOrgAdmin,
        isPlatformMaster: status.isPlatformMaster,
        reviewMode,
      })
    : { action: "allow" as const };

  if (decision.action === "redirect" && decision.path !== pathname) {
    return null;
  }

  return <>{children}</>;
}
