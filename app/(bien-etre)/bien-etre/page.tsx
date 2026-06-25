import { redirect } from "next/navigation";

/** Ancienne URL élève → dashboard (bulle bien-être intégrée). */
export default function BienEtreLegacyRedirect() {
  redirect("/dashboard");
}
