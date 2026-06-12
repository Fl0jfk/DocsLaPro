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
      footerHint={`${selectedIds.length} responsable(s) pour ${domainName || "ce domaine"}. Ils peuvent affecter des créneaux au nom d'un professeur uniquement sur ce domaine.`}
    />
  );
}
