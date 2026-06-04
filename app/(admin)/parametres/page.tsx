"use client";

import { useEffect, useState } from "react";
import RequireOrgAdmin from "@/app/components/RequireOrgAdmin";
import { useIsTenantOrgAdmin } from "@/app/hooks/useIsTenantOrgAdmin";

type Tab = "tenant" | "establishments" | "notifications" | "mef" | "rooms" | "prof-room";

type MefSecteursConfig = { lycee: string[]; college: string[]; ecole: string[] };

function linesToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(arr: string[]): string {
  return (arr || []).join("\n");
}

export default function ParametresPage() {
  const isOrgAdmin = useIsTenantOrgAdmin();
  const [tab, setTab] = useState<Tab>("tenant");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Record<string, unknown>>({});
  const [establishments, setEstablishments] = useState<
    Array<{
      id: string;
      label: string;
      directorName: string;
      directorEmail: string;
      clerkRoleSlugs: string;
      active: boolean;
    }>
  >([]);
  const [notifications, setNotifications] = useState<Record<string, unknown>>({});
  const [rooms, setRooms] = useState<Array<{ id: string; name: string; building?: string }>>([]);
  const [mefLycee, setMefLycee] = useState("");
  const [mefCollege, setMefCollege] = useState("");
  const [mefEcole, setMefEcole] = useState("");
  const [mefMessage, setMefMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOrgAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Chargement impossible");
        setIdentity(j.config?.identity || {});
        setEstablishments(
          (j.config?.establishments || []).map((e: Record<string, unknown>) => ({
            id: String(e.id || ""),
            label: String(e.label || ""),
            directorName: String(e.directorName || ""),
            directorEmail: String(e.directorEmail || ""),
            clerkRoleSlugs: Array.isArray(e.clerkRoleSlugs) ? (e.clerkRoleSlugs as string[]).join(", ") : "",
            active: e.active !== false,
          })),
        );
        setNotifications(j.config?.notifications || {});
        const rRes = await fetch("/api/reservation-rooms/rooms");
        const rj = await rRes.json();
        if (rRes.ok) setRooms(rj.rooms || []);
        const mRes = await fetch("/api/mef-secteurs");
        const mj = await mRes.json();
        if (mRes.ok && mj.config) {
          const c = mj.config as MefSecteursConfig;
          setMefLycee(listToLines(c.lycee));
          setMefCollege(listToLines(c.college));
          setMefEcole(listToLines(c.ecole));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOrgAdmin]);

  const saveSection = async (section: string, body: unknown) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/${section}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Échec enregistrement");
      alert("Enregistré.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-10 text-center text-slate-500">Chargement des paramètres…</p>;

  return (
    <RequireOrgAdmin>
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres généraux</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["tenant", "Identité"],
            ["establishments", "Établissements"],
            ["notifications", "Notifications"],
            ["mef", "Formations MEF"],
            ["rooms", "Salles"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === k ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tenant" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <label className="block text-sm font-bold text-slate-600">Nom du groupe</label>
          <input
            className="w-full border rounded-xl p-3"
            value={String(identity.name || "")}
            onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
          />
          <label className="block text-sm font-bold text-slate-600">Nom court</label>
          <input
            className="w-full border rounded-xl p-3"
            value={String(identity.shortName || "")}
            onChange={(e) => setIdentity({ ...identity, shortName: e.target.value })}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => saveSection("tenant", identity)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            Enregistrer l&apos;identité
          </button>
        </div>
      )}

      {tab === "establishments" && (
        <div className="space-y-4">
          {establishments.map((est, idx) => (
            <div key={est.id || idx} className="bg-white rounded-2xl border p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded-lg p-2 text-sm"
                  placeholder="ID (ecole, college…)"
                  value={est.id}
                  onChange={(e) => {
                    const next = [...establishments];
                    next[idx] = { ...est, id: e.target.value };
                    setEstablishments(next);
                  }}
                />
                <input
                  className="border rounded-lg p-2 text-sm"
                  placeholder="Libellé"
                  value={est.label}
                  onChange={(e) => {
                    const next = [...establishments];
                    next[idx] = { ...est, label: e.target.value };
                    setEstablishments(next);
                  }}
                />
              </div>
              <input
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Nom direction"
                value={est.directorName}
                onChange={(e) => {
                  const next = [...establishments];
                  next[idx] = { ...est, directorName: e.target.value };
                  setEstablishments(next);
                }}
              />
              <input
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Email direction"
                value={est.directorEmail}
                onChange={(e) => {
                  const next = [...establishments];
                  next[idx] = { ...est, directorEmail: e.target.value };
                  setEstablishments(next);
                }}
              />
              <input
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Rôles Clerk (séparés par des virgules)"
                value={est.clerkRoleSlugs}
                onChange={(e) => {
                  const next = [...establishments];
                  next[idx] = { ...est, clerkRoleSlugs: e.target.value };
                  setEstablishments(next);
                }}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={est.active}
                  onChange={(e) => {
                    const next = [...establishments];
                    next[idx] = { ...est, active: e.target.checked };
                    setEstablishments(next);
                  }}
                />
                Actif
              </label>
            </div>
          ))}
          <button
            type="button"
            className="text-indigo-600 font-bold text-sm"
            onClick={() =>
              setEstablishments([
                ...establishments,
                { id: "", label: "", directorName: "", directorEmail: "", clerkRoleSlugs: "", active: true },
              ])
            }
          >
            + Ajouter un établissement
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              saveSection("establishments", {
                establishments: establishments.map((e) => ({
                  ...e,
                  clerkRoleSlugs: e.clerkRoleSlugs.split(",").map((s) => s.trim()).filter(Boolean),
                })),
              })
            }
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            Enregistrer les établissements
          </button>
        </div>
      )}

      {tab === "notifications" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <label className="block text-sm font-bold">Emails compta voyages (séparés par virgule)</label>
          <input
            className="w-full border rounded-xl p-3"
            value={Array.isArray(notifications.travelsCompta) ? (notifications.travelsCompta as string[]).join(", ") : ""}
            onChange={(e) =>
              setNotifications({
                ...notifications,
                travelsCompta: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          <label className="block text-sm font-bold">Email cuisine / restauration</label>
          <input
            className="w-full border rounded-xl p-3"
            value={String(notifications.travelsCuisine || "")}
            onChange={(e) => setNotifications({ ...notifications, travelsCuisine: e.target.value })}
          />
          <label className="block text-sm font-bold">Email ops HSE</label>
          <input
            className="w-full border rounded-xl p-3"
            value={String(notifications.hseOps || "")}
            onChange={(e) => setNotifications({ ...notifications, hseOps: e.target.value })}
          />
          <label className="block text-sm font-bold">Email ops photocopies couleur</label>
          <input
            className="w-full border rounded-xl p-3"
            value={String(notifications.photocopiesOps || "")}
            onChange={(e) => setNotifications({ ...notifications, photocopiesOps: e.target.value })}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => saveSection("notifications", notifications)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            Enregistrer les notifications
          </button>
        </div>
      )}

      {tab === "mef" && (
        <div className="bg-white rounded-2xl border p-6 space-y-5">
          <p className="text-sm text-slate-600">
            Table des formations (libellés ou codes MEF) pour l&apos;agent IA OneDrive : chaque{" "}
            <strong>organisation</strong> a son propre fichier sur S3 (
            <code className="text-xs bg-slate-100 px-1 rounded">settings/mef-secteurs.json</code>
            ). Une ligne = une formation. Les élèves sont rattachés via le champ <code className="text-xs">mef</code>{" "}
            de la liste élèves.
          </p>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Lycée</label>
            <textarea
              className="w-full border rounded-xl p-3 text-sm font-mono min-h-[140px]"
              placeholder={"2NDE GENERALE ET TECHNOLOGIQUE\nTERMINALE GENERALE\n…"}
              value={mefLycee}
              onChange={(e) => setMefLycee(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Collège</label>
            <textarea
              className="w-full border rounded-xl p-3 text-sm font-mono min-h-[120px]"
              placeholder={"6EME\n5EME\n3EME\n…"}
              value={mefCollege}
              onChange={(e) => setMefCollege(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">École</label>
            <textarea
              className="w-full border rounded-xl p-3 text-sm font-mono min-h-[160px]"
              placeholder={"Cycle 2 - COURS PREPARATOIRE\nCycle 1 - GRANDE SECTION\n…"}
              value={mefEcole}
              onChange={(e) => setMefEcole(e.target.value)}
            />
          </div>
          {mefMessage && (
            <p className={`text-sm ${mefMessage.startsWith("Erreur") ? "text-red-600" : "text-green-700"}`}>
              {mefMessage}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setMefMessage(null);
                setError(null);
                try {
                  const body: MefSecteursConfig = {
                    lycee: linesToList(mefLycee),
                    college: linesToList(mefCollege),
                    ecole: linesToList(mefEcole),
                  };
                  const res = await fetch("/api/mef-secteurs", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  const j = await res.json();
                  if (!res.ok) throw new Error(j.error || "Échec enregistrement");
                  setMefMessage(j.message || "Table MEF enregistrée.");
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Erreur";
                  setMefMessage("Erreur : " + msg);
                } finally {
                  setSaving(false);
                }
              }}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
            >
              Enregistrer les formations MEF
            </button>
            <label className="cursor-pointer text-sm font-bold text-indigo-600 hover:underline self-center">
              Importer un .json
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const parsed = JSON.parse(await f.text()) as MefSecteursConfig;
                    setMefLycee(listToLines(parsed.lycee || []));
                    setMefCollege(listToLines(parsed.college || []));
                    setMefEcole(listToLines(parsed.ecole || []));
                    setMefMessage("Fichier chargé dans le formulaire — cliquez sur Enregistrer pour pousser sur S3.");
                  } catch {
                    setMefMessage("Erreur : JSON invalide.");
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      )}

      {tab === "rooms" && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          {rooms.map((room, idx) => (
            <div key={room.id || idx} className="flex gap-2">
              <input
                className="flex-1 border rounded-lg p-2 text-sm"
                placeholder="ID salle"
                value={room.id}
                onChange={(e) => {
                  const next = [...rooms];
                  next[idx] = { ...room, id: e.target.value };
                  setRooms(next);
                }}
              />
              <input
                className="flex-[2] border rounded-lg p-2 text-sm"
                placeholder="Nom"
                value={room.name}
                onChange={(e) => {
                  const next = [...rooms];
                  next[idx] = { ...room, name: e.target.value };
                  setRooms(next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-indigo-600 font-bold text-sm"
            onClick={() => setRooms([...rooms, { id: `salle-${Date.now()}`, name: "Nouvelle salle" }])}
          >
            + Ajouter une salle
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const res = await fetch("/api/reservation-rooms/rooms", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rooms }),
                });
                const j = await res.json();
                if (!res.ok) throw new Error(j.error);
                alert("Salles enregistrées.");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur");
              } finally {
                setSaving(false);
              }
            }}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            Enregistrer les salles
          </button>
        </div>
      )}
    </div>
    </RequireOrgAdmin>
  );
}
