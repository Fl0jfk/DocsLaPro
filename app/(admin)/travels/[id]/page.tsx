"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

function orderEmailForQuote(quote: {
  extractedContactEmail?: string | null;
  providerEmail?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!quote) return "";
  const a = quote.extractedContactEmail?.trim();
  const b = quote.providerEmail?.trim();
  const c = quote.email?.trim();
  return (a || b || c || "").trim();
}

function isValidEmailLoose(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** Voyage complexe avec demande de transport bus (étape logistique / devis). */
function complexNeedsBus(trip: { type?: string; data?: { needsBus?: boolean } } | null) {
  return trip?.type === "COMPLEX" && Boolean(trip?.data?.needsBus);
}

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoaded: isUserLoaded } = useUser();
  const [trip, setTrip] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [manualDevisName, setManualDevisName] = useState("");
  const [manualDevisEmail, setManualDevisEmail] = useState("");
  const [manualDevisBusy, setManualDevisBusy] = useState(false);
  const [zeendocSendingUrl, setZeendocSendingUrl] = useState<string | null>(null);
  const [reopenStep, setReopenStep] = useState("");
  const rawRoles = user?.publicMetadata?.role;
  const userRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\s-]+/g, "");
  const normalizedRoles = userRoles.map((r: string) => norm(String(r)));
  const isDirectionLycee = userRoles.includes('direction_lycee');
  const isDirectionCollege = userRoles.includes('direction collège');
  const isDirectionEcole = userRoles.includes('direction école');
  const etabForSign = trip?.data?.etablissement || "";
  const isEcoleDir = normalizedRoles.some((r: string) => r.includes("directionecole") || r.includes("directionecol") || (r.includes("direction") && r.includes("ecole")));
  const isCollegeDir = normalizedRoles.some((r: string) => r.includes("directioncollege") || (r.includes("direction") && r.includes("college")));
  const isLyceeDir = normalizedRoles.some((r: string) => r.includes("directionlycee") || (r.includes("direction") && r.includes("lycee")));
  const isDirection = isDirectionLycee || isDirectionCollege || isDirectionEcole || isEcoleDir || isCollegeDir || isLyceeDir;
  const canSign = etabForSign === "École" ? (isDirectionEcole  || isEcoleDir) : etabForSign === "Collège" ? (isDirectionCollege || isCollegeDir) : etabForSign === "Lycée" ? (isDirectionLycee  || isLyceeDir) : isDirectionLycee || isLyceeDir;
  const isCompta = userRoles.includes('comptabilité') || normalizedRoles.some((r: string) => r.includes("comptabilite"));
  const isAdministratif = normalizedRoles.some((r: string) => r.includes("administratif"));
  const canSeeTravelDocHoverActions = isDirection || isAdministratif || isCompta;
  const isOwner = user?.fullName === trip?.ownerName;
  const canManageFiles = isOwner || isDirection || isCompta;
  /** Ajout de pièces + devis manuel bus (sans retirer des fichiers ni éditer le dossier). */
  const canAddDocuments = canManageFiles || isAdministratif;
  const canUseInternalThread = isOwner || isDirection || isCompta;
  const CUISINE_DAYS = [{ key: "lundi", label: "Lun." },{ key: "mardi", label: "Mar." },{ key: "mercredi", label: "Mer." },{ key: "jeudi", label: "Jeu." },{ key: "vendredi", label: "Ven." }];
  const CUISINE_ROWS = [
    { key: "picnicTotal", label: "Pique-nique (total)", type: "number" },
    { key: "picnicNoPork", label: "dont Sans porc", type: "number" },
    { key: "picnicVeg", label: "dont Végétarien", type: "number" },
    { key: "selfAdults", label: "Repas au self (adultes)", type: "number" },
    { key: "selfStudents", label: "Repas au self (élèves)", type: "number" },
    { key: "coffee", label: "Café / thé / chocolat", type: "number" },
    { key: "juice", label: "Jus de fruits", type: "number" },
    { key: "cakes", label: "Petits gâteaux", type: "number" },
    { key: "pastries", label: "Viennoiserie", type: "number" },
    { key: "other", label: "Autre", type: "text" },
  ];
  const emptyCuisineDetails = () => ({
    active: false,
    deliveryTime: "",
    deliveryPlace: "Self",
    daysSelection: { lundi: false, mardi: false, mercredi: false, jeudi: false, vendredi: false },
    orders: {
      lundi: { picnicTotal: "", picnicNoPork: "", picnicVeg: "", selfAdults: "", selfStudents: "", coffee: "", juice: "", cakes: "", pastries: "", other: "" },
      mardi: { picnicTotal: "", picnicNoPork: "", picnicVeg: "", selfAdults: "", selfStudents: "", coffee: "", juice: "", cakes: "", pastries: "", other: "" },
      mercredi: { picnicTotal: "", picnicNoPork: "", picnicVeg: "", selfAdults: "", selfStudents: "", coffee: "", juice: "", cakes: "", pastries: "", other: "" },
      jeudi: { picnicTotal: "", picnicNoPork: "", picnicVeg: "", selfAdults: "", selfStudents: "", coffee: "", juice: "", cakes: "", pastries: "", other: "" },
      vendredi: { picnicTotal: "", picnicNoPork: "", picnicVeg: "", selfAdults: "", selfStudents: "", coffee: "", juice: "", cakes: "", pastries: "", other: "" },
    },
  });
  const getTotalMeals = (details: any): number => {
    if (!details?.active) return 0;
    if (details?.orders) {
      return CUISINE_DAYS.reduce((sum, { key }) => {
        const dayEnabled = details.daysSelection?.[key];
        if (!dayEnabled) return sum;
        const val = Number(details.orders?.[key]?.picnicTotal || 0);
        return sum + (Number.isFinite(val) ? val : 0);
      }, 0);
    }
    const legacy = Number(details?.picnicTotal || 0);
    return Number.isFinite(legacy) ? legacy : 0;
  };
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/travels/get?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setTrip(data);
          setEditedData({
            ...data.data,
            piqueNiqueDetails: data.data?.piqueNiqueDetails || emptyCuisineDetails(),
          });
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du dossier:", err);
      }
    };
    if (id) fetchTrip();
  }, [id]);
  const openSecureFile = async (fileUrl: string) => {
    const newWindow = window.open("", "_blank");
    try {
      const res = await fetch('/api/travels/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl })
      });
      const { signedUrl } = await res.json();
      if (!signedUrl) throw new Error("Lien signé manquant");
      if (newWindow) {
        newWindow.location.href = signedUrl;
        newWindow.focus();
      } else { window.location.href = signedUrl}
    } catch (err) {
      console.error(err);
      if (newWindow) newWindow.close();
      alert("Erreur lors de l'ouverture du fichier.");
    }
  };
  const prepareSendToZeendoc = async (file: { name?: string; url?: string }) => {
    if (!file?.url) {
      alert("Document invalide : URL manquante.");
      return;
    }
    try {
      setZeendocSendingUrl(file.url);
      const res = await fetch("/api/travels/send-zeendoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: file.url, fileName: file.name || "document" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Échec de l'envoi Zeendoc.");
      alert("Document envoyé sur Zeendoc.");
    } catch (err: any) {
      console.error("[travels] send-zeendoc:", err);
      alert(err?.message || "Impossible d'envoyer le document sur Zeendoc.");
    } finally {
      setZeendocSendingUrl(null);
    }
  };
  const saveUpdates = async (updatedTrip: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/travels/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trip.id, data: updatedTrip })
      });
      if (res.ok) {
        setTrip(updatedTrip);
        setEditedData(updatedTrip.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      return false;
    }
  };
  const CIRCULAR_ATTACHMENT_NAME = "📄 Circulaire Parents";
  const isCircularAttachment = (file: { name?: string }) =>
    String(file.name || "").toLowerCase().includes("circulaire");
  const generateCircularAttachment = async (): Promise<{ name: string; url: string }> => {
    const circRes = await fetch("/api/travels/generate-circular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripData: trip }),
    });
    if (!circRes.ok) {
      const errPayload = await circRes.json().catch(() => ({}));
      throw new Error(errPayload?.error || "La circulaire n'a pas pu être générée.");
    }
    const { pdf } = await circRes.json();
    if (!pdf) throw new Error("La circulaire n'a pas été produite.");
    const safeTitle = String(trip.data.title || "Sortie").replace(/\s+/g, "_");
    const fileName = `Circulaire_${safeTitle}.pdf`;
    const uploadRes = await fetch("/api/travels/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileType: "application/pdf" }),
    });
    if (!uploadRes.ok) throw new Error("Impossible de préparer l'enregistrement de la circulaire.");
    const { uploadUrl, fileUrl } = await uploadRes.json();
    if (!uploadUrl || !fileUrl) throw new Error("Réponse upload circulaire invalide.");
    const base64Content = pdf.split(",")[1];
    const byteArray = new Uint8Array(atob(base64Content).split("").map((c) => c.charCodeAt(0)));
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: new Blob([byteArray], { type: "application/pdf" }),
    });
    if (!putRes.ok) throw new Error("Enregistrement de la circulaire sur le serveur impossible.");
    return { name: CIRCULAR_ATTACHMENT_NAME, url: fileUrl };
  };
  const mergeCircularIntoAttachments = (
    attachments: { name: string; url: string }[],
    circular: { name: string; url: string },
  ) => [...attachments.filter((f) => !isCircularAttachment(f)), circular];
  const handleRegenerateCircular = async () => {
    if (!canSign && !isOwner) return alert("Vous n'êtes pas autorisé(e) à régénérer la circulaire.");
    const hasExisting = (trip.data.attachments || []).some(isCircularAttachment);
    if (
      hasExisting &&
      !confirm("Une circulaire existe déjà dans les documents. La remplacer par une nouvelle version ?")
    ) {
      return;
    }
    setLoadingAction("regenerate-circular");
    try {
      const circular = await generateCircularAttachment();
      const updatedAttachments = mergeCircularIntoAttachments(trip.data.attachments || [], circular);
      const updatedTrip = {
        ...trip,
        data: { ...trip.data, attachments: updatedAttachments },
        history: [
          ...(trip.history || []),
          {
            date: new Date().toISOString(),
            user: user?.fullName,
            action: "CIRCULAIRE_REGENEREE",
            note: hasExisting ? "Circulaire remplacée." : "Circulaire régénérée.",
          },
        ],
      };
      const saved = await saveUpdates(updatedTrip);
      if (!saved) throw new Error("Impossible d'enregistrer la circulaire dans le dossier.");
      alert("Circulaire régénérée et ajoutée aux documents.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors de la régénération de la circulaire.");
    } finally {
      setLoadingAction(null);
    }
  };
  const handleFinalValidation = async () => {
    if (!canSign) return alert("Vous n'êtes pas autorisé(e) à valider ce dossier.");
    setLoadingAction("circular");
    try {
      let finalAttachments = [...(trip.data.attachments || [])];
      let circularAdded = false;
      let cuisineSent = false;

      try {
        const circular = await generateCircularAttachment();
        finalAttachments = mergeCircularIntoAttachments(finalAttachments, circular);
        circularAdded = true;
      } catch (circErr) {
        const proceed = confirm(
          `${circErr instanceof Error ? circErr.message : "La circulaire n'a pas pu être générée."}\n\nValider le dossier quand même sans circulaire ?`,
        );
        if (!proceed) return;
      }

      if (trip.data.piqueNiqueDetails?.active) {
        const cuisineRes = await fetch('/api/travels/send-cuisine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripData: trip,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            organizerEmail: trip.ownerEmail,
            userName: trip.ownerName,
          }),
        });
        if (cuisineRes.ok) {
          cuisineSent = true;
        } else {
          const errPayload = await cuisineRes.json().catch(() => ({}));
          alert(`Attention : le mail cuisine n'a pas pu être envoyé (${errPayload?.error || "erreur inconnue"}).`);
        }
      }

      const historyNote = [
        "Dossier validé.",
        circularAdded ? "Circulaire générée." : "Circulaire non générée.",
        trip.data.piqueNiqueDetails?.active
          ? cuisineSent
            ? "Commande cuisine envoyée."
            : "Commande cuisine non envoyée."
          : null,
      ]
        .filter(Boolean)
        .join(" ");

      await handleAction("VALIDE", historyNote, { attachments: finalAttachments });

      const alertParts = ["Dossier validé !"];
      if (circularAdded) alertParts.push("La circulaire a été ajoutée aux documents.");
      else alertParts.push("Aucune circulaire n'a été générée — vous pouvez en déposer une manuellement.");
      if (trip.data.piqueNiqueDetails?.active && cuisineSent) {
        alertParts.push("Le bon de commande cuisine a été envoyé (chef + copies direction et organisateur).");
      }
      alert(alertParts.join("\n\n"));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors de la validation finale.");
    } finally {
      setLoadingAction(null);
    }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canAddDocuments) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch('/api/travels/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      const { uploadUrl, fileUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      const newAttachment = { name: file.name, url: fileUrl };
      const currentAttachments = isEditing ? (editedData.attachments || []) : (trip.data.attachments || []);
      const updatedAttachments = [...currentAttachments, newAttachment];
      if (isEditing) { setEditedData((prev: any) => ({ ...prev, attachments: updatedAttachments }));
      } else {
        const updatedTrip = { ...trip, data: { ...trip.data, attachments: updatedAttachments } };
        await saveUpdates(updatedTrip);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };
  const removeFile = async (index: number) => {
    if (!canManageFiles) return;
    const currentAttachments = isEditing ? (editedData.attachments || []) : (trip.data.attachments || []);
    const updatedFiles = currentAttachments.filter((_: any, i: number) => i !== index);
    if (isEditing) {
      setEditedData({ ...editedData, attachments: updatedFiles });
    } else {
      const updatedTrip = { ...trip, data: { ...trip.data, attachments: updatedFiles } };
      await saveUpdates(updatedTrip);
    }
  };
  const postInternalMessage = async () => {
    const text = draftMessage.trim();
    if (!text || !canUseInternalThread) return;
    const roleLabel = isDirection ? "Direction" : isCompta ? "Comptabilité" : "Créateur";
    const newMsg = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user: user?.fullName || "Utilisateur",
      role: roleLabel,
      text,
      date: new Date().toISOString(),
    };
    const updatedTrip = {
      ...trip,
      messages: [...(trip.messages || []), newMsg],
    };
    await saveUpdates(updatedTrip);
    setDraftMessage("");
  };
  const handleAction = async (newStatus: string, note: string = "", extraData: any = null) => {
    if (!loadingAction) setLoadingAction("action");
    const baseData = isEditing ? { ...trip.data, ...editedData } : trip.data;
    const finalData = extraData ? { ...baseData, ...extraData } : baseData;
    const updatedTrip = {
      ...trip,
      status: newStatus,
      data: finalData,
      history: [
        ...(trip.history || []),
        { date: new Date().toISOString(), user: user?.fullName, action: newStatus, note: note }
      ]
    };
    const saved = await saveUpdates(updatedTrip);
    setIsEditing(false);
    setLoadingAction(null);
    if (!saved) alert("Impossible d'enregistrer la modification. Réessayez.");
  };
  const handleReopenDossier = async (targetStatus: string, stepLabel: string) => {
    if (!canSign || trip.status !== "VALIDE" || loadingAction) return;
    if (
      !confirm(
        `Réouvrir ce dossier à l'étape « ${stepLabel} » ?\n\nLe statut ne sera plus « Finalisé » et le circuit de validation reprendra à cette étape.`,
      )
    ) {
      return;
    }
    const note = prompt("Motif de réouverture (optionnel) :") ?? "";
    await handleAction(
      targetStatus,
      note.trim() ? `Dossier réouvert : ${note.trim()}` : `Dossier réouvert à l'étape « ${stepLabel} »`,
    );
  };
  const selectBusQuote = async (quote: any) => {
    if (!confirm(`Confirmer le choix de ${quote.providerName} ? Cela informera la direction pour signature.`)) return;
    const updatedTrip = { ...trip, status: "EN_ATTENTE_BUS_SIGNATURE", data: { ...trip.data, selectedBusQuote: quote } };
    await saveUpdates(updatedTrip);
  };

  const addManualBusQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canAddDocuments) return;
    const name = manualDevisName.trim() || "Transporteur (saisie manuelle)";
    const email = manualDevisEmail.trim();
    if (!isValidEmailLoose(email)) {
      alert("Indiquez une adresse e-mail du transporteur valide (pour l’envoi de la commande après signature).");
      return;
    }
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[name="manualDevisPdf"]');
    const file = fileInput?.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Choisissez un fichier PDF (devis du transporteur).");
      return;
    }
    setManualDevisBusy(true);
    try {
      const res = await fetch("/api/travels/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: "application/pdf" }),
      });
      const { uploadUrl, fileUrl } = await res.json();
      if (!uploadUrl || !fileUrl) throw new Error("Réponse upload invalide");
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf" } });
      const newQuote = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        providerName: name,
        providerEmail: email,
        fileUrl,
        createdAt: new Date().toISOString(),
        source: "manual",
        originalFilename: file.name,
        matchConfidence: "high",
        matchReviewRequired: false,
        gmailMessageId: `manual_${Date.now()}`,
        extractedContactEmail: null,
        extractedPrice: null,
        extractedCompany: null,
      };
      const updatedTrip = {
        ...trip,
        receivedDevis: [...(trip.receivedDevis || []), newQuote],
      };
      await saveUpdates(updatedTrip);
      setTrip(updatedTrip);
      setManualDevisName("");
      setManualDevisEmail("");
      if (fileInput) fileInput.value = "";
      alert("Devis ajouté. Vous pouvez le sélectionner à l’étape logistique comme un devis reçu par mail.");
    } catch (err) {
      console.error(err);
      alert("Impossible d’ajouter le devis. Réessayez ou vérifiez votre connexion.");
    } finally {
      setManualDevisBusy(false);
    }
  };
  const signBusQuote = async () => {
    if (!canSign) return alert("Vous n'êtes pas autorisé(e) à signer ce dossier.");
    if (!confirm("Voulez-vous signer le devis et envoyer la commande au transporteur ?")) return;
    const transporteurEmail = orderEmailForQuote(trip.data.selectedBusQuote);
    if (!transporteurEmail) {
      return alert(
        "Erreur : aucun e-mail pour envoyer la commande (ni adresse lue sur le devis, ni expéditeur du mail, ni e-mail transporteur enregistré)."
      );
    }
    setLoadingAction("signing");
    const etab = trip.data?.etablissement || "";
    let sigType = etab === "École" ? "ecole" : etab === "Collège" ? "college" : "lycee";
    if (!sigType) return alert("Erreur de rôle.");
    try {
      const signRes = await fetch('/api/travels/sign-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteUrl: trip.data.selectedBusQuote.fileUrl, signatureType: sigType })
      });
      const { signedPdfData } = await signRes.json();
      const fileName = `Devis_Signe_${trip.data.selectedBusQuote.providerName.replace(/\s+/g, '_')}.pdf`;
      const uploadRes = await fetch('/api/travels/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType: "application/pdf" })
      });
      const { uploadUrl, fileUrl } = await uploadRes.json();
      const byteArray = new Uint8Array(atob(signedPdfData.split(',')[1]).split("").map(c => c.charCodeAt(0)));
      await fetch(uploadUrl, { method: 'PUT', body: new Blob([byteArray], { type: 'application/pdf' }) });
      await fetch('/api/travels/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.data.title,
          tripData: trip.data,
          providerEmail: transporteurEmail,
          signedQuoteUrl: fileUrl,
          providerName: trip.data.selectedBusQuote.providerName,
        })
      });
      const newAttachment = { name: `✅ ${fileName}`, url: fileUrl };
      handleAction("EN_ATTENTE_COMPTA", `Devis signé et commande envoyée`, { attachments: [...(trip.data.attachments || []), newAttachment], signedQuoteUrl: fileUrl });
    } catch (err) {
      alert("Erreur lors de la signature.");
    } finally {
      setLoadingAction(null);
    }
  };
  const formatSafeDate = (dateStr: any) => {
    if (!dateStr) return "N/C";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Date à préciser" : d.toLocaleDateString('fr-FR');
  };
  if (!isUserLoaded || !trip) return <p className="p-10 text-center font-medium text-slate-500">Chargement du dossier...</p>;
  const seriesId = trip.data?.recurrenceSeriesId as string | undefined;
  const seriesIndex = trip.data?.recurrenceIndex as number | undefined;
  const seriesTotal = trip.data?.recurrenceTotal as number | undefined;
  const isRecurrenceTrip = Boolean(seriesId && seriesTotal);
  const canCancelRecurrenceSession =
    isRecurrenceTrip &&
    trip.status !== "SEANCE_ANNULEE" &&
    trip.status !== "VALIDE" &&
    trip.status !== "REJETE" &&
    (isOwner || canSign);
  const validateSeriesPedagogy = async () => {
    if (loadingAction) return;
    if (!seriesId || !canSign) return;
    if (!confirm("Valider la pédagogie pour tous les dossiers de cette série encore en attente direction ?")) return;
    setLoadingAction("action");
    try {
      const res = await fetch("/api/travels/series-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_pedagogy_series",
          seriesId,
          actorName: user?.fullName,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      alert(`${j.updated} dossier(s) passé(s) en attente comptabilité.`);
      const refresh = await fetch(`/api/travels/get?id=${id}`);
      if (refresh.ok) setTrip(await refresh.json());
    } catch (e) {
      console.error(e);
      alert("Impossible de valider la série. Réessayez ou vérifiez les droits.");
    } finally {
      setLoadingAction(null);
    }
  };
  const cancelRecurrenceSession = async () => {
    if (loadingAction) return;
    if (!trip?.id) return;
    if (!confirm("Annuler uniquement cette séance ? Les autres dates de la série ne sont pas modifiées.")) return;
    setLoadingAction("action");
    try {
      const res = await fetch("/api/travels/series-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel_session",
          tripId: trip.id,
          actorName: user?.fullName,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      const refresh = await fetch(`/api/travels/get?id=${id}`);
      if (refresh.ok) setTrip(await refresh.json());
    } catch (e) {
      console.error(e);
      alert("Impossible d’annuler cette séance.");
    } finally {
      setLoadingAction(null);
    }
  };
  const withBusLogistics = complexNeedsBus(trip);
  const currentSteps =
    trip.type === "COMPLEX"
      ? withBusLogistics
        ? [
            { n: "1", label: "Pédagogie", key: "EN_ATTENTE_DIR_INITIAL" },
            { n: "2", label: "Logistique", key: "PROF_LOGISTICS" },
            { n: "3", label: "Finances", key: "EN_ATTENTE_COMPTA" },
            { n: "4", label: "Validation", key: "EN_ATTENTE_DIR_FINAL" },
            { n: "5", label: "Finalisé", key: "VALIDE" },
          ]
        : [
            { n: "1", label: "Pédagogie", key: "EN_ATTENTE_DIR_INITIAL" },
            { n: "2", label: "Finances", key: "EN_ATTENTE_COMPTA" },
            { n: "3", label: "Validation", key: "EN_ATTENTE_DIR_FINAL" },
            { n: "4", label: "Finalisé", key: "VALIDE" },
          ]
      : [
          { n: "1", label: "Pédagogie", key: "EN_ATTENTE_DIR_INITIAL" },
          { n: "2", label: "Finances", key: "EN_ATTENTE_COMPTA" },
          { n: "3", label: "Validation", key: "EN_ATTENTE_DIR_FINAL" },
          { n: "4", label: "Finalisé", key: "VALIDE" },
        ];
  const reopenStepOptions: { value: string; label: string }[] = [];
  for (const s of currentSteps) {
    if (s.key === "VALIDE") continue;
    reopenStepOptions.push({ value: s.key, label: s.label });
  }
  if (withBusLogistics && !reopenStepOptions.some((o) => o.value === "EN_ATTENTE_BUS_SIGNATURE")) {
    const logIdx = reopenStepOptions.findIndex((o) => o.value === "PROF_LOGISTICS");
    const busStep = { value: "EN_ATTENTE_BUS_SIGNATURE", label: "Signature devis bus" };
    if (logIdx >= 0) reopenStepOptions.splice(logIdx + 1, 0, busStep);
    else reopenStepOptions.push(busStep);
  }
  const selectedReopenStep =
    reopenStepOptions.find((o) => o.value === reopenStep)?.value || reopenStepOptions[0]?.value || "";
  return (
    <div className="relative max-w-5xl mx-auto p-6 space-y-8">
      {loadingAction && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="relative flex justify-center">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="absolute inset-0 flex items-center justify-center text-xl">
                {loadingAction === "circular" ? "📄" : loadingAction === "signing" ? "✍️" : "⏳"}
              </span>
            </div>
            {loadingAction === "circular" ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Génération de la circulaire</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Analyse des documents en cours. Cela peut prendre <strong>une dizaine de secondes</strong>.
                    <br /><br />
                    <span className="text-indigo-600 font-semibold italic">Merci de ne pas quitter cette page.</span>
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl">
                  <p className="text-[11px] text-indigo-700 font-medium">
                    💡 Une fois terminé, le document se trouvera dans les pièces du dossier sous le nom <strong>"Circulaire Parents"</strong>.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {loadingAction === "signing" ? "Signature en cours…" : "Traitement en cours…"}
                </h3>
                <p className="text-slate-500 text-sm">Merci de patienter.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {trip.status === "SEANCE_ANNULEE" && (
        <div className="bg-slate-100 border border-slate-300 p-5 rounded-2xl text-left">
          <p className="font-bold text-slate-800">Séance annulée</p>
          <p className="text-sm text-slate-600 mt-1">
            Ce créneau ne fait plus partie du circuit de validation. Les autres dossiers de la série éventuelle restent inchangés.
          </p>
        </div>
      )}
      {trip.status === "BESOIN_MODIFICATION" && !isEditing && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-left">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="font-bold text-orange-900">Action requise : Modifications demandées</p>
              <p className="text-orange-700 text-sm italic">"{trip.history?.[trip.history.length - 1]?.note}"</p>
            </div>
          </div>
          {isOwner && (
            <button onClick={() => setIsEditing(true)} className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all active:scale-95">
              Modifier mon dossier
            </button>
          )}
        </div>
      )}
      <div className="flex justify-between items-center">
        <button onClick={() => router.push('/travels')} className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95">
          ← Retour
        </button>
        {isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-2xl font-bold">Annuler</button>
            <button 
              onClick={() => handleAction(trip.data.previousStatus || "EN_ATTENTE_DIR_INITIAL", "Modifications effectuées")}
              disabled={uploading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg disabled:opacity-50"
            >
              {uploading ? "Envoi..." : "✅ Enregistrer et Renvoyer"}
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-between items-start border-b pb-6 text-left">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{trip.data.title}</h1>
          <p className="text-slate-500 mt-1 uppercase text-xs font-black tracking-tighter">
            {" "}
            {trip.type === "COMPLEX" ? "📁 Dossier Voyage Complexe" : "📄 Sortie Simple"} • Par {trip.ownerName}
            {isRecurrenceTrip && seriesIndex != null && seriesTotal != null && (
              <span className="ml-2 normal-case font-bold text-indigo-600">
                · Série {seriesIndex}/{seriesTotal}
              </span>
            )}
          </p>
        </div>
        <div className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider ${trip.status === "BESOIN_MODIFICATION" ? "bg-orange-100 text-orange-700 animate-pulse" : "bg-indigo-100 text-indigo-700"}`}>
          {trip.status}
        </div>
      </div>
      <div
        className={`grid gap-4 text-center ${
          trip.type === "COMPLEX" ? (withBusLogistics ? "grid-cols-5" : "grid-cols-4") : "grid-cols-4"
        }`}
      >
        {currentSteps.map((s) => (
          <Step
            key={s.n}
            label={s.label}
            active={
              trip.status === s.key ||
              (s.key === "VALIDE" && trip.status === "VALIDE") ||
              (withBusLogistics && trip.status === "EN_ATTENTE_BUS_SIGNATURE" && s.key === "PROF_LOGISTICS")
            }
            step={s.n}
          />
        ))}
      </div>
      {trip.type === "COMPLEX" && !withBusLogistics && (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-left">
          Aucun transport en bus n’a été demandé pour ce voyage : l’étape logistique (devis transporteurs) est ignorée.
        </p>
      )}
      {withBusLogistics && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 space-y-6 text-left">
          <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">🚌 Gestion des devis Transport</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-bold text-amber-700 uppercase">Offres déposées :</p>
              {trip.receivedDevis && trip.receivedDevis.length > 0 ? (
                trip.receivedDevis.map((quote: any, idx: number) => {
                  const reviewBus =
                    quote.matchReviewRequired === true ||
                    (quote.source === "email" &&
                      quote.matchConfidence &&
                      quote.matchConfidence !== "high");
                  const borderSelected = trip.data.selectedBusQuote?.fileUrl === quote.fileUrl;
                  return (
                  <div key={quote.id || idx} className={`p-4 rounded-2xl border-2 flex justify-between items-center gap-3 ${borderSelected ? "border-green-500 bg-white shadow-md" : reviewBus ? "border-orange-400 bg-orange-50/80" : "border-white bg-white/50"}`}>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-bold text-slate-800">{quote.providerName}</p>
                      <p className="text-indigo-600 font-black text-xs italic">
                        Devis reçu
                        {quote.source === "email" ? " (e-mail)" : quote.source === "manual" ? " (ajout manuel)" : ""}
                      </p>
                      {reviewBus && (
                        <p className="mt-1 text-[10px] font-bold text-orange-800 uppercase tracking-wide">
                          À vérifier — rattachement automatique ({quote.matchConfidence || "?"})
                        </p>
                      )}
                      {quote.matchMotif && reviewBus && (
                        <p className="mt-0.5 text-[10px] text-orange-900/90 leading-snug">{quote.matchMotif}</p>
                      )}
                      {(quote.extractedPrice || quote.extractedCompany) && (
                        <p className="mt-1 text-[11px] text-slate-600">
                          {quote.extractedCompany ? <span className="font-medium">{quote.extractedCompany}</span> : null}
                          {quote.extractedCompany && quote.extractedPrice ? " · " : null}
                          {quote.extractedPrice ? <span className="font-semibold text-slate-800">{quote.extractedPrice}</span> : null}
                        </p>
                      )}
                      {(() => {
                        const to = orderEmailForQuote(quote);
                        return to ? (
                          <p className="mt-1.5 text-[10px] text-slate-700">
                            <span className="font-bold text-slate-500">Commande →</span>{" "}
                            <span className="font-mono">{to}</span>
                            {quote.extractedContactEmail?.trim() ? (
                              <span className="text-emerald-700 font-semibold"> (sur le devis)</span>
                            ) : quote.providerEmail?.trim() ? (
                              <span className="text-slate-500">
                                {" "}
                                ({quote.source === "manual" ? "saisi à la main" : "expéditeur mail"})
                              </span>
                            ) : null}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[10px] font-bold text-rose-700">
                            Aucun e-mail pour la commande — renseigner ou vérifier le devis.
                          </p>
                        );
                      })()}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => openSecureFile(quote.fileUrl)} className="text-[10px] font-bold text-slate-500 underline">Voir PDF</button>
                      {isOwner && trip.status === "PROF_LOGISTICS" && (
                        <button onClick={() => selectBusQuote(quote)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Choisir</button>
                      )}
                    </div>
                  </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic">En attente de devis par e-mail...</p>
              )}
              {canAddDocuments && (
                <form onSubmit={addManualBusQuote} className="mt-4 p-4 rounded-2xl border border-dashed border-amber-400/80 bg-amber-100/30 space-y-3 text-left">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Ajouter un devis à la main
                  </p>
                  <p className="text-[11px] text-amber-900/80 leading-snug">
                    Si les devis n’arrivent pas par la boîte dédiée (mail lu, polling, etc.), déposez le PDF ici et l’e-mail du transporteur : après choix et signature, la commande partira vers cette adresse.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Nom du transporteur
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        value={manualDevisName}
                        onChange={(ev) => setManualDevisName(ev.target.value)}
                        placeholder="ex. Cars Dupont"
                        disabled={manualDevisBusy}
                      />
                    </label>
                    <label className="block text-[11px] font-semibold text-slate-700">
                      E-mail du transporteur (commande)
                      <input
                        type="email"
                        required
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        value={manualDevisEmail}
                        onChange={(ev) => setManualDevisEmail(ev.target.value)}
                        placeholder="contact@transporteur.fr"
                        disabled={manualDevisBusy}
                      />
                    </label>
                  </div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    PDF du devis
                    <input
                      name="manualDevisPdf"
                      type="file"
                      accept="application/pdf"
                      className="mt-1 block w-full text-sm text-slate-600"
                      disabled={manualDevisBusy}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={manualDevisBusy}
                    className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-800 disabled:opacity-50"
                  >
                    {manualDevisBusy ? "Envoi…" : "Ajouter ce devis"}
                  </button>
                </form>
              )}
            </div>
            <div className="bg-white/60 rounded-2xl p-6 border border-amber-200 flex flex-col justify-center items-center text-center">
              {trip.data.selectedBusQuote ? (
                <>
                  <p className="text-sm text-amber-900 mb-2 font-bold">Devis sélectionné : {trip.data.selectedBusQuote.providerName}</p>
                  {orderEmailForQuote(trip.data.selectedBusQuote) && (
                    <p className="text-xs text-amber-800 mb-3">
                      Envoi de la commande à :{" "}
                      <span className="font-mono font-bold">{orderEmailForQuote(trip.data.selectedBusQuote)}</span>
                    </p>
                  )}
                  {isDirection && trip.status === "EN_ATTENTE_BUS_SIGNATURE" && (
                    <div className="flex flex-col gap-3 w-full">
                      {canSign ? (
                        <button onClick={signBusQuote} disabled={!!loadingAction} className="bg-green-600 text-white px-6 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                          ✍️ Signer & Commander
                        </button>
                      ) : (
                        <div className="bg-amber-100 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 text-left">
                          <p className="font-bold mb-1">Signature réservée</p>
                          <p>Ce dossier concerne l&apos;<strong>{etabForSign || "ensemble du groupe"}</strong>. Seule la direction de cet établissement peut signer.</p>
                        </div>
                      )}
                      <button onClick={() => { const n = prompt("Pourquoi refusez-vous ce devis ?"); if(n) handleAction("PROF_LOGISTICS", n); }} className="text-xs font-bold text-red-600 underline">
                        Refuser ce choix
                      </button>
                    </div>
                  )}
                  {(trip.status === "EN_ATTENTE_COMPTA" || trip.status === "EN_ATTENTE_DIR_FINAL" || trip.status === "VALIDE") && <p className="text-green-600 font-bold flex items-center gap-2 text-sm">✅ Commandé & Signé</p>}
                </>
              ) : (
                <p className="text-sm text-slate-400 italic font-medium">Le créateur sélectionnera un devis à l'étape Logistique.</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-left">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Informations Logistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <DetailItem label="Destination" value={trip.data.destination} wrap />
          <EditableDetail isEditing={isEditing} label="Classes concernées" value={isEditing ? editedData.classes : trip.data.classes} onChange={(v) => setEditedData({...editedData, classes: v})} />
          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Effectifs</span>
            {isEditing ? (
              <div className="flex gap-4">
                <div className="flex flex-col"><span className="text-[9px]">Élèves</span><input type="number" className="border rounded p-1 w-20" value={editedData.nbEleves} onChange={(e) => setEditedData({...editedData, nbEleves: e.target.value})} /></div>
                <div className="flex flex-col"><span className="text-[9px]">Accomp.</span><input type="number" className="border rounded p-1 w-20" value={editedData.nbAccompagnateurs} onChange={(e) => setEditedData({...editedData, nbAccompagnateurs: Number(e.target.value)})} /></div>
              </div>
            ) : (
              <span className="text-slate-700 font-medium">{trip.data.nbEleves} élèves | {trip.data.nbAccompagnateurs || "0"} accompagnateurs</span>
            )}
          </div>
          <EditableDetail isEditing={isEditing} label="Noms des accompagnateurs" value={isEditing ? editedData.nomsAccompagnateurs : trip.data.nomsAccompagnateurs} onChange={(v) => setEditedData({...editedData, nomsAccompagnateurs: v})} />
          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dates</span>
            {isEditing ? (
              <div className="flex gap-2">
                <input type="date" className="text-sm border p-1 rounded" value={editedData.startDate || editedData.date || ""} onChange={(e) => setEditedData({...editedData, startDate: e.target.value, date: e.target.value})} />
                {trip.type === "COMPLEX" && <input type="date" className="text-sm border p-1 rounded" value={editedData.endDate || ""} onChange={(e) => setEditedData({...editedData, endDate: e.target.value})} />}
              </div>
            ) : (
              <span className="text-slate-700 font-medium">{trip.type === "COMPLEX" ? `Du ${formatSafeDate(trip.data.startDate)} au ${formatSafeDate(trip.data.endDate)}` : `Le ${formatSafeDate(trip.data.date)}`}</span>
            )}
          </div>
          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Horaires</span>
            {isEditing ? (
              <div className="flex gap-2">
                <input type="text" className="text-sm border p-1 rounded w-24" placeholder="Départ" value={editedData.startTime} onChange={(e) => setEditedData({...editedData, startTime: e.target.value})} />
                <input type="text" className="text-sm border p-1 rounded w-24" placeholder="Retour" value={editedData.endTime} onChange={(e) => setEditedData({...editedData, endTime: e.target.value})} />
              </div>
            ) : (
              <span className="text-slate-700 font-medium">{`Départ: ${trip.data.startTime} | Retour: ${trip.data.endTime}`}</span>
            )}
          </div>
          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Budget prévisionnel</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input type="number" className="text-sm border p-1 rounded w-32" value={editedData.coutTotal} onChange={(e) => setEditedData({...editedData, coutTotal: Number(e.target.value)})} />
                <span className="text-slate-600 font-bold text-xs uppercase">€ Total</span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-slate-700 font-medium">{Math.round(Number(trip.data.coutTotal))} € (Total prévisionnel)</span>
                {trip.data.finalTotalCost && (
                  <span className="text-green-600 font-bold text-sm">Validé Compta : {trip.data.finalTotalCost} € ({trip.data.costPerStudent} €/élève)</span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Restauration</span>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCuisineModal(true)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${editedData?.piqueNiqueDetails?.active ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className="text-left">
                    <h3 className="font-bold text-slate-900">Commande Restauration</h3>
                    <p className="text-xs text-slate-500">
                      {editedData?.piqueNiqueDetails?.active ? `✅ Configurée (${getTotalMeals(editedData.piqueNiqueDetails)} repas pique-nique)` : "Cliquer pour configurer"}
                    </p>
                  </div>
                  <span className="text-xl">🥪</span>
                </button>
              </div>
            ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-slate-700 font-medium">{trip.data.piqueNiqueDetails?.active ? "🥪 Commande cuisine configurée" : "🍴 Pas de commande cuisine"}</span>
                  {trip.data.piqueNiqueDetails?.active && (
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                      {getTotalMeals(trip.data.piqueNiqueDetails)} repas pique-nique — {Object.values(trip.data.piqueNiqueDetails.daysSelection || {}).filter(Boolean).length} jour(s)
                    </span>
                  )}
                </div>
            )}
          </div>
          <div className="md:col-span-2 flex flex-col border-b border-slate-50 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Objectifs pédagogiques</span>
            {isEditing ? (
              <textarea 
                className="text-sm border p-2 rounded w-full mt-2 min-h-[80px]" 
                value={editedData.objectifs} 
                onChange={(e) => setEditedData({...editedData, objectifs: e.target.value})}
              />
            ) : (
              <p className="text-slate-700 font-medium mt-1 text-sm leading-relaxed">{trip.data.objectifs || "Aucun objectif renseigné."}</p>
            )}
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documents et Devis</span>
              <div className="flex items-center gap-2">
                {trip.status === "VALIDE" && (canSign || isOwner) && (
                  <button
                    type="button"
                    onClick={handleRegenerateCircular}
                    disabled={!!loadingAction}
                    className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {loadingAction === "regenerate-circular" ? "Génération..." : "↻ Régénérer la circulaire"}
                  </button>
                )}
                {canAddDocuments && (
                  <>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50">
                      {uploading ? "Upload..." : "+ Ajouter un document"}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {(isEditing ? editedData.attachments : trip.data.attachments)?.map((file: any, idx: number) => (
                <div key={idx} className="relative group flex items-center gap-2 p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-indigo-600 shadow-sm">
                  <button type="button" onClick={() => openSecureFile(file.url)} className="hover:underline">📄 {file.name}</button>
                  {canSeeTravelDocHoverActions && (
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20">
                      <div className="pointer-events-auto bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openSecureFile(file.url)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        >
                          Ouvrir
                        </button>
                        <button
                          type="button"
                          onClick={() => prepareSendToZeendoc(file)}
                          disabled={zeendocSendingUrl === file.url}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
                        >
                          {zeendocSendingUrl === file.url ? "Envoi..." : "Envoyer Zeendoc"}
                        </button>
                      </div>
                    </div>
                  )}
                  {canManageFiles && (
                    <button type="button" onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600 px-1 font-bold text-[10px]">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {canUseInternalThread && (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-left space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Fil interne (post-it)</h2>
              <p className="text-xs text-slate-500 mt-1">Visible uniquement par le créateur, la direction et la comptabilité.</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {(trip.messages || []).length} message(s)
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            {(trip.messages || []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucun message interne pour le moment.</p>
            ) : (
              [...(trip.messages || [])]
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((msg: any) => (
                  <div key={msg.id || `${msg.user}_${msg.date}`} className="bg-white border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-700">{msg.user} <span className="text-slate-400 font-medium">({msg.role || "—"})</span></p>
                      <p className="text-[10px] text-slate-400">{new Date(msg.date).toLocaleString("fr-FR")}</p>
                    </div>
                    <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))
            )}
          </div>

          <div className="space-y-3">
            <textarea
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Écrire un message interne... (ex: l'hôtel est trop cher, pouvez-vous proposer une alternative ?)"
              className="w-full min-h-[90px] rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="flex justify-end">
              <button
                onClick={postInternalMessage}
                disabled={!draftMessage.trim()}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-indigo-700 transition"
              >
                Envoyer le message
              </button>
            </div>
          </div>
        </div>
      )}
      {(isDirection || isCompta) && !isEditing && trip.status !== "BESOIN_MODIFICATION" && trip.status !== "SEANCE_ANNULEE" && (
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl text-left">
          <div className="text-center md:text-left">
            <p className="font-bold text-lg">Espace Décisionnaire</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {isDirection && !canSign && (
              <div className="bg-slate-800 border border-slate-600 rounded-2xl px-5 py-3 text-sm text-slate-300 max-w-xs text-left">
                <p className="font-bold text-white mb-0.5">Accès en lecture seule</p>
                <p>Ce dossier concerne <span className="font-semibold text-amber-300">{etabForSign || "le groupe scolaire"}</span>. Seule la direction de cet établissement peut valider ou rejeter.</p>
              </div>
            )}
            {((canSign && (trip.status === 'EN_ATTENTE_DIR_INITIAL' || trip.status === 'EN_ATTENTE_BUS_SIGNATURE' || trip.status === 'EN_ATTENTE_DIR_FINAL')) || (isCompta && trip.status === 'EN_ATTENTE_COMPTA')) && (
              <>
                {canSign && (
                  <ActionButton label="Refus Définitif" color="bg-red-600" onClick={() => { const n = prompt("Motif du refus définitif :"); if(n) handleAction("REJETE", n); }} />
                )}
                <ActionButton label="Demander Modifs" color="bg-orange-500" onClick={() => {
                  const n = prompt("Précisez les changements attendus :");
                  if(n) {
                    const returnTo = trip.status === "EN_ATTENTE_DIR_FINAL" ? "EN_ATTENTE_COMPTA" : trip.status;
                    handleAction("BESOIN_MODIFICATION", n, { previousStatus: returnTo });
                  }
                }} />
              </>
            )}
            {canSign && trip.status === "EN_ATTENTE_DIR_INITIAL" && trip.type === "COMPLEX" && (
              <ActionButton
                label="Valider Pédagogie"
                color="bg-indigo-600"
                onClick={() =>
                  handleAction(
                    withBusLogistics ? "PROF_LOGISTICS" : "EN_ATTENTE_COMPTA",
                    withBusLogistics ? "Pédagogie validée" : "Pédagogie validée (sans transport bus)",
                  )
                }
              />
            )}
            {(isOwner || canSign) &&
              trip.type === "COMPLEX" &&
              !withBusLogistics &&
              trip.status === "PROF_LOGISTICS" && (
              <ActionButton
                label="Passer aux finances"
                color="bg-indigo-600"
                onClick={() => handleAction("EN_ATTENTE_COMPTA", "Sans bus — étape logistique non requise")}
              />
            )}
            {canSign && trip.status === 'EN_ATTENTE_DIR_INITIAL' && trip.type !== "COMPLEX" && !seriesId && (
              <ActionButton label="Valider Pédagogie" color="bg-indigo-600" onClick={() => handleAction("EN_ATTENTE_COMPTA", "Pédagogie validée")} />
            )}
            {canSign && trip.status === 'EN_ATTENTE_DIR_INITIAL' && trip.type !== "COMPLEX" && seriesId && (
              <ActionButton
                label={loadingAction ? "Validation série…" : "Valider toute la série (pédagogie)"}
                color="bg-indigo-600"
                onClick={validateSeriesPedagogy}
              />
            )}
            {isCompta && trip.status === 'EN_ATTENTE_COMPTA' && (
              <ActionButton label="Valider Budget Global" color="bg-green-600" onClick={() => {
                const total = prompt("Montant GLOBAL final (€) :");
                if(total) {
                  const student = prompt("Coût par ÉLÈVE final (€) :");
                  if(student) handleAction("EN_ATTENTE_DIR_FINAL", "Budget validé", { finalTotalCost: total, costPerStudent: student });
                }
              }} />
            )}
            {canSign && trip.status === 'EN_ATTENTE_DIR_FINAL' && (
              <ActionButton label={loadingAction ? "Finalisation..." : "Validation Finale Dossier"} color="bg-green-600" onClick={handleFinalValidation}/>
            )}
            {trip.status === "VALIDE" && (canSign || isOwner) && (
              <ActionButton
                label={loadingAction === "regenerate-circular" ? "Génération circulaire..." : "Régénérer la circulaire"}
                color="bg-emerald-600"
                onClick={handleRegenerateCircular}
              />
            )}
            {canSign && trip.status === "VALIDE" && reopenStepOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3">
                <label htmlFor="reopen-step-select" className="text-sm text-slate-300 shrink-0">
                  Réouvrir à l&apos;étape :
                </label>
                <select
                  id="reopen-step-select"
                  value={selectedReopenStep}
                  onChange={(e) => setReopenStep(e.target.value)}
                  className="bg-slate-700 text-white text-sm font-medium rounded-xl px-3 py-2 border border-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 min-w-[10rem]"
                >
                  {reopenStepOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ActionButton
                  label={loadingAction ? "Réouverture…" : "Réouvrir le dossier"}
                  color="bg-violet-600"
                  onClick={() => {
                    const opt = reopenStepOptions.find((o) => o.value === selectedReopenStep);
                    if (opt) handleReopenDossier(opt.value, opt.label);
                  }}
                />
              </div>
            )}
            {canCancelRecurrenceSession && canSign && (
              <ActionButton
                label="Annuler cette séance seule"
                color="bg-slate-500"
                onClick={cancelRecurrenceSession}
              />
            )}
          </div>
        </div>
      )}
      {canCancelRecurrenceSession && !isEditing && !canSign && isOwner && trip.status !== "SEANCE_ANNULEE" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
          <p className="text-sm text-amber-900">
            <span className="font-bold">Série récurrente :</span> vous pouvez retirer uniquement ce créneau sans modifier les autres dossiers.
          </p>
          <button
            type="button"
            disabled={!!loadingAction}
            onClick={cancelRecurrenceSession}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-bold hover:bg-amber-800 disabled:opacity-50"
          >
            Annuler cette séance seule
          </button>
        </div>
      )}
      {showCuisineModal && isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-5xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Bon de commande Cuisine</h2>
                <p className="text-slate-500 text-sm">Modification de la commande restauration</p>
              </div>
              <button onClick={() => setShowCuisineModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Heure récupération / livraison</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded-lg"
                    value={editedData?.piqueNiqueDetails?.deliveryTime || ""}
                    onChange={e => setEditedData((prev: any) => ({
                      ...prev,
                      piqueNiqueDetails: { ...(prev.piqueNiqueDetails || emptyCuisineDetails()), active: true, deliveryTime: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Lieu de récupération</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={editedData?.piqueNiqueDetails?.deliveryPlace || "Self"}
                    onChange={e => setEditedData((prev: any) => ({
                      ...prev,
                      piqueNiqueDetails: { ...(prev.piqueNiqueDetails || emptyCuisineDetails()), active: true, deliveryPlace: e.target.value }
                    }))}
                  >
                    <option value="Self">Au self</option>
                    <option value="Bosco">Église Bosco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 text-center">Jours concernés</label>
                  <div className="flex gap-1.5 justify-center">
                    {CUISINE_DAYS.map(({ key: dayKey, label }) => {
                      const isSelected = !!editedData?.piqueNiqueDetails?.daysSelection?.[dayKey];
                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => setEditedData((prev: any) => ({
                            ...prev,
                            piqueNiqueDetails: {
                              ...(prev.piqueNiqueDetails || emptyCuisineDetails()),
                              active: true,
                              daysSelection: {
                                ...(prev.piqueNiqueDetails?.daysSelection || emptyCuisineDetails().daysSelection),
                                [dayKey]: !isSelected
                              }
                            }
                          }))}
                          className={`w-9 h-9 rounded-lg text-[11px] font-black transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border-2 text-slate-400 hover:border-indigo-300'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-indigo-600 text-white">
                      <th className="text-left p-2.5 font-semibold w-52">Désignation</th>
                      {CUISINE_DAYS.map(({ key: dayKey, label }) => (
                        <th key={dayKey} className={`p-2.5 text-center font-semibold transition-opacity ${editedData?.piqueNiqueDetails?.daysSelection?.[dayKey] ? 'opacity-100' : 'opacity-30'}`}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CUISINE_ROWS.map(({ key: rowKey, label, type }, rowIdx) => (
                      <tr key={rowKey} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className={`p-2 font-medium text-slate-700 whitespace-nowrap ${rowKey === 'picnicNoPork' || rowKey === 'picnicVeg' ? 'pl-5 text-slate-500 italic' : ''}`}>{label}</td>
                        {CUISINE_DAYS.map(({ key: dayKey }) => {
                          const isActive = !!editedData?.piqueNiqueDetails?.daysSelection?.[dayKey];
                          const val = editedData?.piqueNiqueDetails?.orders?.[dayKey]?.[rowKey] ?? "";
                          return (
                            <td key={dayKey} className="p-1">
                              <input
                                type={type}
                                disabled={!isActive}
                                value={val}
                                onChange={e => setEditedData((prev: any) => ({
                                  ...prev,
                                  piqueNiqueDetails: {
                                    ...(prev.piqueNiqueDetails || emptyCuisineDetails()),
                                    active: true,
                                    orders: {
                                      ...(prev.piqueNiqueDetails?.orders || emptyCuisineDetails().orders),
                                      [dayKey]: {
                                        ...((prev.piqueNiqueDetails?.orders || emptyCuisineDetails().orders)[dayKey]),
                                        [rowKey]: e.target.value
                                      }
                                    }
                                  }
                                }))}
                                className={`w-full p-1.5 border rounded text-center transition-all ${isActive ? 'bg-white hover:border-indigo-300 focus:border-indigo-500 outline-none' : 'bg-slate-100 text-slate-300 cursor-not-allowed border-transparent'}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-500 italic bg-amber-50 border border-amber-100 p-2.5 rounded-lg">⚠️ Rappel : fournir la liste des élèves/adultes 15 jours avant, et l’affiner 24h avant.</p>
            </div>
            <div className="flex gap-3 mt-10">
              <button
                type="button"
                onClick={() => {
                  setEditedData((prev: any) => ({
                    ...prev,
                    piqueNiqueDetails: { ...(prev.piqueNiqueDetails || emptyCuisineDetails()), active: false }
                  }));
                  setShowCuisineModal(false);
                }}
                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold"
              >
                ANNULER LA COMMANDE
              </button>
              <button
                type="button"
                onClick={() => setShowCuisineModal(false)}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100"
              >
                ENREGISTRER LE BON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ label, active, step }: { label: string, active: boolean, step: string }) {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-sm' : 'border-slate-100 opacity-50'}`}>
      <p className="text-[10px] font-bold uppercase text-indigo-600 text-left">Étape {step}</p>
      <p className="font-bold text-slate-800 text-xs text-left">{label}</p>
    </div>
  );
}

function DetailItem({ label, value, wrap }: { label: string; value: string; wrap?: boolean }) {
  return (
    <div
      className={`flex flex-col border-b border-slate-50 pb-2 text-left ${wrap ? "md:col-span-2" : ""}`}
    >
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span
        className={
          wrap
            ? "text-slate-700 font-medium whitespace-pre-wrap break-words leading-relaxed"
            : "text-slate-700 font-medium truncate"
        }
      >
        {value || "—"}
      </span>
    </div>
  );
}

function EditableDetail({ isEditing, label, value, onChange, type = "text" }: { isEditing: boolean, label: string, value: any, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="flex flex-col border-b border-slate-50 pb-2 text-left">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      {isEditing ? (
        <input type={type} className="text-sm border-b-2 border-indigo-300 outline-none bg-indigo-50 px-1 font-medium text-slate-700 w-full" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <span className="text-slate-700 font-medium">{value || "—"}</span>
      )}
    </div>
  );
}

function ActionButton({ label, color, onClick }: { label: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform`}>{label}</button>
  );
}