import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "./components/landing/LandingPage";
import { isPlatformHostname } from "@/app/lib/platform-hostname";
import { isPlatformMasterFromPublicMetadata } from "@/app/lib/intranet-session";

export const metadata: Metadata = {
  title: "Scola — Intranet tout-en-un pour établissements scolaires",
  description:"Workflows documents élèves, sorties, absences, RH, internat… Un abonnement tout inclus. Hébergement France.",
};

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) return <LandingPage />;

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  if (isPlatformHostname(host)) {
    const user = await currentUser();
    if (isPlatformMasterFromPublicMetadata(user?.publicMetadata)) {
      redirect("/plateforme");
    }
    return <LandingPage />;
  }

  redirect("/dashboard");
}
