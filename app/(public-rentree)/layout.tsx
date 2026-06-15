import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rentrée — La Providence Nicolas Barré",
  description: "Informations rentrée, simulateur de tarifs et liste de fournitures.",
};

export default function PublicRentreeLayout({ children }: { children: React.ReactNode }) {
  return <div className="antialiased text-black font-medium">{children}</div>;
}
