"use client"

import { useState, useEffect } from "react";
import { useData } from "../contexts/data";

type Travels = {
  id: number;
  name: string;
  img: string;
  date: string;
  validated: string;
  description: string;
};

export default function Page() {
  const [futureTravels, setFutureTravels] = useState<Travels[]>([]);
  const { travels } = useData(); // Récupère les voyages depuis le contexte
  const [file, setFile] = useState<File | null>(null);
  const [selectedTravelId, setSelectedTravelId] = useState<number | null>(null);

  useEffect(() => {
    if (!travels || travels.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredTravels = travels
      .filter((travel) => {
        const travelDate = parseDate(travel.date);
        return travelDate >= today; // Seul les voyages à venir
      })
      .sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.getTime() - dateB.getTime(); // Tri par date
      });

    setFutureTravels(filteredTravels);
  }, [travels]);

  // Fonction pour convertir une date au format 'DD/MM/YYYY' en 'YYYY-MM-DD'
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !selectedTravelId) return;
  
    // Préparer le FormData
    const formData = new FormData();
    formData.append("file", file); // Pièce jointe
    formData.append("travelId", String(selectedTravelId)); // ID du voyage
    formData.append("travelName", travels.find(travel => travel.id === selectedTravelId)?.name || ""); // Nom du voyage
    formData.append("name", "Nom du Professeur"); // Nom du professeur (à récupérer selon ton besoin)
    formData.append("email", "email@prof.com"); // Email du professeur (à récupérer selon ton besoin)
  
    try {
      const response = await fetch("/api/emailTravels/route", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        alert("Le fichier a bien été envoyé !");
      } else {
        alert("Une erreur est survenue.");
      }
    } catch (error) {
      alert("Erreur dans l'envoi de la requête.");
    }
  };
  

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Transports scolaires</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {futureTravels.map((travel) => (
          <div
            key={travel.id}
            className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center"
          >
            <img
              src={travel.img}
              alt={travel.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">{travel.name}</h2>
            <p className="text-gray-600 mb-2">Date : {travel.date}</p>
            <p className="text-gray-600 mb-2">Validation : {travel.validated}</p>
            <p className="text-gray-700">{travel.description}</p>
            
            {/* Formulaire pour envoyer un fichier */}
            <form onSubmit={handleSubmit}>
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="mb-4"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => setSelectedTravelId(travel.id)}
              >
                Envoyer la pièce jointe
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}






