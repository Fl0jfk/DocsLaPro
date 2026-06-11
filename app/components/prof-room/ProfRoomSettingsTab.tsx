"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PROF_ROOM_SUBJECT_COLORS } from "@/app/lib/prof-room-defaults";
import { PROF_ROOM_COLOR_PRESETS } from "@/app/lib/prof-room-subject-colors";
import SubjectColorEditor from "./SubjectColorEditor";

type Room = { id: string; name: string; building?: string };

type ModuleConfig = {
  classesByPole: Record<string, string[]>;
  subjectColors: Record<string, string>;
  bookingHorizonDays: number;
};

function slugifyRoomId(name: string): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `salle-${Date.now()}`;
  return base;
}

function uniqueRoomId(name: string, rooms: Room[], skipIdx?: number): string {
  const base = slugifyRoomId(name);
  const used = new Set(
    rooms.filter((_, i) => i !== skipIdx).map((r) => r.id),
  );
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export default function ProfRoomSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [config, setConfig] = useState<ModuleConfig>({
    classesByPole: {},
    subjectColors: {},
    bookingHorizonDays: 56,
  });
  const [newSubject, setNewSubject] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(PROF_ROOM_COLOR_PRESETS[0].value);
  const [newPoleName, setNewPoleName] = useState("");
  const [newClassByPole, setNewClassByPole] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [roomsRes, configRes] = await Promise.all([
          fetch("/api/reservation-rooms/rooms"),
          fetch("/api/reservation-rooms/module-config"),
        ]);
        const roomsJson = await roomsRes.json();
        const configJson = await configRes.json();
        if (!roomsRes.ok) throw new Error(roomsJson.error || "Salles introuvables");
        if (!configRes.ok) throw new Error(configJson.error || "Configuration introuvable");
        setRooms(roomsJson.rooms || []);
        const loaded = configJson.config || { classesByPole: {}, subjectColors: {}, bookingHorizonDays: 56 };
        setConfig({
          ...loaded,
          subjectColors: { ...DEFAULT_PROF_ROOM_SUBJECT_COLORS, ...loaded.subjectColors },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveRooms = async () => {
    setSaving(true);
    setError(null);
    try {
      const normalized = rooms
        .filter((room) => room.name.trim())
        .map((room, idx) => {
          const name = room.name.trim();
          const isNew = !room.id || /^salle-\d+$/.test(room.id);
          return {
            ...room,
            name,
            id: isNew ? uniqueRoomId(name, rooms, idx) : room.id.trim(),
          };
        });
      const res = await fetch("/api/reservation-rooms/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: normalized }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Échec enregistrement salles");
      setRooms(normalized);
      alert("Salles enregistrées.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const saveModuleConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reservation-rooms/module-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Échec enregistrement");
      if (j.config) setConfig(j.config);
      alert("Paramètres enregistrés.");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const addSubject = () => {
    const name = newSubject.trim().toUpperCase();
    if (!name) return;
    if (config.subjectColors[name]) {
      alert("Cette matière existe déjà.");
      return;
    }
    setConfig({
      ...config,
      subjectColors: { ...config.subjectColors, [name]: newSubjectColor },
    });
    setNewSubject("");
  };

  const removeSubject = (name: string) => {
    if (!confirm(`Supprimer la matière « ${name} » ?`)) return;
    const next = { ...config.subjectColors };
    delete next[name];
    setConfig({ ...config, subjectColors: next });
  };

  const addPole = () => {
    const name = newPoleName.trim().toUpperCase();
    if (!name) return;
    if (config.classesByPole[name]) {
      alert("Ce pôle existe déjà.");
      return;
    }
    setConfig({
      ...config,
      classesByPole: { ...config.classesByPole, [name]: [] },
    });
    setNewPoleName("");
  };

  const addClassToPole = (pole: string) => {
    const cls = (newClassByPole[pole] || "").trim().toUpperCase();
    if (!cls) return;
    const list = config.classesByPole[pole] || [];
    if (list.includes(cls)) return;
    setConfig({
      ...config,
      classesByPole: { ...config.classesByPole, [pole]: [...list, cls] },
    });
    setNewClassByPole({ ...newClassByPole, [pole]: "" });
  };

  const removeClassFromPole = (pole: string, cls: string) => {
    setConfig({
      ...config,
      classesByPole: {
        ...config.classesByPole,
        [pole]: (config.classesByPole[pole] || []).filter((c) => c !== cls),
      },
    });
  };

  if (loading) {
    return <p className="p-10 text-center text-slate-500 font-bold">Chargement du paramétrage…</p>;
  }

  return (
    <div className="space-y-8 px-4">
      {error && <p className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

      <section className="bg-white rounded-3xl border p-6 space-y-4">
        <h2 className="text-lg font-black text-slate-900">Salles</h2>
        <p className="text-sm text-slate-500">Ajoutez ou modifiez les salles disponibles à la réservation.</p>
        {rooms.map((room, idx) => (
          <div key={room.id || idx} className="flex gap-2">
            <input
              className="flex-1 border rounded-xl p-3 text-sm font-bold"
              placeholder="Nom de la salle (ex: Salle informatique)"
              value={room.name}
              onChange={(e) => {
                const next = [...rooms];
                next[idx] = { ...room, name: e.target.value };
                setRooms(next);
              }}
            />
            <button
              type="button"
              onClick={() => setRooms(rooms.filter((_, i) => i !== idx))}
              className="text-red-600 text-sm font-bold px-3 shrink-0"
            >
              Supprimer
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button
            type="button"
            className="text-blue-600 font-bold text-sm"
            onClick={() =>
              setRooms([...rooms, { id: `salle-${Date.now()}`, name: "" }])
            }
          >
            + Ajouter une salle
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={saveRooms}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
          >
            Enregistrer les salles
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl border p-6 space-y-4">
        <h2 className="text-lg font-black text-slate-900">Matières & couleurs</h2>
        <p className="text-sm text-slate-500">
          Choisissez un preset ou une couleur personnalisée via le sélecteur ({Object.keys(config.subjectColors).length}{" "}
          matières).
        </p>
        <div className="space-y-2">
          {Object.entries(config.subjectColors).map(([name, colorValue]) => (
            <SubjectColorEditor
              key={name}
              label={name}
              value={colorValue}
              onChange={(next) =>
                setConfig({
                  ...config,
                  subjectColors: { ...config.subjectColors, [name]: next },
                })
              }
              onRemove={() => removeSubject(name)}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3 pt-2 border-t">
          <input
            className="w-full border rounded-xl p-3 text-sm font-bold uppercase"
            placeholder="Nouvelle matière"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />
          <SubjectColorEditor
            label="Aperçu"
            value={newSubjectColor}
            onChange={setNewSubjectColor}
          />
          <button
            type="button"
            onClick={addSubject}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm self-start"
          >
            Ajouter la matière
          </button>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={saveModuleConfig}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
        >
          Enregistrer matières & classes
        </button>
      </section>

      <section className="bg-white rounded-3xl border p-6 space-y-4">
        <h2 className="text-lg font-black text-slate-900">Classes par pôle</h2>
        <p className="text-sm text-slate-500">Organisez les classes proposées selon le niveau (École, Collège, Lycée…).</p>
        {Object.entries(config.classesByPole).map(([pole, classes]) => (
          <div key={pole} className="border rounded-2xl p-4 space-y-3">
            <p className="font-black text-sm text-slate-700 uppercase">{pole}</p>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <span
                  key={cls}
                  className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold"
                >
                  {cls}
                  <button
                    type="button"
                    onClick={() => removeClassFromPole(pole, cls)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg p-2 text-sm font-bold uppercase"
                placeholder="Nouvelle classe"
                value={newClassByPole[pole] || ""}
                onChange={(e) => setNewClassByPole({ ...newClassByPole, [pole]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addClassToPole(pole)}
              />
              <button
                type="button"
                onClick={() => addClassToPole(pole)}
                className="text-blue-600 font-bold text-sm px-3"
              >
                + Classe
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-2 pt-2 border-t">
          <input
            className="flex-1 border rounded-xl p-3 text-sm font-bold uppercase"
            placeholder="Nouveau pôle (ex: COLLÈGE)"
            value={newPoleName}
            onChange={(e) => setNewPoleName(e.target.value)}
          />
          <button
            type="button"
            onClick={addPole}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm"
          >
            Ajouter pôle
          </button>
        </div>
        <div className="pt-2">
          <label className="block text-sm font-bold text-slate-600 mb-1">
            Horizon de réservation (jours, professeurs)
          </label>
          <input
            type="number"
            min={7}
            max={365}
            className="w-32 border rounded-xl p-3 text-sm font-bold"
            value={config.bookingHorizonDays}
            onChange={(e) =>
              setConfig({ ...config, bookingHorizonDays: parseInt(e.target.value, 10) || 56 })
            }
          />
        </div>
      </section>
    </div>
  );
}
