'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import ValidationSorties from '../components/ValidationSorties/ValidationSorties';

type DetailsRepas = {
  nb_repas: number;
  nb_vegetariens: number;
  date_repas: string;
  heure_repas: string;
};

type FormSortie = {
  date_depart: string;
  date_retour: string;
  classes: string[];
  nb_eleves: number;
  nb_accompagnateurs: number;
  destination: string;
  activite: string;
  besoin_transport: boolean;
  besoin_repas: boolean;
  details_repas: DetailsRepas;
  documents: File[];
};

export default function DemandeSortie() {
  const { user } = useUser();
  const [form, setForm] = useState<FormSortie>({
    date_depart: '',
    date_retour: '',
    classes: [],
    nb_eleves: 0,
    nb_accompagnateurs: 0,
    destination: '',
    activite: '',
    besoin_transport: false,
    besoin_repas: false,
    details_repas: {
      nb_repas: 0,
      nb_vegetariens: 0,
      date_repas: '',
      heure_repas: '',
    },
    documents: [],
  });
  const [sortieEnvoyee, setSortieEnvoyee] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload des documents sur S3
      const documents = await Promise.all(
        form.documents.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/sorties/upload-document', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          return data.key;
        })
      );

      // 2. Création de la sortie
      const sortie = {
        ...form,
        documents: documents.map((key) => ({
          type: 'circulaire',
          nom: key.split('/').pop(),
          chemin: key,
          date: new Date().toISOString(),
        })),
        createdBy: user?.id,
      };

      const res = await fetch('/api/sorties/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sortie),
      });

      if (res.ok) {
        alert('Demande envoyée à la direction pour validation.');
        setSortieEnvoyee(sortie);
        // Réinitialisation du formulaire
        setForm({
          date_depart: '',
          date_retour: '',
          classes: [],
          nb_eleves: 0,
          nb_accompagnateurs: 0,
          destination: '',
          activite: '',
          besoin_transport: false,
          besoin_repas: false,
          details_repas: {
            nb_repas: 0,
            nb_vegetariens: 0,
            date_repas: '',
            heure_repas: '',
          },
          documents: [],
        });
      }
    } catch (err) {
      console.error('Erreur lors de l’envoi de la demande :', err);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="font-bold text-xl mb-4">Nouvelle sortie scolaire</h2>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Date de départ</label>
          <input
            type="date"
            value={form.date_depart}
            onChange={(e) => setForm({ ...form, date_depart: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Date de retour</label>
          <input
            type="date"
            value={form.date_retour}
            onChange={(e) => setForm({ ...form, date_retour: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Classes concernées (séparées par virgule)</label>
          <input
            type="text"
            value={form.classes.join(', ')}
            onChange={(e) =>
              setForm({
                ...form,
                classes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Nombre d’élèves</label>
          <input
            type="number"
            value={form.nb_eleves}
            onChange={(e) => setForm({ ...form, nb_eleves: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Nombre d’accompagnateurs</label>
          <input
            type="number"
            value={form.nb_accompagnateurs}
            onChange={(e) => setForm({ ...form, nb_accompagnateurs: Number(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Destination</label>
          <input
            type="text"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Activité prévue</label>
          <input
            type="text"
            value={form.activite}
            onChange={(e) => setForm({ ...form, activite: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={form.besoin_transport}
            onChange={(e) => setForm({ ...form, besoin_transport: e.target.checked })}
            className="mr-2"
          />
          <label>Besoin de transport</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={form.besoin_repas}
            onChange={(e) => setForm({ ...form, besoin_repas: e.target.checked })}
            className="mr-2"
          />
          <label>Besoin de repas</label>
        </div>
        {form.besoin_repas && (
          <div className="space-y-2 bg-gray-50 p-2 rounded">
            <div>
              <label className="block mb-1">Nombre de repas</label>
              <input
                type="number"
                value={form.details_repas.nb_repas}
                onChange={(e) =>
                  setForm({
                    ...form,
                    details_repas: { ...form.details_repas, nb_repas: Number(e.target.value) },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Nombre de végétariens</label>
              <input
                type="number"
                value={form.details_repas.nb_vegetariens}
                onChange={(e) =>
                  setForm({
                    ...form,
                    details_repas: { ...form.details_repas, nb_vegetariens: Number(e.target.value) },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Date du repas</label>
              <input
                type="date"
                value={form.details_repas.date_repas}
                onChange={(e) =>
                  setForm({
                    ...form,
                    details_repas: { ...form.details_repas, date_repas: e.target.value },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Heure du repas</label>
              <input
                type="time"
                value={form.details_repas.heure_repas}
                onChange={(e) =>
                  setForm({
                    ...form,
                    details_repas: { ...form.details_repas, heure_repas: e.target.value },
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}
        <div>
          <label className="block mb-1">Documents joints</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setForm({ ...form, documents: Array.from(e.target.files) });
              }
            }}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </div>
      </div>
      <ValidationSorties/>
      {/* Carte de résumé visuelle */}
      {sortieEnvoyee && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Demande envoyée !</h3>
          <p className="mb-2">
            Votre demande pour {sortieEnvoyee.destination} est en attente de validation par la direction.
          </p>
          <img
            src={`https://source.unsplash.com/400x200/?${sortieEnvoyee.destination.replace(/ /g, '+')}`}
            alt={sortieEnvoyee.destination}
            className="w-full h-32 object-cover rounded"
          />
          <div className="mt-2 text-sm">
            <p>Date de départ : {sortieEnvoyee.date_depart}</p>
            <p>Date de retour : {sortieEnvoyee.date_retour}</p>
            <p>Classes : {sortieEnvoyee.classes.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}





