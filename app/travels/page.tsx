'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

type Sortie = {
  id: string;
  etat: string;
  date_depart: string;
  date_retour: string;
  classes: string[];
  nb_eleves: number;
  nb_accompagnateurs: number;
  destination: string;
  activite: string;
  besoin_transport: boolean;
  besoin_repas: boolean;
  details_repas?: {
    nb_repas: number;
    nb_vegetariens: number;
    date_repas: string;
    heure_repas: string;
  };
  documents: {
    type: string;
    nom: string;
    chemin: string;
    date: string;
  }[];
  createdBy: string;
  validatedBy: string | null;
};

export default function ValidationSorties() {
  const { user } = useUser();
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/sorties/list')
      .then(res => res.json())
      .then(data => {
        setSorties(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleValidate = async (id: string) => {
    setLoading(true);
    try {
      await fetch('/api/sorties/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: user?.id }),
      });
      // Recharge la liste
      const res = await fetch('/api/sorties/list');
      const data = await res.json();
      setSorties(data);
    } catch (err) {
      console.error('Erreur lors de la validation :', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="font-bold text-xl mb-4">Sorties à valider</h2>
      {loading ? (
        <p>Chargement en cours...</p>
      ) : sorties.length === 0 ? (
        <p>Aucune sortie à valider.</p>
      ) : (
        <ul className="space-y-4">
          {sorties.map(sortie => (
            <li key={sortie.id} className="p-4 border rounded bg-gray-50">
              <h3 className="font-semibold text-lg mb-2">{sortie.destination}</h3>
              <p><strong>Dates :</strong> {sortie.date_depart} → {sortie.date_retour}</p>
              <p><strong>Classes :</strong> {sortie.classes.join(', ')}</p>
              <p><strong>Nombre d’élèves :</strong> {sortie.nb_eleves}</p>
              <p><strong>Nombre d’accompagnateurs :</strong> {sortie.nb_accompagnateurs}</p>
              <p><strong>Activité prévue :</strong> {sortie.activite}</p>
              <p><strong>Besoin de transport :</strong> {sortie.besoin_transport ? 'Oui' : 'Non'}</p>
              <p><strong>Besoin de repas :</strong> {sortie.besoin_repas ? 'Oui' : 'Non'}</p>
              {sortie.besoin_repas && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <p><strong>Détails repas :</strong></p>
                  <p>Nombre de repas : {sortie.details_repas?.nb_repas}</p>
                  <p>Nombre de végétariens : {sortie.details_repas?.nb_vegetariens}</p>
                  <p>Date du repas : {sortie.details_repas?.date_repas}</p>
                  <p>Heure du repas : {sortie.details_repas?.heure_repas}</p>
                </div>
              )}
              <div className="mt-2">
                <p className="font-semibold">Documents joints :</p>
                <ul className="space-y-1">
                  {sortie.documents.map((doc, i) => (
                    <li key={i}>
                      <a
                        href={`https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.eu-west-3.amazonaws.com/${doc.chemin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {doc.nom}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-2"><strong>Créée par :</strong> {sortie.createdBy}</p>
              <button
                onClick={() => handleValidate(sortie.id)}
                disabled={loading}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'Validation en cours...' : 'Valider'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}