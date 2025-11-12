"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function AdminRoomPage() {
  const { user, isLoaded } = useUser();
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const roomsRes = await fetch("/api/reservation-rooms/rooms");
      const { rooms } = await roomsRes.json();
      setRooms(rooms);

      const resRes = await fetch("/api/reservation-rooms/reservations");
      const { reservations } = await resRes.json();
      setReservations(reservations);
    }
    fetchData();
  }, []);

  async function handleAction(id: string, action: string) {
    const res = await fetch("/api/reservation-rooms/reservations/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: id, action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReservations(prev =>
        prev.map(r => (r.id === id ? updated.reservation : r))
      );
    }
  }

  if (!isLoaded) return <p>Chargement...</p>;
  if (!user) return <p>Veuillez vous connecter</p>;
  const roles = (user.publicMetadata?.roles || []) as string[];
  if (!roles.includes("admin-room"))
    return <p className="text-red-500">Accès réservé à l’administration</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Réservations</h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Date / Heure</th>
            <th className="p-2 border">Salle</th>
            <th className="p-2 border">Utilisateur</th>
            <th className="p-2 border">Statut</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="p-2">
                {new Date(r.startsAt).toLocaleString("fr-FR")} →{" "}
                {new Date(r.endsAt).toLocaleTimeString("fr-FR")}
              </td>
              <td className="p-2">
                {rooms.find(x => x.id === r.roomId)?.name || r.roomId}
              </td>
              <td className="p-2">{r.userName}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleAction(r.id, "confirm")}
                  className="px-2 py-1 bg-green-500 text-white rounded"
                >
                  ✅ Confirmer
                </button>
                <button
                  onClick={() => handleAction(r.id, "block")}
                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  🚫 Bloquer
                </button>
                <button
                  onClick={() => handleAction(r.id, "cancel")}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  ❌ Annuler
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
