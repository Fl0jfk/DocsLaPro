import type { Metadata } from "next";
import PublicSiteIdentityLayout from "@/app/components/PublicSiteIdentityLayout";

export const metadata: Metadata = {
  title: "Rentrée — La Providence Nicolas Barré",
  description: "Informations rentrée, simulateur de tarifs et liste de fournitures.",
};

export default function PublicRentreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicSiteIdentityLayout>
      <div className="antialiased text-black font-medium">{children}</div>
    </PublicSiteIdentityLayout>
  );
}
