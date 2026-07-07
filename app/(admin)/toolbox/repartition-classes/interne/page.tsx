"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClassAllocationAlert,
  ClassAllocationCard,
  ClassAllocationShell,
} from "@/app/components/class-allocation/ClassAllocationShell";
import { classLevelLabel } from "@/app/lib/class-allocation-labels";

type Student = { ine: string; nom: string; prenom: string; classe?: string; level?: string | null };
type StaffWish = {
  studentIne: string;
  separateFromInes: string[];
  willingToTake?: boolean | null;
  note?: string;
};
type Score = { studentIne: string; score: number; gender?: "F" | "M" | "X" };

export default function ClassAllocationStaffPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [wishes, setWishes] = useState<StaffWish[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [role, setRole] = useState<string>("professeur");
  const [fullAccess, setFullAccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [activeIne, setActiveIne] = useState("");
  const [separations, setSeparations] = useState<string[]>([]);
  const [willingToTake, setWillingToTake] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [score, setScore] = useState("");
  const [gender, setGender] = useState<"F" | "M" | "X">("X");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (className?: string) => {
    const qs = className ? `?className=${encodeURIComponent(className)}` : "";
    const res = await fetch(`/api/toolbox/class-allocation/staff${qs}`, { cache: "no-store" });
    const j = await res.json();
    setStudents(j.students || []);
    setWishes(j.wishes || []);
    setScores(j.scores || []);
    setAssignedClasses(j.assignedClasses || []);
    setRole(j.role || "professeur");
    setFullAccess(Boolean(j.fullAccess));
    setInfo(j.message || null);
  }, []);

  useEffect(() => {
    void load(classFilter || undefined);
  }, [load, classFilter]);

  const studentByIne = useMemo(() => new Map(students.map((s) => [s.ine, s])), [students]);
  const wishByIne = useMemo(() => new Map(wishes.map((w) => [w.studentIne, w])), [wishes]);
  const scoreByIne = useMemo(() => new Map(scores.map((s) => [s.studentIne, s])), [scores]);

  const separationCandidates = useMemo(() => {
    if (!activeIne) return students.filter((s) => s.ine !== activeIne);
    const active = studentByIne.get(activeIne);
    return students.filter((s) => s.ine !== activeIne && s.level === active?.level);
  }, [students, activeIne, studentByIne]);

  function openStudent(ine: string) {
    setActiveIne(ine);
    const w = wishByIne.get(ine);
    const sc = scoreByIne.get(ine);
    setSeparations(w?.separateFromInes || []);
    setWillingToTake(w?.willingToTake ?? null);
    setNote(w?.note || "");
    setScore(sc?.score != null ? String(sc.score) : "");
    setGender(sc?.gender || "X");
    setMessage(null);
  }

  async function save() {
    if (!activeIne) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/toolbox/class-allocation/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIne: activeIne,
          separateFromInes: separations.slice(0, 3),
          willingToTake: role === "professeur" ? willingToTake : undefined,
          note,
          score: score ? Number(score) : undefined,
          gender,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setMessage("Saisie enregistrée.");
      await load(classFilter || undefined);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const filledCount = students.filter((s) => wishByIne.has(s.ine)).length;

  return (
    <ClassAllocationShell
      badge="Équipe"
      title="Préparer la classe"
      subtitle={fullAccess ? "Direction / administratif / éducation : accès à tous les élèves." : "Professeur : accès limité à votre ou vos classes (définies dans Paramètres → Référentiel scolaire)."}
      backHref="/toolbox/repartition-classes"
    >
      {info && (
        <ClassAllocationAlert tone="warn">
          {info}{" "}
          <a href="/parametres?tab=referentiel" className="font-bold underline">
            Paramètres → Référentiel scolaire
          </a>
        </ClassAllocationAlert>
      )}

      {!info && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {assignedClasses.length > 1 && (
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="">Toutes mes classes</option>
                {assignedClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {filledCount}/{students.length} élèves saisis
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <ClassAllocationCard title="Élèves de la classe">
              <div className="grid gap-2 sm:grid-cols-2">
                {students.map((s) => {
                  const done = wishByIne.has(s.ine);
                  return (
                    <button
                      key={s.ine}
                      type="button"
                      onClick={() => openStudent(s.ine)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        activeIne === s.ine
                          ? "border-indigo-500 bg-indigo-50"
                          : done
                            ? "border-emerald-200 bg-emerald-50/60"
                            : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="font-bold text-slate-900">{s.prenom} {s.nom}</p>
                      <p className="text-xs text-slate-500">{s.classe} · {classLevelLabel(s.level)}</p>
                    </button>
                  );
                })}
              </div>
            </ClassAllocationCard>

            <ClassAllocationCard title="Fiche élève">
              {!activeIne ? (
                <p className="text-sm text-slate-500">Sélectionnez un élève dans la liste.</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-900">
                    {studentByIne.get(activeIne)?.prenom} {studentByIne.get(activeIne)?.nom}
                  </p>

                  <div>
                    <p className="mb-2 text-sm font-semibold">Séparations souhaitées (max 3)</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {separations.map((ine) => {
                        const s = studentByIne.get(ine) || separationCandidates.find((c) => c.ine === ine);
                        return (
                          <button
                            key={ine}
                            type="button"
                            onClick={() => setSeparations((prev) => prev.filter((x) => x !== ine))}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800"
                          >
                            {s ? `${s.prenom} ${s.nom}` : ine} ×
                          </button>
                        );
                      })}
                    </div>
                    <select
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      value=""
                      onChange={(e) => {
                        const ine = e.target.value;
                        if (!ine || separations.includes(ine) || separations.length >= 3) return;
                        setSeparations((prev) => [...prev, ine]);
                      }}
                    >
                      <option value="">+ Élève à séparer</option>
                      {separationCandidates
                        .filter((c) => !separations.includes(c.ine))
                        .map((s) => (
                          <option key={s.ine} value={s.ine}>{s.prenom} {s.nom}</option>
                        ))}
                    </select>
                  </div>

                  {role === "professeur" && (
                    <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold">
                      Prêt à reprendre cet élève
                      <select
                        className="rounded-lg border px-2 py-1 text-sm"
                        value={willingToTake === null ? "" : willingToTake ? "yes" : "no"}
                        onChange={(e) => {
                          if (!e.target.value) setWillingToTake(null);
                          else setWillingToTake(e.target.value === "yes");
                        }}
                      >
                        <option value="">—</option>
                        <option value="yes">Oui</option>
                        <option value="no">Non</option>
                      </select>
                    </label>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold uppercase text-slate-500">Score pédagogique</span>
                      <input type="number" min={0} max={100} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={score} onChange={(e) => setScore(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase text-slate-500">Genre</span>
                      <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={gender} onChange={(e) => setGender(e.target.value as "F" | "M" | "X")}>
                        <option value="X">Non renseigné</option>
                        <option value="F">Fille</option>
                        <option value="M">Garçon</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Note interne</span>
                    <textarea className="mt-1 min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
                  </label>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void save()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  {message && (
                    <ClassAllocationAlert tone={message.includes("Erreur") || message.includes("erreur") ? "error" : "success"}>
                      {message}
                    </ClassAllocationAlert>
                  )}
                </div>
              )}
            </ClassAllocationCard>
          </div>
        </div>
      )}
    </ClassAllocationShell>
  );
}
