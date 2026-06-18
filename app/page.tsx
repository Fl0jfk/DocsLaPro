import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "./components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Scola — Intranet tout-en-un pour établissements scolaires",
  description:
    "Workflows documents élèves, sorties, absences, RH, internat… Un abonnement tout inclus. Hébergement France.",
};

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <LandingPage />;
}
