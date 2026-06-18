import type { Metadata } from "next";
import MarketingShell from "@/app/components/landing/MarketingShell";
import TarifsContent from "@/app/components/landing/TarifsContent";
import { MARKETING } from "@/app/lib/marketing-site";

export const metadata: Metadata = {
  title: `Tarifs — ${MARKETING.productName}`,
  description:
    "0,30 € par élève et par mois, tout inclus. Abonnement mensuel sans engagement, ou annuel −10 %. Simulateur en ligne.",
};

export default function TarifsPage() {
  return (
    <MarketingShell>
      <TarifsContent />
    </MarketingShell>
  );
}
