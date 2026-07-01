"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAppContext } from "@/app/hooks/useAppContext";
import { useIsOrgAdmin } from "@/app/hooks/useIsOrgAdmin";
import {
  classesForTransversalNiveau,
  DEFAULT_DOMAIN_PLANNING_ACTIVITY_COLORS,
  sanitizeDomainPlanningClassesByPole,
  TRANSVERSAL_NIVEAU_LABELS,
  TRANSVERSAL_NIVEAUX,
} from "@/app/lib/domain-planning-defaults";
import type { DomainPlanningSession, DomainPlanningSignup } from "@/app/lib/domain-planning-types";
import { getSubjectColorPresentation } from "@/app/lib/prof-room-subject-colors";

const FALLBACK_CLASSES: Record<string, string[]> = {
  COLLÈGE: ["6A", "6B", "6C", "6D", "6E", "6F", "5A", "5B", "5C", "5D", "5E", "5F", "4A", "4B", "4C", "4D", "4E", "4F", "3A", "3B", "3C", "3D", "3E", "3F"],
};

type Props = {
  isCoordinator: boolean;
};

function constraintHint(session: DomainPlanningSession): string {
  if (session.intervenantConstraint === "fixed") {
    return "Intervenant imposé — pas d'inscription professeur";
  }
  if (session.intervenantConstraint === "svt_only") {
    return "Inscription réservée aux professeurs de SVT";
  }
  return "Inscription libre : nom, matière et idée de séance";
}

export default function TransversalSessionsTab({ isCoordinator }: Props) {
  const { user } = useUser();
  const { data: appCtx } = useAppContext();
  const [sessions, setSessions] = useState<DomainPlanningSession[]>([]);
  const [signups, setSignups] = useState<DomainPlanningSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ session: DomainPlanningSession; className: string } | null>(null);
  const [subject, setSubject] = useState("");
  const [sessionIdea, setSessionIdea] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const classesByPole = useMemo(() => {
    const raw = appCtx?.domainPlanning?.classesByPole || FALLBACK_CLASSES;
    return sanitizeDomainPlanningClassesByPole(raw);
  }, [appCtx?.domainPlanning?.classesByPole]);

  const activityColors = {
    ...DEFAULT_DOMAIN_PLANNING_ACTIVITY_COLORS,
    ...(appCtx?.domainPlanning?.activityColors || {}),
  };

  const reload = useCallback(async () => {
    const [sessionsRes, signupsRes] = await Promise.all([
      fetch("/api/domain-planning/sessions", { cache: "no-store" }),
      fetch("/api/domain-planning/signups", { cache: "no-store" }),
    ]);
    const sessionsJson = await sessionsRes.json();
    const signupsJson = await signupsRes.json();
    setSessions(sessionsJson.sessions || []);
    setSignups(signupsJson.signups || []);
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const mySignups = useMemo(
    () => signups.filter((s) => s.userId === user?.id),
    [signups, user?.id],
  );

  function signupFor(sessionId: string, className: string) {
    return signups.find((s) => s.sessionId === sessionId && s.className === className);
  }

  function openSignup(session: DomainPlanningSession, className: string) {
    setSubject("");
    setSessionIdea("");
    setModal({ session, className });
  }

  async function confirmSignup() {
    if (!modal) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/domain-planning/signups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: modal.session.id,
          className: modal.className,
          subject,
          sessionIdea,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setModal(null);
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSignup(id: string) {
    if (!confirm("Retirer ce positionnement ?")) return;
    const res = await fetch("/api/domain-planning/signups/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erreur");
      return;
    }
    await reload();
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Chargement des séances EVARS…</div>;
  }

  return (
    <div className="space-y-8 px-4 pb-8">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 leading-relaxed">
        <strong>EVARS — positionnement des professeurs.</strong> La responsable a défini les séances ci-dessous.
        Positionnez-vous sur les classes concernées selon les règles indiquées (SVT obligatoire en séance 1,
        intervenant imposé en séance 2, choix libre en séance 3).
      </div>

      {mySignups.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-white p-4">
          <h3 className="text-sm font-black text-violet-700 uppercase mb-3">Mes positionnements ({mySignups.length})</h3>
          <div className="flex flex-wrap gap-2">
            {mySignups.map((s) => {
              const session = sessions.find((x) => x.id === s.sessionId);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => removeSignup(s.id)}
                  className="text-left rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:border-rose-300"
                  title="Cliquer pour retirer"
                >
                  <span className="font-black text-slate-800">
                    {TRANSVERSAL_NIVEAU_LABELS[session?.niveau || ""] || ""} — Séance {session?.seanceNumber} — {s.className}
                  </span>
                  <span className="block text-slate-500">{s.subject}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {TRANSVERSAL_NIVEAUX.map((niveau) => {
        const niveauSessions = sessions
          .filter((s) => s.niveau === niveau)
          .sort((a, b) => a.seanceNumber - b.seanceNumber);
        const classes = classesForTransversalNiveau(niveau, classesByPole);

        return (
          <section key={niveau} className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">{TRANSVERSAL_NIVEAU_LABELS[niveau]}</h2>
            {niveauSessions.map((session) => {
              const colorKey = `Séance ${session.seanceNumber}`;
              const colorPresentation = getSubjectColorPresentation(
                activityColors[colorKey] || "bg-violet-600 text-white",
              );
              const canSignup = session.intervenantConstraint !== "fixed" || isCoordinator;

              return (
                <div key={session.id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div
                    className={`px-4 py-3 ${colorPresentation.className}`}
                    style={colorPresentation.style}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                          Séance {session.seanceNumber}
                        </p>
                        <p className="font-black text-lg leading-snug">{session.theme}</p>
                      </div>
                      <div className="text-right text-xs font-bold">
                        <p>{session.intervenantLabel}</p>
                        <p className="opacity-90">Mixte : {session.mixte ? "OUI" : "NON"}</p>
                      </div>
                    </div>
                    <p className="text-xs mt-2 opacity-90">{constraintHint(session)}</p>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-sm">
                      <thead>
                        <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="pb-2 pr-3">Classe</th>
                          <th className="pb-2 pr-3">Professeur</th>
                          <th className="pb-2 pr-3">Matière</th>
                          <th className="pb-2">Idée de séance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((className) => {
                          const signup = signupFor(session.id, className);
                          const isMine = signup?.userId === user?.id;
                          return (
                            <tr key={className} className="border-t border-slate-100">
                              <td className="py-2 pr-3 font-black text-slate-800">{className}</td>
                              {session.intervenantConstraint === "fixed" && !signup ? (
                                <td colSpan={3} className="py-2 text-slate-600 italic">
                                  {session.intervenantLabel}
                                </td>
                              ) : signup ? (
                                <>
                                  <td className="py-2 pr-3 font-bold">
                                    {signup.lastName} {signup.firstName}
                                    {(isMine || isCoordinator) && (
                                      <button
                                        type="button"
                                        onClick={() => removeSignup(signup.id)}
                                        className="ml-2 text-rose-600 text-[10px] font-black uppercase"
                                      >
                                        Retirer
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-2 pr-3">{signup.subject}</td>
                                  <td className="py-2 text-slate-600">{signup.sessionIdea || "—"}</td>
                                </>
                              ) : canSignup ? (
                                <td colSpan={3} className="py-2">
                                  <button
                                    type="button"
                                    onClick={() => openSignup(session, className)}
                                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-black text-white hover:bg-violet-700"
                                  >
                                    Me positionner
                                  </button>
                                </td>
                              ) : (
                                <td colSpan={3} className="py-2 text-slate-400 italic">
                                  —
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {TRANSVERSAL_NIVEAU_LABELS[modal.session.niveau]} — Séance {modal.session.seanceNumber} — {modal.className}
            </h3>
            <p className="text-sm text-slate-600">{modal.session.theme}</p>
            <label className="block">
              <span className="text-xs font-bold text-slate-500 uppercase">Matière *</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ex. SVT, EPS, Français…"
              />
            </label>
            {modal.session.intervenantConstraint === "free" && (
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase">Idée de séance *</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
                  value={sessionIdea}
                  onChange={(e) => setSessionIdea(e.target.value)}
                  placeholder="Décrivez brièvement ce que vous proposez"
                />
              </label>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void confirmSignup()}
                className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-black text-white disabled:opacity-50"
              >
                {submitting ? "Envoi…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
