"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

type FileEntry = { filename: string; url: string };

type VoyageStatus = | "draft" | "direction_validation" | "requests_stage" | "compta_validation" | "final_validation" | "validated" | "rejected";

type Voyage = {
  id: string;
  lieu: string;
  email:string;
  activite: string;
  date_depart: string;
  date_retour: string;
  classes: string;
  effectif_eleves: number;
  effectif_accompagnateurs: number;
  commentaire: string;
  pieces_jointes?: FileEntry[];
  status: VoyageStatus;
  direction_cible: string;
  devis_requests?: any[];
};

type FormValues = Omit<Voyage, "id" | "pieces_jointes" | "status" | "devis_requests">;

const statusLabels: Record<VoyageStatus, string> = {
  draft: "📝 Brouillon",
  direction_validation: "📋 En validation direction",
  requests_stage: "🚌 Demandes de devis",
  compta_validation: "💰 Validation compta",
  final_validation: "✅ Validation finale direction",
  validated: "🎉 Voyage validé",
  rejected: "❌ Rejeté",
};

export default function VoyageEditForm({ voyageId }: { voyageId: string }) {
  const { user, isLoaded } = useUser();
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [initialAttachments, setInitialAttachments] = useState<FileEntry[]>([]);
  console.log(initialAttachments)
  const [isModified, setIsModified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!isLoaded || !user) return;
    const fetchVoyage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/travels/get?voyageId=${voyageId}`);
        if (!res.ok) throw new Error("Impossible de récupérer le voyage");
        const data = await res.json();
        setVoyage(data.voyage);
        setFormValues({
          lieu: data.voyage.lieu,
          activite: data.voyage.activite,
          date_depart: data.voyage.date_depart,
          date_retour: data.voyage.date_retour,
          email:data.voyage.email,
          classes: data.voyage.classes,
          effectif_eleves: data.voyage.effectif_eleves,
          direction_cible: data.voyage.direction_cible,
          effectif_accompagnateurs: data.voyage.effectif_accompagnateurs,
          commentaire: data.voyage.commentaire || "",
        });
        setInitialAttachments(data.voyage.pieces_jointes || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVoyage();
  }, [voyageId, isLoaded]);

  useEffect(() => {
    if (!voyage || !formValues) return;
    const unchanged =
      formValues.lieu === voyage.lieu &&
      formValues.activite === voyage.activite &&
      formValues.date_depart === voyage.date_depart &&
      formValues.date_retour === voyage.date_retour &&
      formValues.classes === voyage.classes &&
      formValues.effectif_eleves === voyage.effectif_eleves &&
      formValues.effectif_accompagnateurs === voyage.effectif_accompagnateurs &&
      formValues.commentaire === voyage.commentaire &&
      newAttachments.length === 0;
    setIsModified(!unchanged);
  }, [formValues, voyage, newAttachments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleFilesChange = useCallback((files: File[]) => {
    setNewAttachments((prev) => [...prev, ...files]);
  }, []);

  const uploadToS3 = async (file: File) => {
    const res = await fetch("/api/travels/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voyageId, filename: file.name, type: file.type }),
    });
    const { uploadUrl, fileUrl } = await res.json();
    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    return { filename: file.name, url: fileUrl };
  };

  const removeAttachment = (index: number) => {
    if (!voyage?.pieces_jointes) return;
    const updated = [...voyage.pieces_jointes];
    updated.splice(index, 1);
    setVoyage({ ...voyage, pieces_jointes: updated });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer?.files) handleFilesChange(Array.from(e.dataTransfer.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues || !voyage || !isModified) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const uploaded = await Promise.all(newAttachments.map(uploadToS3));
      const allAttachments = [...(voyage.pieces_jointes || []), ...uploaded];
      const body = { ...voyage, ...formValues, pieces_jointes: allAttachments };
      const res = await fetch(`/api/travels/update?voyageId=${voyageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      setVoyage(body);
      setInitialAttachments(allAttachments);
      setNewAttachments([]);
      setSuccess("Voyage mis à jour ✅");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: VoyageStatus) => {
    try {
      const res = await fetch("/api/travels/updateStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voyageId, newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de transition");
      setVoyage((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setSuccess(`Statut mis à jour : ${statusLabels[newStatus]}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  function getNextStatus(current: VoyageStatus): VoyageStatus {
    const flow: VoyageStatus[] = [ "draft", "direction_validation", "requests_stage", "compta_validation", "final_validation", "validated",];
    const i = flow.indexOf(current);
    return i < flow.length - 1 ? flow[i + 1] : current;
  }

  function getPreviousStatus(current: VoyageStatus): VoyageStatus {
    const flow: VoyageStatus[] = [ "draft", "direction_validation", "requests_stage", "compta_validation", "final_validation", "validated",];
    const i = flow.indexOf(current);
    return i > 0 ? flow[i - 1] : current;
  }

  if (!isLoaded) return <div>Chargement utilisateur…</div>;
  if (!user) return <div>Veuillez vous connecter.</div>;
  if (loading) return <div>Chargement du voyage…</div>;
  if (!voyage || !formValues) return <div>Voyage introuvable.</div>;

  function normalizeRoles(role: unknown): string[] {
    if (Array.isArray(role)) return role as string[];
    if (typeof role === "string") return [role];
    return [];
  }
  const userRoles = normalizeRoles(user?.publicMetadata?.role);
  const isCreator = voyage.email === user.primaryEmailAddress?.emailAddress;
  const isDirectionCible = !!voyage.direction_cible && userRoles.includes(voyage.direction_cible);
  const disabled = voyage.status !== "draft" && voyage.status !== "direction_validation" && !isCreator;
  return (
    <form onSubmit={handleSubmit} className="pt-[15vh] flex flex-col gap-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Modifier le voyage</h2>

      <div className="text-sm bg-gray-100 px-3 py-2 rounded border">
        <strong>Statut :</strong> {statusLabels[voyage.status]}
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      <label>
        Lieu :
        <input name="lieu" value={formValues.lieu} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Activité :
        <input name="activite" value={formValues.activite} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Date de départ :
        <input type="date" name="date_depart" value={formValues.date_depart} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Date de retour :
        <input type="date" name="date_retour" value={formValues.date_retour} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Classes :
        <input name="classes" value={formValues.classes} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Nombre d’élèves :
        <input type="number" name="effectif_eleves" min={1} value={formValues.effectif_eleves} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Nombre d’accompagnateurs :
        <input type="number" name="effectif_accompagnateurs" min={1} value={formValues.effectif_accompagnateurs} onChange={handleChange} required disabled={disabled} />
      </label>

      <div>
        <strong>Pièces jointes :</strong>
        {voyage.pieces_jointes?.length ? (
          <ul>
            {voyage.pieces_jointes.map((f, i) => (
              <li key={i}>
                <a href={f.url} target="_blank">{f.filename}</a>
                {!disabled && (
                  <button type="button" onClick={() => removeAttachment(i)} className="ml-2 text-red-600">Supprimer</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <span>Aucune pièce jointe</span>
        )}
      </div>

      {!disabled && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-400 rounded p-4 text-center text-gray-500 cursor-pointer hover:bg-gray-50"
        >
          {newAttachments.length
            ? `${newAttachments.length} fichier(s) ajouté(s)`
            : "Glissez vos fichiers ici ou cliquez pour sélectionner"}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFilesChange(Array.from(e.target.files))}
          />
        </div>
      )}

      <label>
        Commentaire :
        <textarea name="commentaire" value={formValues.commentaire} onChange={handleChange} disabled={disabled} />
      </label>

      {!disabled && (
        <button type="submit" disabled={!isModified || saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
          {saving ? "Enregistrement…" : "Mettre à jour"}
        </button>
      )}
      {isCreator && voyage.status === "requests_stage" && (
  <div className="mt-4 border-t pt-4">
    <h3 className="font-bold mb-2">Demande de devis</h3>
    <DevisRequestForm voyage={voyage} setVoyage={setVoyage} />
  </div>
)}
      {isDirectionCible && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-bold mb-2">Contrôle de validation (Direction)</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => updateStatus(getPreviousStatus(voyage.status))} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"> ← Étape précédente</button>
            <button type="button" onClick={() => updateStatus(getNextStatus(voyage.status))} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Étape suivante →</button>
          </div>
        </div>
      )}
    </form>
  );
}

function DevisRequestForm({
  voyage,
  setVoyage,
}: {
  voyage: Voyage;
  setVoyage: React.Dispatch<React.SetStateAction<Voyage | null>>;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [heureDepart, setHeureDepart] = useState("");
  const [carSurPlace, setCarSurPlace] = useState(false);
  const [commentaire, setCommentaire] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const infos = { heureDepart, carSurPlace, commentaire };
      const res = await fetch("/api/travels/devis/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voyageId: voyage.id, infos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la demande de devis");
      setVoyage((prev) =>
        prev
          ? {
              ...prev,
              devis_requests: [
                ...(prev.devis_requests || []),
                { infos, date: new Date().toISOString(), status: "pending" },
              ],
            }
          : prev
      );
      setMsg("Demande de devis envoyée à tous les transporteurs ✅");
      setHeureDepart("");
      setCarSurPlace(false);
      setCommentaire("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <label>
        Heure de départ :
        <input type="time" value={heureDepart} onChange={(e) => setHeureDepart(e.target.value)} required />
      </label>
      <label>
        Besoin d’un car sur place :
        <input type="checkbox" checked={carSurPlace} onChange={(e) => setCarSurPlace(e.target.checked)} />
      </label>
      <label>
        Commentaire (optionnel) :
        <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
      </label>
      <button type="button" onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        {loading ? "Envoi…" : "Envoyer la demande de devis"}
      </button>
      {msg && <div className={`mt-2 ${msg.includes("✅") ? "text-green-600" : "text-red-600"}`}>{msg}</div>}
    </div>
  );
}
