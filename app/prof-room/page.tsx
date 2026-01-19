"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const CLASSES_DATA: Record<string, string[]> = {
  "ÉCOLE": ["CP", "CE1", "CE2", "CM1", "CM2"],
  "COLLÈGE": [
    "6A", "6B", "6C", "6D", "6E", 
    "5A", "5B", "5C", "5D", "5E", "5F", 
    "4A", "4B", "4C", "4D", "4E", "4F", 
    "3A", "3B", "3C", "3D", "3E"
  ],
  "LYCÉE": [
    "2A","2B","2C","2D","2E",
    "1A","1B","1C","1D","1E","1F",
    "TA", "TB", "TC", "TD", "TE", "TF"
  ],
  "MAINTENANCE": [
    "MAINTENANCE"
  ],
};

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);

export default function ProfRoomPage() {
  const { user, isLoaded } = useUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rooms, setRooms] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [className, setClassName] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [untilDate, setUntilDate] = useState("");
  const lastName = (user?.lastName ?? "").toUpperCase();
  const ADMIN_LASTNAMES = ["HACQUEVILLE-MATHI","FORTINEAU","DONA","DUMOUCHEL","PLANTEC","GUEDIN","LAINE"];
  const firstName = user?.firstName ?? "";
  const isAdmin = ADMIN_LASTNAMES.includes(lastName);
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  let maxDate = isAdmin ? "" : new Date(today.getTime() + 56 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  useEffect(() => {
    async function load() {
      try {
        const [roomsRes, resRes] = await Promise.all([
          fetch("/api/reservation-rooms/rooms"),
          fetch("/api/reservation-rooms/reservations")
        ]);
        if (roomsRes.ok) setRooms((await roomsRes.json()).rooms || []);
        if (resRes.ok) setReservations((await resRes.json()).reservations || []);
      } catch (error) { console.error(error); }
    }
    load();
  }, []);
  if (!isLoaded || !user) return <p className="p-8 text-center font-bold">Chargement...</p>;
  const upcomingReservations = reservations.filter(r => r.status !== "CANCELLED" && new Date(r.startsAt) >= new Date()).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  function getReservation(hour: number) { return reservations.find(r => r.roomId === selectedRoom && r.startsAt.startsWith(selectedDate) && r.status !== "CANCELLED" && new Date(r.startsAt).getHours() === hour)}
  const toggleHour = (hour: number) => {
    setSelectedHours(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDeleteReservation(reservation: any) {
    const reason = prompt(`Motif de l'annulation :`, "Indisponibilité exceptionnelle");
    if (reason === null) return; 
    if (!confirm("Confirmer la suppression ?")) return;
    const res = await fetch("/api/reservation-rooms/reservations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        startsAt: reservation.startsAt, 
        reason, 
        userEmail: reservation.email 
      }),
    });
    if (res.ok) {
      alert("🗑️ Réservation annulée.");
      setReservations(prev => prev.filter((r) => r.id !== reservation.id));
    } else {
      alert("Erreur lors de la suppression.");
    }
  }
  async function handleConfirm() {
    if (!selectedHours.length || !selectedRoom || !selectedDate || !subject || !className) {
      alert("Veuillez remplir tous les champs."); return;
    }
    const res = await fetch("/api/reservation-rooms/reservations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: selectedRoom, selectedHours, date: selectedDate, subject, className, recurrence, untilDate, firstName, lastName, email: user?.primaryEmailAddress?.emailAddress }),
    });
    if (res.ok) { alert("✅ Confirmé !"); window.location.reload(); }
  }
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8">
      {isAdmin && (
        <div className="bg-white border-2 border-purple-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
            <h2 className="font-bold text-lg">Liste des créneaux réservés</h2>
            <span className="text-xs bg-purple-500 px-2 py-1 rounded-full uppercase font-bold tracking-tighter">Mode Admin</span>
          </div>
          <div className="max-h-[350px] overflow-y-auto p-2 space-y-2">
            {upcomingReservations.length === 0 ? (
              <p className="p-4 text-center text-gray-400 italic">Aucune réservation à venir.</p>
            ) : (
              upcomingReservations.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{new Date(res.startsAt).toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' })} - {new Date(res.startsAt).getHours()}h30</p>
                    <p className="text-md font-black text-purple-700 uppercase leading-none my-1">
                      {res.subject} / {res.className}
                    </p>
                    <p className="text-[10px] text-gray-400">👤 {res.lastName} — 📍 {rooms.find(r => r.id === res.roomId)?.name}</p>
                  </div>
                  <button  onClick={() => handleDeleteReservation(res)} className="ml-4 px-3 py-2 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg uppercase hover:bg-red-600 hover:text-white transition">Annuler</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <div className="bg-white border rounded-2xl shadow-sm p-6 sm:px-2">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 sm:pl-4">Réserver une salle</h1>
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border mb-6 text-black">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block mb-1 text-sm font-bold text-gray-600">Matière</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="border-gray-200 rounded-lg w-full p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Choisir --</option>
                <option value="MATHS">MATHÉMATIQUES</option>
                <option value="FRANCAIS">FRANÇAIS</option>
                <option value="ANGLAIS">ANGLAIS</option>
                <option value="SVT/PHY">SCIENCES</option>
                <option value="HIST-GEO">HISTOIRE-GÉO</option>
                <option value="ARTS">ARTS / MUSIQUE</option>
                <option value="AUTRE">AUTRE</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-bold text-gray-600">Niveau</label>
              <select value={level} onChange={(e) => { setLevel(e.target.value); setClassName(""); }} className="border-gray-200 rounded-lg w-full p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600">
                <option value="">-- Choisir Niveau --</option>
                {Object.keys(CLASSES_DATA).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={`block mb-1 text-sm font-bold ${!level ? 'text-gray-300' : 'text-gray-600'}`}>Classe</label>
              <select  disabled={!level}  value={className} onChange={(e) => setClassName(e.target.value)} className={`border-gray-200 rounded-lg w-full p-2.5 bg-white outline-none ${!level ? 'bg-gray-100 cursor-not-allowed' : 'border-blue-200 ring-2 ring-blue-50'}`}>
                <option value="">-- Sélectionner --</option>
                {level && CLASSES_DATA[level].map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-bold text-gray-600">Salle</label>
              <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="border-gray-200 rounded-lg w-full p-2.5 bg-white outline-none">
                <option value="">-- Choisir --</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-2 border-t">
            <div>
              <label className="block mb-1 text-sm font-bold text-gray-600">Date</label>
              <input type="date" value={selectedDate} min={minDate} max={maxDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-gray-200 rounded-lg w-full p-2.5 bg-white outline-none"/>
            </div>
            <div>
              <label className="block mb-1 text-sm font-bold text-gray-600">Répéter</label>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="border-gray-200 rounded-lg w-full p-2.5 bg-white outline-none">
                <option value="none">Une seule fois</option>
                <option value="weekly">Toutes les semaines</option>
                <option value="biweekly">Toutes les 2 semaines</option>
              </select>
            </div>
          </div>
          {recurrence !== "none" && (
            <div className="animate-in fade-in duration-300">
              <label className="block mb-1 text-sm font-bold text-orange-600">Jusqu'au (date de fin)</label>
              <input type="date" value={untilDate} min={selectedDate} max={maxDate} onChange={(e) => setUntilDate(e.target.value)} className="border-orange-200 rounded-lg w-full p-2.5 bg-white outline-none focus:ring-2 focus:ring-orange-500 shadow-sm" />
            </div>
          )}
        </div>
        {selectedRoom && selectedDate && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="font-bold mb-3 text-gray-700">Sélectionner les heures</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {HOURS.map((hour) => {
                const res = getReservation(hour);
                const isSelected = selectedHours.includes(hour);
                return (
                  <div key={hour} className={`flex flex-col border rounded-xl p-2 transition-all ${res ? 'bg-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <button disabled={!!res} onClick={() => toggleHour(hour)}  className={`p-2 rounded-lg text-sm font-bold transition-all ${ res ? "bg-gray-300 text-gray-500" : isSelected ? "bg-green-600 text-white shadow-md scale-105" : "bg-blue-600 text-white hover:bg-blue-700"}`}>{hour}:30 - {hour + 1}:30</button>
                    {res && <div className="mt-2 text-center text-[10px] font-bold text-gray-700 uppercase">{res.subject} ({res.className})</div>}
                  </div>
                );
              })}
            </div>
            {selectedHours.length > 0 && (
              <button onClick={handleConfirm} className="w-full px-4 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg transform active:scale-95">Confirmer {selectedHours.length} créneau(x)</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}