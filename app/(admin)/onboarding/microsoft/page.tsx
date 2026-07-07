"use client";

import { Suspense } from "react";
import MicrosoftLicensesStep from "@/app/components/onboarding/MicrosoftLicensesStep";

export default function OnboardingMicrosoftPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-stone-500">Chargement…</div>}>
      <MicrosoftLicensesStep />
    </Suspense>
  );
}
