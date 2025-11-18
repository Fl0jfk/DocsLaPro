"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const FRENCH_HOLIDAYS_2025 = ["2025-01-01","2025-04-21","2025-05-01","2025-05-08","2025-05-29","2025-06-09","2025-07-14","2025-08-15","2025-11-01","2025-11-11","2025-12-25"];

function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);

export default function ProfRoomPage() {
  const { user, isLoaded } = useUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rooms, setRooms] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const ADMIN_LASTNAMES = ["Hacqueville-Mathi", "Dupont", "Martin"];
  const lastName = user?.lastName ?? "";
  useEffect(() => {
    async function load() {
      const roomsRes = await fetch("/api/reservation-rooms/rooms");
      const roomsData = await roomsRes.json();
      setRooms(roomsData.rooms || []);
      const resRes = await fetch("/api/reservation-rooms/reservations");
      const resData = await resRes.json();
      setReservations(resData.reservations || []);
    }
    load();
  }, []);
  if (!isLoaded) return <p>Chargement...</p>;
  if (!user) return <p>Veuillez vous connecter</p>;
  function getReservation(hour: number) {
    return reservations.find(
      (r) =>
        r.roomId === selectedRoom &&
        r.startsAt.startsWith(selectedDate) &&
        new Date(r.startsAt).getHours() === hour
    );
  }
  async function handleConfirm() {
    if (selectedHour === null || !selectedRoom || !selectedDate) return;
    const start = new Date(`${selectedDate}T${selectedHour.toString().padStart(2, "0")}:00`);
    if (isWeekend(start) || FRENCH_HOLIDAYS_2025.includes(selectedDate)) {
      alert("⛔️ Impossible de réserver un week-end ou jour férié.");
      return;
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const res = await fetch("/api/reservation-rooms/reservations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: selectedRoom,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        firstName: user!.firstName || "",
        lastName: user!.lastName || "",
      }),
    });
    if (res.ok) {
      alert("✅ Réservation confirmée !");
      setReservations([
        ...reservations,
        {
          roomId: selectedRoom,
          startsAt: start.toISOString(),
          firstName: user!.firstName || "",
          lastName: user!.lastName || "",
        },
      ]);
      setSelectedHour(null);
    } else {
      const err = await res.json();
      alert("Erreur : " + (err.error || "inconnue"));
    }
  }
  async function handleDeleteReservation(startIso: string) {
    if (!confirm("Supprimer cette réservation ?")) return;
    const res = await fetch("/api/reservation-rooms/reservations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt: startIso }),
    });
    if (res.ok) {
      alert("🗑️ Réservation annulée");
      setReservations(reservations.filter((r) => r.startsAt !== startIso));
    } else {
      const err = await res.json();
      alert("Erreur : " + (err.error || "inconnue"));
    }
  }
  async function downloadJSON() {
    const res = await fetch("/api/reservation-rooms/reservations");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json",});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservations.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Réserver une salle</h1>
      {(ADMIN_LASTNAMES.includes(lastName)) && (
        <button onClick={downloadJSON} className="mb-6 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Télécharger la base de données des réservations (JSON)</button>
      )}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Salle</label>
        <select  value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="border rounded w-full p-2">
          <option value="">-- Choisir une salle --</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-6">
        <label className="block mb-1 font-medium">Date</label>
        <input type="date" value={selectedDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded w-full p-2"/>
      </div>
      {selectedRoom && selectedDate && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {HOURS.map((hour) => {
              const res = getReservation(hour);
              const isBooked = !!res;
              const isSelected = selectedHour === hour;
              return (
                <div key={hour} className="flex flex-col gap-1">
                  <button disabled={isBooked}  onClick={() => setSelectedHour(hour)}  className={`p-2 rounded text-white ${ isBooked ? "bg-gray-400 cursor-not-allowed" : isSelected ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                    {hour}:00 - {hour + 1}:00
                    {isBooked ? ` (${res.firstName} ${res.lastName})` : ""}
                  </button>
                  {isBooked && (ADMIN_LASTNAMES.includes(lastName)) && (
                    <button onClick={() => handleDeleteReservation(res.startsAt)} className="text-xs bg-red-600 text-white p-1 rounded hover:bg-red-700">Annuler</button>
                  )}
                </div>
              );
            })}
          </div>
          {selectedHour !== null && (
            <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Confirmer la réservation ({selectedHour}:00 - {selectedHour + 1}:00)</button>
          )}
        </>
      )}
    </div>
  );
}
