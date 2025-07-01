"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Etude() {
  type Eleve = {id: number;"Num Badge": number;"Badge Sécurisé": string;Nom: string;Prénom: string;"Nom établissement": string;"Code classe": string;Photo: string| null;"Total Heures": number;"Heures d'études": { Date: string; "Heure début": string; "Heure fin": string; Personnel: string }[]};
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [filteredEleves, setFilteredEleves] = useState<Eleve[]>([]);
  const [selectedEtablissement, setSelectedEtablissement] = useState<string>("");
  const [selectedClasse, setSelectedClasse] = useState<string>("");
  const [presentEleves, setPresentEleves] = useState<Eleve[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); 
  const correctPassword = "test"; 
  useEffect(() => {
    if (isAuthenticated) {
      fetch("https://docslapro.s3.eu-west-3.amazonaws.com/Etude/BDD+Eleves.json")
        .then((res) => res.json())
        .then((data: Eleve[]) => {
          setEleves(data);
        })
        .catch((err) => console.error("Erreur de chargement des élèves", err));
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (selectedEtablissement && selectedClasse) {
      const filtered = eleves.filter(
        (eleve) => eleve["Nom établissement"] === selectedEtablissement && eleve["Code classe"] === selectedClasse
      );
      setFilteredEleves(filtered);
    }
  }, [selectedEtablissement, selectedClasse, eleves]);
  const handleLogin = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Mot de passe incorrect !");
    }
  };
  const togglePresence = (eleve: Eleve) => {
    setPresentEleves((prevPresentEleves) => {
      const isAlreadyPresent = prevPresentEleves.some((p) => p.id === eleve.id);
      if (isAlreadyPresent) {
        const updatedPresentEleves = prevPresentEleves.filter((p) => p.id !== eleve.id);
        setFilteredEleves((prevFiltered) => {
          if (!prevFiltered.some((eleve) => eleve.id === eleve.id)) {
            return [...prevFiltered, eleve];
          }
          return prevFiltered;
        });
        return updatedPresentEleves;
      } else {
        const updatedPresentEleves = [...prevPresentEleves, eleve];
        setFilteredEleves((prevFiltered) => {
          return prevFiltered.filter((p) => p.id !== eleve.id);
        });
        return updatedPresentEleves;
      }
    });
  };
  const removeEleve = (eleveId: number) => {
    setPresentEleves((prevPresentEleves) => {
      const updatedPresentEleves = prevPresentEleves.filter((eleve) => eleve.id !== eleveId);
      setFilteredEleves((prevFiltered) => {
        const removedEleve = prevPresentEleves.find((eleve) => eleve.id === eleveId);
        if (removedEleve) {
          if (!prevFiltered.some((eleve) => eleve.id === removedEleve.id)) {
            return [...prevFiltered, removedEleve];
          }
        }
        return prevFiltered;
      });
  
      return updatedPresentEleves;
    });
  };
  const sendToAWS = async () => {
    if (!userName.trim() || !password.trim()) {
        alert("Veuillez entrer votre nom d'utilisateur et mot de passe.");
        return;
    }
    const now = new Date();
    const dateDuJour = now.toLocaleDateString("fr-FR");
    const heureDebut = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const updatedData = presentEleves.map((eleve) => ({
        ...eleve,
        "Total Heures": eleve["Total Heures"] + 1,
        "Heures d'études": [
            ...eleve["Heures d'études"],
            {
                "Date": dateDuJour,
                "Heure début": heureDebut,
                "Personnel": userName,
            }
        ]
    }));
    try {
        const response = await fetch("/api/etude", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userName,
                password,
                etude: updatedData,
                modificationsInProgress: updatedData,
            }),
        });
        if (!response.ok) { throw new Error("Erreur lors de l'envoi des données")}
        alert("Présences mises à jour avec succès !");
        window.location.reload();
    } catch (error) {
        console.error(error);
        alert("Échec de l'envoi des données.");
    }
  };
  if (!isAuthenticated) {
    return (
      <main className="p-4 max-w-[1200px] mx-auto flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold mb-4">Suivi des élèves en étude</h1>
        <input type="password" placeholder="Mot de passe" className="rounded-xl border p-2" onChange={(e) => setPassword(e.target.value)}/>
        <button onClick={handleLogin} className="bg-blue-500 text-white p-2 rounded w-[150px]">Se connecter</button>
      </main>
    );
  }
  return (
    <main className="p-4 max-w-[1200px] mx-auto flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold mb-4">Suivi des élèves en étude</h1>
      <div className="mb-4">
        <label className="block font-semibold max-w-[300px]">Choisir un établissement :</label>
        <select value={selectedEtablissement} onChange={(e) => setSelectedEtablissement(e.target.value)} className="border p-2 w-full rounded-xl max-w-[300px] mx-auto">
          <option value="">Sélectionner</option>
          {[...new Set(eleves.map((e) => e["Nom établissement"]))].map((etab, index) => (
            <option key={index} value={etab}>{etab}</option>
          ))}
        </select>
      </div>
      {selectedEtablissement && (
        <div className="mb-4">
          <label className="block font-semibold max-w-[300px]">Choisir une classe :</label>
          <select value={selectedClasse} onChange={(e) => setSelectedClasse(e.target.value)} className="border p-2 w-full rounded-xl max-w-[300px] mx-auto">
            <option value="">Sélectionner</option>
            {[...new Set(eleves.filter((e) => e["Nom établissement"] === selectedEtablissement).map((e) => e["Code classe"]))]
              .sort()
              .map((classe, index) => (
                <option key={index} value={classe}>
                  {classe}
                </option>
              ))}
          </select>
        </div>
      )}
      {selectedClasse && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Liste des élèves</h2>
          <section className="w-full flex flex-wrap mt-4">
            <div className="flex flex-wrap gap-4">
              {filteredEleves.map((eleve) => (
               <div key={eleve.id} className={presentEleves.some((p) => p.id === eleve.id) ? "present" : ""} onClick={() => togglePresence(eleve)} style={{ width: "170px", height: "250px",cursor: "pointer", transition: "background-color 0.3s ease", border: "1px solid #ccc", borderRadius: "16px", flexDirection: "column", display: "flex",
                padding: "4px",
                alignItems: "center",
                justifyContent: "center",
              }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007bff'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>  
                <div className="p-2 h-[150px] w-[150px] flex items-center justify-center">
                  {eleve.Photo&&<Image src={eleve.Photo} alt="Photo de l'eleve" className="rounded-full w-full h-full" style={{objectFit: "cover", objectPosition : "top"}} width={200} height={200}/>}
                </div>
               <p className="text-wrap text-center">{eleve.Nom}</p>
               <p className="text-wrap text-center">{eleve.Prénom}</p>
             </div>
              ))}
            </div>
          </section>
        </div>
      )}
      <div className="mb-4">
        <h2 className="text-4xl font-semibold">Présents</h2>
        <section className="flex flex-col gap-4">
          {presentEleves.map((eleve) => (
            <div key={eleve.id} className="flex items-center justify-between border p-2 max-w-[350px] rounded-xl gap-1">
              <div className="p-2 h-[80px] w-[80px] flex items-center justify-center">
                {eleve.Photo&& <Image src={eleve.Photo} alt="Photo de l'eleve" className="rounded-full w-full h-full" style={{objectFit: "cover"}} width={200} height={200}/>}
              </div>
              <p>{eleve.Nom}</p>
              <p>{eleve.Prénom}</p>
              <button onClick={() => removeEleve(eleve.id)}>❌</button>
            </div>
          ))}
        </section>
      </div>
      <input type="text" placeholder="Utilisateur" className="rounded-xl border p-2" onChange={(e) => setUserName(e.target.value)} />
      <input type="password" placeholder="Mot de passe" className="rounded-xl border p-2" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={sendToAWS} className="bg-blue-500 text-white p-2 rounded w-[150px]">Valider</button>
      <a href="/api/etudeFiltre" download>
        <button className="bg-yellow-500 text-white p-2 rounded w-[150px]">Télécharger les élèves avec +1h d&apos;étude</button>
      </a>
    </main>
  );
}
