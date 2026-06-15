import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faire une demande — La Providence Nicolas Barré",
  description: "Déposez une demande à l'établissement : maintenance, administratif, scolarité…",
};

export default function DemandesLayout({ children }: { children: React.ReactNode }) {
  return <div className="antialiased text-black font-medium min-h-screen bg-slate-50">{children}</div>;
}
