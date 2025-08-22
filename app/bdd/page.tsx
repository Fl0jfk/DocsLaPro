"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

type Eleve = {
  dossier: string;
  fiche: {
    id?: string;
    nom?: string;
    prenom?: string;
    date_naissance?: string;
    date_entree?: string;
    date_sortie?: string;
    classes?: string[];
    notes?: string;
    tags?: string[];
  };
  photoUrl: string | null;
  documents: { key: string; name: string; url: string }[];
};

export default function ExplorerEleves() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [filtrePresence, setFiltrePresence] = useState<'tous' | 'present' | 'absent'>('tous');
  const [filtreClasse, setFiltreClasse] = useState<string>('toutes');
  const [filtreTag, setFiltreTag] = useState<string>('tous');
  const [editFiche, setEditFiche] = useState<Eleve['fiche'] | null>(null);
  useEffect(() => {
    fetch('/api/eleves/list')
      .then(res => res.json())
      .then(setEleves);
  }, []);
  const toutesClasses = Array.from(
    new Set(eleves.flatMap(e => e.fiche?.classes ?? []))
  ).sort();
  const tousTags = Array.from(
    new Set(eleves.flatMap(e => e.fiche?.tags ?? []))
  ).sort();
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const elevesFiltres = eleves.filter(eleve => {
    const fiche = eleve.fiche;
    const estPresent = !fiche?.date_sortie || fiche.date_sortie > aujourdHui;
    const classeActuelle = fiche?.classes?.[fiche.classes.length - 1] || '';
    const tagOk = filtreTag === 'tous' || (fiche?.tags?.includes(filtreTag));
    if (filtrePresence === 'present' && !estPresent) return false;
    if (filtrePresence === 'absent' && estPresent) return false;
    if (filtreClasse !== 'toutes' && classeActuelle !== filtreClasse) return false;
    if (!tagOk) return false;
    return true;
  });
  const handleSaveFiche = async () => {
    if (!editFiche || selected === null) return;
    await fetch('/api/eleves/update-fiche', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossier: eleves[selected].dossier,
        fiche: editFiche,
      }),
    });
    fetch('/api/eleves/list')
      .then(res => res.json())
      .then(data => {
        setEleves(data);
        setEditFiche(null);
      });
  };
  const handleDownloadAll = async () => {
    window.open('/api/eleves/download-all', '_blank');
  };
  return (
    <div className="max-w-6xl mx-auto flex flex-row gap-8 pt-[10vh]">
      <div className="w-1/3 bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Tous les dossiers élèves</h2>
        <div className="mb-2">
          <label>Présence : </label>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
          <select value={filtrePresence} onChange={e => setFiltrePresence(e.target.value as any)}>
            <option value="tous">Tous</option>
            <option value="present">Présents</option>
            <option value="absent">Absents</option>
          </select>
        </div>
        <div className="mb-2">
          <label>Classe actuelle : </label>
          <select value={filtreClasse} onChange={e => setFiltreClasse(e.target.value)}>
            <option value="toutes">Toutes</option>
            {toutesClasses.map(cl => (
              <option key={cl} value={cl}>{cl}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label>Tag : </label>
          <select value={filtreTag} onChange={e => setFiltreTag(e.target.value)}>
            <option value="tous">Tous</option>
            {tousTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <ul>
          {elevesFiltres.map((eleve, i) => (
            <li
              key={eleve.dossier}
              className={`p-2 flex items-center rounded cursor-pointer mb-1 ${selected === i ? 'bg-blue-200' : 'bg-gray-200 hover:bg-blue-50'}`}
              onClick={() => { setSelected(i); setEditFiche(null); }}
            >
              {eleve.photoUrl && (
                <Image
                  width={32}
                  height={32}
                  src={eleve.photoUrl}
                  alt="photo élève"
                  className="w-8 h-8 rounded-full mr-2 object-cover border"
                />
              )}
              <span>
                {eleve.fiche?.prenom || ''} {eleve.fiche?.nom || eleve.dossier.replace('eleves/', '').replace('/', '')}
              </span>
            </li>
          ))}
        </ul>
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleDownloadAll}
        >
          Télécharger tous les documents (sauvegarde)
        </button>
      </div>
      <div className="flex-1 bg-white p-4 rounded shadow">
        {selected !== null && elevesFiltres[selected] && (
          <>
            <h3 className="font-bold text-lg mb-2">
              {elevesFiltres[selected].fiche?.prenom} {elevesFiltres[selected].fiche?.nom}
            </h3>
            {elevesFiltres[selected].photoUrl && (
              <Image
                width={64}
                height={64}
                src={elevesFiltres[selected].photoUrl}
                alt="photo élève"
                className="w-16 h-16 rounded-full mb-2 object-cover border"
              />
            )}
            {!editFiche ? (
              <>
                <div className="mb-4">
                  <strong>Date de naissance :</strong> {elevesFiltres[selected].fiche?.date_naissance || 'N/A'}<br />
                  <strong>Date d&apos;entrée :</strong> {elevesFiltres[selected].fiche?.date_entree || 'N/A'}<br />
                  <strong>Date de sortie :</strong> {elevesFiltres[selected].fiche?.date_sortie || 'N/A'}<br />
                  <strong>Classes :</strong> {elevesFiltres[selected].fiche?.classes?.join(' → ') || 'N/A'}<br />
                  <strong>Notes :</strong> {elevesFiltres[selected].fiche?.notes || 'N/A'}<br />
                  <strong>Tags :</strong> {elevesFiltres[selected].fiche?.tags?.join(', ') || 'N/A'}
                </div>
                <button
                  className="mb-4 bg-yellow-500 text-white px-3 py-1 rounded"
                  onClick={() => setEditFiche({ ...elevesFiltres[selected].fiche })}
                >
                  Modifier la fiche élève
                </button>
              </>
            ) : (
              <div className="mb-4 space-y-2">
                <input
                  className="block border p-1 w-full"
                  placeholder="Prénom"
                  value={editFiche.prenom || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, prenom: e.target.value }))}
                />
                <input
                  className="block border p-1 w-full"
                  placeholder="Nom"
                  value={editFiche.nom || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, nom: e.target.value }))}
                />
                <input
                  className="block border p-1 w-full"
                  placeholder="Date de naissance"
                  value={editFiche.date_naissance || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, date_naissance: e.target.value }))}
                />
                <input
                  className="block border p-1 w-full"
                  placeholder="Date d'entrée"
                  value={editFiche.date_entree || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, date_entree: e.target.value }))}
                />
                <input
                  className="block border p-1 w-full"
                  placeholder="Date de sortie"
                  value={editFiche.date_sortie || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, date_sortie: e.target.value }))}
                />
                <input
                  className="block border p-1 w-full"
                  placeholder="Classes (séparées par virgule)"
                  value={editFiche.classes?.join(', ') || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, classes: e.target.value.split(',').map(s => s.trim()) }))}
                />
                <input
                  className="block border p-1 w-full"
                  placeholder="Notes"
                  value={editFiche.notes || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, notes: e.target.value }))}
                />
                <input
                  className="block border p-1 w-full"
                  placeholder="Tags (séparés par virgule)"
                  value={editFiche.tags?.join(', ') || ''}
                  onChange={e => setEditFiche(f => ({ ...f!, tags: e.target.value.split(',').map(s => s.trim()) }))}
                />
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                  onClick={handleSaveFiche}
                >
                  Enregistrer
                </button>
                <button
                  className="bg-gray-400 text-white px-3 py-1 rounded"
                  onClick={() => setEditFiche(null)}
                >
                  Annuler
                </button>
              </div>
            )}
            <h4 className="font-semibold mb-1">Documents :</h4>
            <ul>
              {elevesFiltres[selected].documents.map(doc => (
                <li key={doc.key}>
                  <a href={doc.url} target="_blank" rel="noopener" className="text-blue-600 underline">{doc.name}</a>
                </li>
              ))}
            </ul>
          </>
        )}
        {selected === null && <div>Sélectionne un élève pour voir ses documents et infos.</div>}
      </div>
    </div>
  );
}