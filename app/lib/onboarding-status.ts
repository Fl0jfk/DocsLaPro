import type { AppConfigBundle } from "@/app/lib/app-config-schemas";

export function onboardingStatusFromConfig(config: AppConfigBundle) {
  return {
    completed: config.identity.onboardingCompleted === true,
    step: config.identity.onboardingStep ?? 1,
    organizationKind: config.identity.organizationKind ?? "standalone",
  };
}
