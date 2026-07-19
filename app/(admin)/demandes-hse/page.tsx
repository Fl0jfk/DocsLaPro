import { redirect } from "next/navigation";

/** Demandes HSE absorbées dans le module RH. */
export default function DemandesHsePage() {
  redirect("/rh?tab=hse");
}
