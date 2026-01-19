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
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const lastName = (user?.lastName ?? "").toUpperCase();
  const ADMIN_LASTNAMES = ["HACQUEVILLE-MATHI", "FORTINEAU", "MARTIN"];
  const firstName = user?.firstName ?? "";
  useEffect(() => {
    async function load() {
      try {
        const roomsRes = await fetch("/api/reservation-rooms/rooms");
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(roomsData.rooms || []);
        }
        const resRes = await fetch("/api/reservation-rooms/reservations");
        if (resRes.ok) {
          const resData = await resRes.json();
          setReservations(resData.reservations || resData || []);
        }
      } catch (error) {
        console.error("Erreur au chargement des données :", error);
      }
    }
    load();
  }, []);
  if (!isLoaded) return <p className="p-8 text-center">Chargement du profil...</p>;
  if (!user) return <p className="p-8 text-center">Veuillez vous connecter</p>;
  function getReservation(hour: number) {
    return reservations.find(
      (r) =>
        r.roomId === selectedRoom &&
        r.startsAt.startsWith(selectedDate) &&
        r.status !== "CANCELLED" &&
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
        firstName: firstName,
        lastName: lastName,
        email: user?.primaryEmailAddress?.emailAddress
      }),
    });
    if (res.ok) {
      alert("✅ Réservation confirmée !");
      const newRes = await res.json();
      setReservations([...reservations, newRes.reservation]);
      setSelectedHour(null);
    } else {
      const err = await res.json();
      alert("Erreur : " + (err.error || "inconnue"));
    }
  }
  async function handleDeleteReservation(reservation: any) {
    const reason = prompt(
      `Motif de l'annulation pour ${reservation.firstName} ${reservation.lastName} :`, 
      "Indisponibilité exceptionnelle de la salle"
    );
    if (reason === null) return; 
    if (!confirm("Confirmer la suppression et l'envoi du mail d'alerte ?")) return;
    const res = await fetch("/api/reservation-rooms/reservations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        startsAt: reservation.startsAt,
        reason: reason,
        userEmail: reservation.email
      }),
    });
    if (res.ok) {
      alert("🗑️ Réservation annulée et mail envoyé.");
      setReservations(reservations.filter((r) => r.startsAt !== reservation.startsAt));
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
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Réserver une salle</h1>
      {ADMIN_LASTNAMES.includes(lastName) && (
        <button onClick={downloadJSON} className="mb-6 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full font-medium transition shadow">
          ⬇️ Télécharger la base de données (JSON)
        </button>
      )}

      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border mb-6">
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Salle</label>
          <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="border rounded w-full p-2 text-black bg-white">
            <option value="">-- Choisir une salle --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold text-gray-700">Date</label>
          <input 
            type="date" 
            value={selectedDate} 
            min={new Date().toISOString().split("T")[0]} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="border rounded w-full p-2 text-black bg-white"
          />
        </div>
      </div>

      {selectedRoom && selectedDate && (
        <div className="animate-in fade-in duration-300">
          <h2 className="font-bold mb-3 text-gray-700">Créneaux disponibles</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {HOURS.map((hour) => {
              const res = getReservation(hour);
              const isBooked = !!res;
              const isSelected = selectedHour === hour;
              
              return (
                <div key={hour} className="flex flex-col border rounded-lg p-2 bg-white shadow-sm border-gray-200">
                  <button 
                    disabled={isBooked} 
                    onClick={() => setSelectedHour(hour)} 
                    className={`p-2 rounded text-sm font-bold text-white transition-all ${ isBooked ? "bg-gray-300 cursor-not-allowed" : isSelected ? "bg-green-600 scale-105" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {hour}:30 - {hour + 1}:30
                  </button>
                  
                  {isBooked && (
                    <div className="mt-2 text-center">
                      <p className="text-[10px] text-gray-500 font-medium truncate italic">Occupé : {res.firstName} {res.lastName}</p>
                      {ADMIN_LASTNAMES.includes(lastName) && (
                        <button 
                          onClick={() => handleDeleteReservation(res)} 
                          className="mt-1 w-full text-[9px] uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 py-1 rounded-md hover:bg-red-600 hover:text-white transition"
                        >
                          Annuler & Prévenir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedHour !== null && (
            <button onClick={handleConfirm} className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg transform active:scale-95">
              Confirmer la réservation pour {selectedHour}:30
            </button>
          )}
        </div>
      )}
    </div>
  );
}