"use client";

import { useState, useEffect } from "react";
import { useData } from "../contexts/data";
import Image from "next/image";

type Travels = { id: number; name: string; img: string; date: string; validated: boolean; description: string; company: string; to: string};

export default function Page() {
  const [futureTravels, setFutureTravels] = useState<Travels[]>([]);
  const { travels } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [selectedTravelId, setSelectedTravelId] = useState<number | null>(null);
  const [profName, setProfName] = useState<string>("");
  const [profName2, setProfName2] = useState<string>("");
  const [profEmail, setProfEmail] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [dateAller, setDateAller] = useState<string>("");
  const [heureAller, setHeureAller] = useState<string>("");
  const [dateRetour, setDateRetour] = useState<string>("");
  const [heureRetour, setHeureRetour] = useState<string>("");
  const [nombreAcc, setNombreAcc] = useState<number | string>("");
  const [nombreEleves, setNombreEleves] = useState<number | string>("");
  const [details, setDetails] = useState<string>("");
  useEffect(() => {
    if (!travels || travels.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredTravels = travels
      .filter((travel) => parseDate(travel.date) >= today)
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    setFutureTravels(filteredTravels);
  }, [travels]);
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !selectedTravelId || !profName || !profEmail) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("travelId", String(selectedTravelId));
    formData.append("travelName", travels.find((t) => t.id === selectedTravelId)?.name || "");
    formData.append("name", profName);
    formData.append("email", profEmail);
    try {
      const response = await fetch("/api/emailTravels", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert(data.message);
      setFile(null);
      setSelectedTravelId(null);
      setProfName("");
      setProfEmail("");
    } catch (error) {
      console.error("Erreur lors de l’envoi du message:", error);
    }
  };
  const handleSecondFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!destination || !dateAller || !heureAller || !dateRetour || !heureRetour || !nombreAcc || !nombreEleves) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    const formData = new FormData();
    formData.append("name", profName2);
    formData.append("destination", destination);
    formData.append("dateAller", dateAller);
    formData.append("heureAller", heureAller);
    formData.append("dateRetour", dateRetour);
    formData.append("heureRetour", heureRetour);
    formData.append("nombreAcc", String(nombreAcc));
    formData.append("nombreEleves", String(nombreEleves));
    formData.append("details", details);
    try {
      const response = await fetch("/api/sendTravelRequest", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert(data.message);
      setProfName2("");
      setDestination("");
      setDateAller("");
      setHeureAller("");
      setDateRetour("");
      setHeureRetour("");
      setNombreAcc("");
      setNombreEleves("");
      setDetails("");
    } catch (error) {
      console.error("Erreur lors de l’envoi de la demande de voyage:", error);
    }
  };
  return (
    <main className="container mx-auto p-4 max-w-[1200px] sm:pt-[10vh] md:pt-[10vh]">
      <h1 className="text-3xl font-bold mb-6">Transports scolaires</h1>
      <div className="grid sm:grid-cols-1 grid-cols-3 md:grid-cols-2 gap-6">
        {futureTravels.map((travel) => (
          <div key={travel.id} className="bg-white p-4 rounded-lg shadow-lg flex flex-col gap-2 items-center h-full relative">
            <div className={`absolute top-2 right-2 text-white px-3 py-1 rounded-full ${travel.validated ? "bg-green-500" : "bg-orange-500"}`}>
              {travel.validated ? "Validé" : "En attente"}
            </div>
            <Image src={travel.img} alt={travel.name} width={1500} height={800} quality={100} className="rounded-lg h-[250px] mb-4 object-cover" />
            <div className="mb-4">
              <Image src={travel.company} alt="Logo de la compagnie" width={100} height={80} className="h-[50px] object-cover"/>
            </div>
            <h2 className="text-xl font-semibold mb-2">{travel.name}</h2>
            <p className="text-gray-600 mb-2">Date : {travel.date}</p>
            <p className="text-gray-600 mb-2">Professeur demandeur : {travel.to}</p>
            <p className="text-gray-700">{travel.description}</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
              <input type="text" placeholder="Votre nom" value={profName} onChange={(e) => setProfName(e.target.value)} className="mb-2 p-2 border border-gray-300 rounded w-full" required />
              <input type="email" placeholder="Votre email" value={profEmail} onChange={(e) => setProfEmail(e.target.value)} className="mb-2 p-2 border border-gray-300 rounded w-full" required/>
              <input type="file" onChange={handleFileChange} accept="application/pdf" className="mb-4" required/>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setSelectedTravelId(travel.id)}>Envoyer la pièce jointe</button>
            </form>
          </div>
        ))}
      </div>
      <h2 className="text-2xl font-bold mt-10 max-w-[600px] mx-auto">Demande de voyage</h2>
      <form onSubmit={handleSecondFormSubmit} className="mt-4 flex flex-col gap-2 max-w-[600px] mx-auto">
        <label>Nom du professeur</label>
        <input type="text" className="p-2 border border-gray-300 rounded" required onChange={(e) => setProfName2(e.target.value)} value={profName} />
        <label>Destination</label>
        <input type="text" className="p-2 border border-gray-300 rounded" required onChange={(e) => setDestination(e.target.value)} value={destination} />
        <label>Date d&apos;aller</label>
        <input type="date" className="p-2 border border-gray-300 rounded" required onChange={(e) => setDateAller(e.target.value)} value={dateAller} />
        <label>Heure de départ</label>
        <input type="time" className="p-2 border border-gray-300 rounded" required onChange={(e) => setHeureAller(e.target.value)} value={heureAller} />
        <label>Date de retour</label>
        <input type="date" className="p-2 border border-gray-300 rounded" required onChange={(e) => setDateRetour(e.target.value)} value={dateRetour} />
        <label>Heure de retour</label>
        <input type="time" className="p-2 border border-gray-300 rounded" required onChange={(e) => setHeureRetour(e.target.value)} value={heureRetour} />
        <label>Nombre d&apos;élèves</label>
        <input type="number" className="p-2 border border-gray-300 rounded" required onChange={(e) => setNombreAcc(e.target.value)} value={nombreAcc} />
        <label>Nombre d&apos;accompagnateurs</label>
        <input type="number" className="p-2 border border-gray-300 rounded" required onChange={(e) => setNombreEleves(e.target.value)} value={nombreEleves} />
        <label>Détails ou autres demandes</label>
        <textarea className="p-2 border border-gray-300 rounded" onChange={(e) => setDetails(e.target.value)} value={details}></textarea>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Envoyer la demande</button>
      </form>
    </main>
  );
}









