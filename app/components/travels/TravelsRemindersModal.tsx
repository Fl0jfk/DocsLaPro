"use client";

import { useRouter } from "next/navigation";
import type { TripReminder } from "@/app/lib/travels-trip-helpers";

export type TravelsReminderRow = TripReminder & {
  tripTitle?: string;
  tripDestination?: string;
};

const SEVERITY_STYLE: Record<TripReminder["severity"], string> = {
  urgent: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-sky-50 border-sky-200 text-sky-900",
};

export function TravelsRemindersModal({
  open,
  reminders,
  onClose,
}: {
  open: boolean;
  reminders: TravelsReminderRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  if (!open) return null;

  const grouped = reminders.reduce<Record<string, TravelsReminderRow[]>>((acc, r) => {
    if (!acc[r.tripId]) acc[r.tripId] = [];
    acc[r.tripId]!.push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-slate-100 flex justify-between items-start gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Rappels actifs</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {reminders.length} rappel{reminders.length > 1 ? "s" : ""} sur{" "}
              {Object.keys(grouped).length} dossier{Object.keys(grouped).length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {reminders.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Aucun rappel en cours.</p>
          ) : (
            Object.entries(grouped).map(([tripId, items]) => {
              const first = items[0]!;
              return (
                <section key={tripId} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    onClick={() => {
                      onClose();
                      router.push(`/travels/${tripId}?focus=reminders`);
                    }}
                  >
                    <p className="font-bold text-slate-900 text-sm">{first.tripTitle || "Sortie"}</p>
                    {first.tripDestination && (
                      <p className="text-xs text-slate-500 mt-0.5">{first.tripDestination}</p>
                    )}
                  </button>
                  <ul className="divide-y divide-slate-100">
                    {items.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className={`w-full text-left px-4 py-3 text-sm hover:opacity-90 transition-opacity border-l-4 ${SEVERITY_STYLE[r.severity]}`}
                          onClick={() => {
                            onClose();
                            router.push(`/travels/${tripId}?focus=reminders&reminder=${encodeURIComponent(r.id)}`);
                          }}
                        >
                          {r.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
