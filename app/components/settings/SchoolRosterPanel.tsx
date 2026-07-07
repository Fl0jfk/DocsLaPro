"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type ClerkUser = { clerkUserId: string; email: string; displayName: string };
type Assignment = { className: string; clerkUserId: string; name: string; email: string };
type Roster = { teacherCatalog: string[]; classAssignments: Assignment[]; updatedAt?: string };

export default function SchoolRosterPanel() {
  const [elevesCount, setElevesCount] = useState<number | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [teacherCatalogText, setTeacherCatalogText] = useState("");
  const [elevesSource, setElevesSource] = useState<"auto" | "pronote" | "ecoledirecte">("auto");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [customClass, setCustomClass] = useState("");
  const elevesInputRef = useRef<HTMLInputElement>(null);
  const teachersInputRef = useRef<HTMLInputElement>(null);

  const userById = useMemo(() => {
    const m = new Map<string, ClerkUser>();
    for (const u of users) m.set(u.clerkUserId, u);
    return m;
  }, [users]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/settings/roster", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setElevesCount(j.elevesCount ?? 0);
      setRoster(j.roster || null);
      setClasses(j.classes || []);
      setUsers(j.users || []);
      setTeacherCatalogText((j.roster?.teacherCatalog || []).join("\n"));
      const map: Record<string, string> = {};
      for (const a of (j.roster?.classAssignments || []) as Assignment[]) {
        map[a.className] = a.clerkUserId;
      }
      setAssignments(map);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function importEleves(file: File) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", elevesSource);
      const res = await fetch("/api/eleves/import", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Import impossible");
      setMsg(j.message || "Liste élèves mise à jour.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function importTeachers(file: File) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/settings/roster/teachers/import", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Import impossible");
      setMsg(j.message || "Professeurs par classe importés.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function saveRoster() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const classAssignments = Object.entries(assignments)
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
      const res = await fetch("/api/settings/roster", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherCatalog: teacherCatalogText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
          classAssignments,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setMsg("Référentiel enregistré et propagé à tous les modules (stages, répartition, certificats…).");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur");
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

  if (loading) return <p className="text-sm text-slate-500">Chargement du référentiel…</p>;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
        <h2 className="text-lg font-black text-slate-900">Référentiel scolaire global</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Une seule source de vérité pour tout le SaaS : listes élèves, professeurs par classe et catalogue profs.
          Les modules <strong>Stages</strong>, <strong>Certificats</strong>, <strong>Répartition des classes</strong>,{" "}
          <strong>Documents IA</strong> et autres s&apos;appuient sur ces données pour identifier les élèves de façon fiable.
        </p>
        {elevesCount != null && (
          <p className="mt-3 text-sm font-bold text-indigo-900">{elevesCount} élève(s) dans eleves.json</p>
        )}
      </div>

      {err && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{err}</p>}
      {msg && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</p>}

      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">1 — Liste des élèves (Excel → eleves.json)</h3>
        <p className="text-sm text-slate-600">
          Import fusionné : élèves reconnus (INE ou nom + prénom) mis à jour, nouveaux ajoutés, les autres conservés.
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 space-y-1">
          <p className="font-bold">Colonnes attendues : Nom, Prénom, Classe, INE, MEF, e-mail élève, e-mails responsables légaux (parent 1 et parent 2).</p>
          <p>Export Pronote ou École Directe — même logique que l&apos;ancien import Documents IA.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Source
            <select
              className="ml-2 rounded-lg border px-2 py-1 text-sm"
              value={elevesSource}
              onChange={(e) => setElevesSource(e.target.value as typeof elevesSource)}
            >
              <option value="auto">Auto</option>
              <option value="pronote">Pronote</option>
              <option value="ecoledirecte">École Directe</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => elevesInputRef.current?.click()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Importer Excel élèves
          </button>
        </div>
        <input
          ref={elevesInputRef}
          type="file"
          accept=".xlsx,.xls,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importEleves(f);
            e.target.value = "";
          }}
        />
      </section>

      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">2 — Professeurs par classe</h3>
        <p className="text-sm text-slate-600">
          Définit qui voit quels élèves pour <strong>préparer la classe</strong> (saisie interne répartition) et les
          référents stages. Un professeur principal ne voit que les élèves de sa ou ses classes assignées ici.
          Synchronisé automatiquement avec Stages.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => teachersInputRef.current?.click()}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-900 disabled:opacity-50"
          >
            Importer Excel profs / classes
          </button>
          <input
            className="rounded-xl border px-3 py-2 text-sm"
            placeholder="Ajouter une classe"
            value={customClass}
            onChange={(e) => setCustomClass(e.target.value)}
          />
          <button type="button" onClick={addClass} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold">
            Ajouter classe
          </button>
        </div>
        <p className="text-xs text-slate-500">Excel : colonnes <strong>Classe</strong> + <strong>Email</strong> (ou nom du professeur).</p>
        <input
          ref={teachersInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importTeachers(f);
            e.target.value = "";
          }}
        />
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          {classes.map((className) => (
            <label key={className} className="grid gap-2 rounded-lg bg-white px-3 py-2 sm:grid-cols-[120px_1fr] sm:items-center">
              <span className="text-sm font-bold text-slate-800">{className}</span>
              <select
                className="rounded-lg border px-2 py-1.5 text-sm"
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
      </section>

      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">3 — Catalogue professeurs (résolution IA)</h3>
        <p className="text-sm text-slate-600">
          Liste interne utilisée par l&apos;IA pour rattacher les noms tapés librement par les parents (vœux prof).
          Les parents ne voient jamais cette liste sur le formulaire public.
        </p>
        <textarea
          className="min-h-[120px] w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Un nom par ligne (ex. Mme Dupont, M. Martin…)"
          value={teacherCatalogText}
          onChange={(e) => setTeacherCatalogText(e.target.value)}
        />
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={() => void saveRoster()}
        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "Enregistrement…" : "Enregistrer le référentiel"}
      </button>

      <p className="text-xs text-slate-500">
        Dossiers OneDrive : après mise à jour des élèves, lancez la synchronisation depuis{" "}
        <Link href="/agentIAOCR" className="font-bold text-slate-700 underline">
          Documents IA
        </Link>
        . Table MEF : onglet <strong>Formations MEF</strong> ci-dessus.
      </p>
      {roster?.updatedAt && (
        <p className="text-xs text-slate-400">Dernière mise à jour profs : {new Date(roster.updatedAt).toLocaleString("fr-FR")}</p>
      )}
    </div>
  );
}
