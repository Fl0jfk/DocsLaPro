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
  const lastName = (user?.lastName ?? "").toUpperCase();
  const ADMIN_LASTNAMES = ["HACQUEVILLE-MATHI","FORTINEAU","DONA","DUMOUCHEL","PLANTEC","GUEDIN","LAINE"];
  const firstName = user?.firstName ?? "";
  const isAdmin = ADMIN_LASTNAMES.includes(lastName);
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
  if (!isLoaded) return <p className="p-8 text-center text-gray-500">Chargement du profil...</p>;
  if (!user) return <p className="p-8 text-center text-red-500 font-bold">Veuillez vous connecter</p>;
  const upcomingReservations = reservations
    .filter(r => r.status !== "CANCELLED" && new Date(r.startsAt) >= new Date())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
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
    const start = new Date(`${selectedDate}T${selectedHour.toString().padStart(2, "0")}:30`);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      alert("🗑️ Réservation annulée.");
      setReservations(reservations.filter((r) => r.startsAt !== reservation.startsAt));
    } else {
      const err = await res.json();
      alert("Erreur : " + (err.error || "inconnue"));
    }
  }
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8">
      {isAdmin && (
        <div className="bg-white border-2 border-purple-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
            <h2 className="font-bold text-lg">Prochaines Réservations</h2>
            <span className="text-xs bg-purple-500 px-2 py-1 rounded-full uppercase font-bold tracking-tighter">Admin Mode</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
            {upcomingReservations.length === 0 ? (
              <p className="p-4 text-center text-gray-400 italic">Aucune réservation à venir.</p>
            ) : (
              upcomingReservations.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">
                      {new Date(res.startsAt).toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(res.startsAt).getHours()}h30
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      📍 {rooms.find(r => r.id === res.roomId)?.name || res.roomId} — 👤 {res.firstName} {res.lastName}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteReservation(res)} className="ml-4 px-3 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase hover:bg-red-600 hover:text-white transition">Annuler</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Réserver une salle</h1>
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border mb-6">
          <div>
            <label className="block mb-1 text-sm font-bold text-gray-600">Sélectionner la salle</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="border-gray-200 rounded-lg w-full p-2.5 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">-- Choisir une salle --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-bold text-gray-600">Choisir la date</label>
            <input type="date"  value={selectedDate}  min={new Date().toISOString().split("T")[0]}  onChange={(e) => setSelectedDate(e.target.value)}  className="border-gray-200 rounded-lg w-full p-2.5 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>
        {selectedRoom && selectedDate && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <h2 className="font-bold mb-3 text-gray-700">Grille horaire</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {HOURS.map((hour) => {
                const res = getReservation(hour);
                const isBooked = !!res;
                const isSelected = selectedHour === hour;
                return (
                  <div key={hour} className={`flex flex-col border rounded-xl p-2 transition-all ${isBooked ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <button  disabled={isBooked} onClick={() => setSelectedHour(hour)}  className={`p-2 rounded-lg text-sm font-bold text-white transition-all ${ isBooked ? "bg-gray-300 cursor-not-allowed" : isSelected ? "bg-green-600 ring-4 ring-green-100" : "bg-blue-600 hover:bg-blue-700"}`}>{hour}:30 - {hour + 1}:30</button>
                    {isBooked && (
                      <div className="mt-2 text-center">
                        <p className="text-[10px] text-gray-500 font-bold truncate">📌 {res.firstName} {res.lastName}</p>
                        {isAdmin && (
                          <button onClick={() => handleDeleteReservation(res)} className="mt-1 w-full text-[9px] font-bold text-red-500 uppercase hover:underline">Annuler & Prévenir</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedHour !== null && (
              <button onClick={handleConfirm} className="w-full px-4 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg transform active:scale-95">Confirmer pour {selectedHour}:30</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}