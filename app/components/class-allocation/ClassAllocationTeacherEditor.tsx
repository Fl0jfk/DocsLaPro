"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ClerkUser = { clerkUserId: string; email: string; displayName: string };
type Assignment = { className: string; clerkUserId: string; name: string; email: string };

export default function ClassAllocationTeacherEditor({
  onSaved,
}: {
  onSaved?: (message: string) => void;
}) {
  const [classes, setClasses] = useState<string[]>([]);
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customClass, setCustomClass] = useState("");

  const userById = useMemo(() => {
    const map = new Map<string, ClerkUser>();
    for (const u of users) map.set(u.clerkUserId, u);
    return map;
  }, [users]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/toolbox/class-allocation/teachers", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur chargement");
      setClasses(j.classes || []);
      setUsers(j.users || []);
      const map: Record<string, string> = {};
      for (const a of (j.config?.assignments || []) as Assignment[]) {
        map[a.className] = a.clerkUserId;
      }
      setAssignments(map);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const payload = Object.entries(assignments)
        .filter(([, clerkUserId]) => clerkUserId)
        .map(([className, clerkUserId]) => {
          const u = userById.get(clerkUserId);
          return {
            className,
            clerkUserId,
            name: u?.displayName || "",
            email: u?.email || "",
          };
        })
        .filter((a) => a.name && a.email);
      const res = await fetch("/api/toolbox/class-allocation/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: payload }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur enregistrement");
      onSaved?.("Professeurs par classe enregistrés.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function importFromStages() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/toolbox/class-allocation/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_from_stages" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Import impossible");
      onSaved?.("Liste importée depuis les référents stages.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function addClass() {
    const name = customClass.trim();
    if (!name || classes.includes(name)) {
      setCustomClass("");
      return;
    }
    setClasses((prev) => [...prev, name].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })));
    setCustomClass("");
  }

  if (loading) return <p className="text-sm text-slate-500">Chargement des professeurs par classe…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Chaque professeur principal ne verra que les élèves de sa ou ses classes dans la saisie interne.
        Vous pouvez importer la liste déjà configurée dans Stages.
      </p>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void importFromStages()}
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 disabled:opacity-50"
        >
          Importer depuis Stages
        </button>
        <div className="flex gap-2">
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ajouter une classe"
            value={customClass}
            onChange={(e) => setCustomClass(e.target.value)}
          />
          <button type="button" onClick={addClass} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
            Ajouter
          </button>
        </div>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-3">
        {classes.length === 0 && <p className="text-sm text-slate-500">Aucune classe listée.</p>}
        {classes.map((className) => (
          <label key={className} className="grid gap-2 rounded-lg bg-white px-3 py-2 sm:grid-cols-[120px_1fr] sm:items-center">
            <span className="text-sm font-bold text-slate-800">{className}</span>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={assignments[className] || ""}
              onChange={(e) =>
                setAssignments((prev) => {
                  const next = { ...prev };
                  if (!e.target.value) delete next[className];
                  else next[className] = e.target.value;
                  return next;
                })
              }
            >
              <option value="">— Professeur —</option>
              {users.map((u) => (
                <option key={u.clerkUserId} value={u.clerkUserId}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "Enregistrement…" : "Enregistrer les affectations"}
      </button>
    </div>
  );
}
