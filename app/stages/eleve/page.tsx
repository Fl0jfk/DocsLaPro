"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { StageConvention, StageDaySlot, StageScheduleMode } from "@/app/lib/stage-types";
import { STAGE_CONVENTION_STATUS_LABELS } from "@/app/lib/stage-types";
import { buildPerDaySlotsFromTemplate } from "@/app/lib/stage-schedule";

function EleveContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [convention, setConvention] = useState<StageConvention | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError("Lien incomplet.");
      return;
    }
    setError(null);
    const res = await fetch(`/api/stages/public/student?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Lien invalide");
    setConvention(data.convention);
    setReadOnly(data.readOnly === true);
  }, [token]);

  useEffect(() => {
    void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  async function save(action: "save" | "submit") {
    if (!convention) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stages/public/student", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, convention }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setConvention(data.convention);
      if (action === "submit") setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!convention && !error) {
    return <main className="min-h-screen flex items-center justify-center p-6">Chargement…</main>;
  }

  if (error && !convention) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-rose-700">{error}</p>
      </main>
    );
  }

  if (!convention) return null;

  const c = convention;
  const schedule = c.schedule;

  function updateSchedule(patch: Partial<typeof schedule>) {
    setConvention({ ...c, schedule: { ...schedule, ...patch } });
  }

  function updateDay(patch: Partial<StageDaySlot>) {
    const days = [...(schedule.days || [])];
    days[0] = { ...(days[0] || { hasLunchBreak: true }), ...patch };
    updateSchedule({ days });
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#1F3D2B]">Préconvention de stage</h1>
        <p className="mt-2 text-sm text-stone-600">
          Statut : {STAGE_CONVENTION_STATUS_LABELS[c.status]}
        </p>

        {done && (
          <p className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            Préconvention envoyée à l&apos;administratif pour validation.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

        {!readOnly && !done && (
          <div className="mt-6 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Prénom *"
                value={c.student.firstName}
                onChange={(e) =>
                  setConvention({ ...c, student: { ...c.student, firstName: e.target.value } })
                }
              />
              <input
                className="rounded-lg border px-3 py-2"
                placeholder="Nom *"
                value={c.student.lastName}
                onChange={(e) =>
                  setConvention({ ...c, student: { ...c.student, lastName: e.target.value } })
                }
              />
            </div>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Classe *"
              value={c.student.className}
              onChange={(e) =>
                setConvention({ ...c, student: { ...c.student, className: e.target.value } })
              }
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Entreprise *"
              value={c.company.name}
              onChange={(e) =>
                setConvention({ ...c, company: { ...c.company, name: e.target.value } })
              }
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Adresse entreprise *"
              value={c.company.address}
              onChange={(e) =>
                setConvention({ ...c, company: { ...c.company, address: e.target.value } })
              }
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Activité de l'entreprise"
              value={c.company.activity}
              onChange={(e) =>
                setConvention({ ...c, company: { ...c.company, activity: e.target.value } })
              }
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Tuteur (nom) *"
              value={c.company.tutorName}
              onChange={(e) =>
                setConvention({ ...c, company: { ...c.company, tutorName: e.target.value } })
              }
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="email"
              placeholder="Tuteur (e-mail) *"
              value={c.company.tutorEmail}
              onChange={(e) =>
                setConvention({ ...c, company: { ...c.company, tutorEmail: e.target.value } })
              }
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="email"
              placeholder="RH entreprise (e-mail, optionnel)"
              value={c.company.rhEmail || ""}
              onChange={(e) =>
                setConvention({ ...c, company: { ...c.company, rhEmail: e.target.value } })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="rounded-lg border px-3 py-2"
                value={schedule.periodStart}
                onChange={(e) => updateSchedule({ periodStart: e.target.value })}
              />
              <input
                type="date"
                className="rounded-lg border px-3 py-2"
                value={schedule.periodEnd}
                onChange={(e) => updateSchedule({ periodEnd: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={schedule.mode === "uniform_week"}
                onChange={(e) =>
                  updateSchedule({ mode: (e.target.checked ? "uniform_week" : "per_day") as StageScheduleMode })
                }
              />
              Mêmes horaires tous les jours de la semaine
            </label>
            {schedule.mode === "per_day" && schedule.periodStart && schedule.periodEnd && (
              <button
                type="button"
                className="text-xs font-semibold text-[#2F6B4A] underline"
                onClick={() => {
                  const template = schedule.days[0] || {
                    hasLunchBreak: true,
                    morningStart: "08:00",
                    morningEnd: "12:00",
                    afternoonStart: "13:00",
                    afternoonEnd: "17:00",
                  };
                  updateSchedule({
                    days: buildPerDaySlotsFromTemplate(
                      schedule.periodStart,
                      schedule.periodEnd,
                      template,
                    ),
                  });
                }}
              >
                Générer un créneau par jour ouvré
              </button>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={schedule.days[0]?.hasLunchBreak !== false}
                onChange={(e) => updateDay({ hasLunchBreak: e.target.checked })}
              />
              Pause le midi
            </label>
            {schedule.days[0]?.hasLunchBreak !== false ? (
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={schedule.days[0]?.morningStart || ""} onChange={(e) => updateDay({ morningStart: e.target.value })} />
                <input type="time" value={schedule.days[0]?.morningEnd || ""} onChange={(e) => updateDay({ morningEnd: e.target.value })} />
                <input type="time" value={schedule.days[0]?.afternoonStart || ""} onChange={(e) => updateDay({ afternoonStart: e.target.value })} />
                <input type="time" value={schedule.days[0]?.afternoonEnd || ""} onChange={(e) => updateDay({ afternoonEnd: e.target.value })} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={schedule.days[0]?.fullDayStart || ""} onChange={(e) => updateDay({ fullDayStart: e.target.value })} />
                <input type="time" value={schedule.days[0]?.fullDayEnd || ""} onChange={(e) => updateDay({ fullDayEnd: e.target.value })} />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save("save")}
                className="rounded-lg border border-stone-300 px-4 py-2 font-semibold"
              >
                Enregistrer
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save("submit")}
                className="rounded-lg bg-[#2F6B4A] px-4 py-2 font-semibold text-white"
              >
                Envoyer à l&apos;administratif
              </button>
            </div>
          </div>
        )}

        {readOnly && (
          <div className="mt-6 text-sm text-stone-600 space-y-1">
            <p>
              <strong>{c.student.firstName} {c.student.lastName}</strong> — {c.company.name}
            </p>
            <p>
              Période : {schedule.periodStart} → {schedule.periodEnd}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function StageElevePage() {
  return (
    <Suspense fallback={<main className="p-8">Chargement…</main>}>
      <EleveContent />
    </Suspense>
  );
}
