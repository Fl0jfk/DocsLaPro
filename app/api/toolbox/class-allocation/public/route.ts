import { NextResponse } from "next/server";
import { loadCampaignConfig } from "@/app/lib/class-allocation-storage";

/** Infos campagne uniquement — pas de liste d'élèves ni de profs. */
export async function GET() {
  const campaign = await loadCampaignConfig();
  return NextResponse.json({
    campaign: {
      id: campaign.id,
      label: campaign.label,
      isOpen: campaign.isOpen,
      openAt: campaign.openAt,
      closeAt: campaign.closeAt,
    },
  });
}
