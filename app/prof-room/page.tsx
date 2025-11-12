"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const FRENCH_HOLIDAYS_2025 = [
  "2025-01-01",
  "2025-04-21",
  "2025-05-01",
  "2025-05-08",
  "2025-05-29",
  "2025-06-09",
  "2025-07-14",
  "2025-08-15",
  "2025-11-01",
  "2025-11-11",
  "2025-12-25",
];

function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export default function ProfRoomPage() {
  const { user, isLoaded } = useUser();
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [form, setForm] = useState({ roomId: "", date: "", hour: "08:00" });

  useEffect(() => {
    async function load() {
      const roomsRes = await fetch("/api/reservation-rooms/rooms");
      const { rooms } = await roomsRes.json();
      setRooms(rooms);

      const resRes = await fetch("/api/reservation-rooms/reservations");
      const { reservations } = await resRes.json();
      setReservations(reservations);
    }
    load();
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    const { roomId, date, hour } = form;
    const start = new Date(`${date}T${hour}:00`);

    if (isWeekend(start) || FRENCH_HOLIDAYS_2025.includes(date)) {
      alert("⛔️ Impossible de réserver un week-end ou jour férié.");
      return;
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const res = await fetch("/api/reservation-rooms/reservations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, startsAt: start, endsAt: end }),
    });

    if (res.ok) {
      alert("✅ Demande envoyée !");
      setForm({ roomId: "", date: "", hour: "08:00" });
    } else {
      const err = await res.json();
      alert("Erreur : " + (err.error || "inconnue"));
    }
  }

  if (!isLoaded) return <p>Chargement...</p>;
  if (!user) return <p>Veuillez vous connecter</p>;

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Réserver une salle</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
        <div>
          <label className="block mb-1 font-medium">Salle</label>
          <select
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            className="border rounded w-full p-2"
            required
          >
            <option value="">-- Choisir une salle --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border rounded w-full p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Heure de début</label>
          <input
            type="time"
            value={form.hour}
            onChange={(e) => setForm({ ...form, hour: e.target.value })}
            className="border rounded w-full p-2"
            required
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Envoyer la demande
        </button>
      </form>
    </div>
  );
}
