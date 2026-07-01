"use client";

import ProfRoomAdminPicker, { type ClerkMemberOption } from "@/app/components/prof-room/ProfRoomAdminPicker";

export type { ClerkMemberOption };

export default function DomainCoordinatorPicker({
  domainName,
  members,
  selectedIds,
  onChange,
  loading,
}: {
  domainName: string;
  members: ClerkMemberOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}) {
  return (
    <ProfRoomAdminPicker
      members={members}
      selectedIds={selectedIds}
      onChange={onChange}
      loading={loading}
      footerHint={
        domainName.toLowerCase().includes("evars")
          ? `${selectedIds.length} responsable(s) EVARS. Elles valident les positionnements des intervenants.`
          : `${selectedIds.length} responsable(s) pour ${domainName || "ce domaine"}.`
      }
    />
  );
}
