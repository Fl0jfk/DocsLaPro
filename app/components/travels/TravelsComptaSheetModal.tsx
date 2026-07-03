"use client";

import type { TravelsComptaSheet } from "@/app/lib/travels-compta-sheet";
import TravelsComptaSheetForm from "@/app/components/travels/TravelsComptaSheetForm";
import { TripButton } from "@/app/components/travels/TripDetailUI";

type Props = {
  tripId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: (sheet: TravelsComptaSheet) => void;
};

export default function TravelsComptaSheetModal({ tripId, open, onClose, onSaved }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col">
        <TravelsComptaSheetForm tripId={tripId} variant="modal" onSaved={onSaved} />
        <div className="mt-2 flex justify-end">
          <TripButton variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </TripButton>
        </div>
      </div>
    </div>
  );
}
