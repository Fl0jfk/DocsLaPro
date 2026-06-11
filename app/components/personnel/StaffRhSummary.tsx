"use client";

import { computeEntretienNextDue, formatDueLabel } from "@/app/lib/personnel-rh-cycles";
import { daysUntil as daysUntilType, type PersonnelRecord } from "@/app/lib/personnel-types";
import PersonnelDropZone from "@/app/components/personnel/PersonnelDropZone";
import { PERSONNEL_DROP_ACCEPT } from "@/app/lib/personnel-upload-client";

type Props = {
  record: PersonnelRecord;
  canManage: boolean;
  onDeposit: (file: File) => Promise<void>;
  depositBusy?: boolean;
  onAddMedecineVisit: () => void;
  onPlanEntretien: () => void;
  onAddEntretienRealise: () => void;
};

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "ok" | "warn" | "danger" | "neutral";
}) {
  const tones = {
    ok: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
    danger: "border-rose-200 bg-rose-50",
    neutral: "border-slate-200 bg-slate-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function StaffRhSummary({
  record,
  canManage,
  onDeposit,
  depositBusy,
  onAddMedecineVisit,
  onPlanEntretien,
  onAddEntretienRealise,
}: Props) {
  const medDue = record.medecineTravail.nextVisitAt;
  const medDays = daysUntilType(medDue);
  const medTone =
    medDays === null ? "neutral" : medDays < 0 ? "danger" : medDays <= 45 ? "warn" : "ok";

  const entretienNext = computeEntretienNextDue(record);
  const entDays = entretienNext ? daysUntilType(entretienNext) : null;
  const entTone =
    entDays === null ? "neutral" : entDays < 0 ? "danger" : entDays <= 90 ? "warn" : "ok";

  const habCount = record.habilitations.filter((h) => {
    const d = daysUntilType(h.expiresAt);
    return d !== null && d >= 0 && d <= 60;
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Médecine du travail"
          value={
            medDue ? new Date(medDue).toLocaleDateString("fr-FR") : "Non renseignée"
          }
          sub={formatDueLabel(medDue)}
          tone={medTone}
        />
        <KpiCard
          label="Prochain entretien pro"
          value={
            entretienNext ? new Date(entretienNext).toLocaleDateString("fr-FR") : "À planifier"
          }
          sub={entretienNext ? formatDueLabel(entretienNext) : "Cycle 3 ans"}
          tone={entTone}
        />
        <KpiCard
          label="Habilitations"
          value={habCount > 0 ? `${habCount} à surveiller` : "OK"}
          sub="Échéance < 60 j"
          tone={habCount > 0 ? "warn" : "ok"}
        />
        <KpiCard
          label="Onboarding"
          value={record.onboarding?.status?.replace(/_/g, " ") || "—"}
          sub={record.onboarding ? "Suivi entrée" : undefined}
          tone={record.onboarding?.status === "termine" ? "ok" : "neutral"}
        />
      </div>

      {canManage && (
        <>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <p className="text-xs font-bold text-indigo-900 mb-2">Déposer un document (IA)</p>
            <PersonnelDropZone
              title={depositBusy ? "Analyse…" : "Glisser un PDF ou Office ici"}
              hint="Identification automatique · rangement dans ce dossier"
              disabled={depositBusy}
              accept={PERSONNEL_DROP_ACCEPT}
              onFile={onDeposit}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddMedecineVisit}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              + Visite médecine du travail
            </button>
            <button
              type="button"
              onClick={onAddEntretienRealise}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"
            >
              + Entretien réalisé
            </button>
            <button
              type="button"
              onClick={onPlanEntretien}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Planifier un entretien
            </button>
          </div>
        </>
      )}
    </div>
  );
}
