"use client"

import Image from "next/image";
import { useState } from "react";

export default function PortesOuvertesPage() {
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submittedData, setSubmittedData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downloadICS = (data: any) => {
    const [hours, minutes] = data.horaire.split(':');
    const startDate = new Date(2026, 2, 14);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);
    const endDate = new Date(startDate.getTime() + 90 * 60000);
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "");
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      "SUMMARY:✨ Portes Ouvertes - La Providence",
      `DESCRIPTION:Bonjour ! Nous sommes ravis de vous accueillir pour la visite de l'établissement concernant l'inscription de ${data.enfantPrenom}.\\n\\nAu programme : rencontre avec l'équipe éducative, visite des locaux et échanges sur votre projet.\\n\\nÀ très vite !`,
      "LOCATION:La Providence Nicolas Barré - 6 Rue de Neuvillette, 76240 Le Mesnil-Esnard",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Rappel : Portes Ouvertes La Providence",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "rendez-vous-providence.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    const res = await fetch("/api/portes-ouvertes", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    if (res.ok) setSubmittedData(data);
  }
  if (submittedData) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center flex flex-col gap-6 mt-4 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Merci 🙏</h1>
          <p className="text-gray-600">Votre demande d’inscription aux portes ouvertes a bien été envoyée.</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <p className="text-blue-900 font-medium">Nous vous attendons le jour des portes ouvertes au créneau réservé : 
            <span className="block text-xl font-bold mt-1 underline">{submittedData.horaire}</span>
          </p>
          <button  onClick={() => downloadICS(submittedData)}  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 mx-auto">
            <span>📅</span> Ajouter à mon calendrier
          </button>
        </div>
        <div className="mt-4 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4">Vous souhaitez gagner du temps ?</p>
          <a  href="https://preinscriptions.ecoledirecte.com/?RNE=0761713Z"  target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#e94f8a] hover:bg-[#c83e72] text-white px-8 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg">📝 Faire une demande de préinscription</a>
          <p className="text-[11px] text-gray-400 mt-3 italic">(Ouverture du dossier de candidature via ÉcoleDirecte)</p>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-8 flex flex-col gap-4 mt-4">
      <Image src="/logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png.webp" width={150} height={150} alt="logo" className="self-center"/>
      <h1 className="text-3xl font-bold">Inscription aux portes ouvertes du 14 mars 2026</h1>
      <input autoComplete="family-name" type="text" name="last_name" placeholder="Nom du responsable" required className="p-2 rounded-xl"/>
      <input autoComplete="given-name" type="text" name="first_name" placeholder="Prénom du responsable" required className="p-2 rounded-xl"/>
      <input name="email" type="email" placeholder="Email" required className="p-2 rounded-xl"/>
      <input name="telephone" type="tel" placeholder="Téléphone" required className="p-2 rounded-xl"/>
      <input autoComplete="family-name" type="text" name="enfantNom" placeholder="Nom de l’enfant" required className="p-2 rounded-xl"/>
      <input autoComplete="off" type="text" name="enfantPrenom" placeholder="Prénom de l’enfant" required className="p-2 rounded-xl"/>
      <select name="etablissement" required className="p-2 rounded-xl">
        <option value="">Établissement qui vous intéresse</option>
        <option value="Ecole">École</option>
        <option value="Collège">Collège</option>
        <option value="Lycée">Lycée</option>
      </select>
      <select name="classe" required className="p-2 rounded-xl">
        <option value="">Classe qui vous intéresse pour votre enfant </option>
        <option value="Petite section">Petite section</option>
        <option value="Moyenne section">Moyenne section</option>
        <option value="Grande section">Grande section</option>
        <option value="CP">CP</option>
        <option value="CE1">CE1</option>
        <option value="CE2">CE2</option>
        <option value="CM1">CM1</option>
        <option value="CM2">CM2</option>
        <option value="6ème">6ème</option>
        <option value="5ème">5ème</option>
        <option value="4ème">4ème</option>
        <option value="3ème">3ème</option>
        <option value="2nde">2nde</option>
        <option value="1ère ST2S">1ère ST2S</option>
        <option value="1ère générale">1ère générale</option>
        <option value="Terminale ST2S">Terminale ST2S</option>
        <option value="Terminale générale">Terminale générale</option>
      </select>
      <select name="horaire" required className="p-2 rounded-xl">
        <option value="">Choisissez un horaire</option>
        <option value="08:30">08:30</option>
        <option value="09:00">09:00</option>
        <option value="09:30">09:30</option>
        <option value="10:00">10:00</option>
        <option value="10:30">10:30</option>
        <option value="11:00">11:00</option>
        <option value="11:30">11:30</option>
      </select>
      <div>
        <p>Pré-inscription déjà effectuée ?</p>
        <label>
          <input type="radio" name="preinscription" value="oui" required /> Oui
        </label>
        <label className="ml-4">
          <input type="radio" name="preinscription" value="non" /> Non
        </label>
      </div>
      <button type="submit" disabled={loading} className="bg-black text-white px-6 py-3 rounded-xl">
        {loading ? "Envoi…" : "S’inscrire"}
      </button>
    </form>
  );
}