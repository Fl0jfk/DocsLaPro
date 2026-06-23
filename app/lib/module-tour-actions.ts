/** Actions déclenchées par les étapes de tutoriel (événements DOM). */

export const MODULE_TOUR_ACTION_EVENT = "scola-module-tour-action";
export const MODULE_TOUR_STEP_EVENT = "scola-module-tour-step";

export function dispatchModuleTourAction(action: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MODULE_TOUR_ACTION_EVENT, { detail: { action } }));
}

export function dispatchModuleTourStep(target?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MODULE_TOUR_STEP_EVENT, { detail: { target } }));
}
