import type { Metadata } from "next";
import MarketingShell from "@/app/components/landing/MarketingShell";
import TarifsContent from "@/app/components/landing/TarifsContent";
import { MARKETING } from "@/app/lib/marketing-site";

export const metadata: Metadata = {
  title: `Tarifs — ${MARKETING.productName}`,
  description:
    "Trois forfaits ScolIA : 299 €, 499 € ou 699 € / mois selon l'effectif. Licences Microsoft Éducation incluses. Hébergement Scaleway France.",
};

export default function TarifsPage() {
  return (
    <MarketingShell>
      <TarifsContent />
    </MarketingShell>
  );
}
