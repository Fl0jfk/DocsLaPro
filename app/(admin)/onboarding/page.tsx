import { Suspense } from "react";
import OnboardingWizard from "@/app/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Chargement…</div>}>
      <OnboardingWizard />
    </Suspense>
  );
}
