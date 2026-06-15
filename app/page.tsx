import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "./components/landing/LandingPage";

export const metadata: Metadata = {
  title: "DocsLaPro — Plateforme intranet pour établissements scolaires",
  description:
    "Centralisez documents, RH, sorties, absences, réservations et communication interne dans un seul espace sécurisé par rôles.",
};

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <LandingPage />;
}
