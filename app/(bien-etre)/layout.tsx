import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace bien-être",
  description: "Bot d'écoute — espace confidentiel pour les élèves.",
};

export default function BienEtreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-teal-50 text-slate-900">
      {children}
    </div>
  );
}
