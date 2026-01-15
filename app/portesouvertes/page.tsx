"use client";

import { useState } from "react";

export default function PortesOuvertesPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/portes-ouvertes", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    if (res.ok) setSuccess(true);
  }
  if (success) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Merci 🙏</h1>
        <p>Votre demande d’inscription aux portes ouvertes a bien été envoyée.</p>
        <p>Vous pouvez venir le jour des portes ouvertes au créneau que vous avez réservé.</p>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-8 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Inscription aux portes ouvertes</h1>
      <input name="Nom" placeholder="Nom du responsable" required className="p-2 rounded-xl"/>
      <input name="Prenom" placeholder="Prénom du responsable" required className="p-2 rounded-xl"/>
      <input name="email" type="email" placeholder="Email" required className="p-2 rounded-xl"/>
      <input name="telephone" placeholder="Téléphone" required className="p-2 rounded-xl"/>
      <input name="enfantNom" placeholder="Nom de l’enfant" required className="p-2 rounded-xl"/>
      <input name="enfantPrenom" placeholder="Prénom de l’enfant" required className="p-2 rounded-xl"/>
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
      <button type="submit" disabled={loading} className="bg-black text-white px-6 py-3 rounded-xl">{loading ? "Envoi…" : "S’inscrire"}</button>
    </form>
  );
}
