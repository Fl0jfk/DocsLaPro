import { NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { isValidTravelsReopenFromValideStatus } from "@/app/lib/travels-direction-permissions";
import nodemailer from "nodemailer";
import IMAGE_CATALOG from "./image-catalog.json";
import { notifyComptaTravelsPhase, type TravelsTripForNotify } from "@/app/lib/travels-notify";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson, putTenantJson } from "@/app/lib/tenant-s3-storage";
import { canSignTravelsDirectionForEtabTenant, resolveDirectorFromTenant } from "@/app/lib/tenant-establishments";

function mergeReceivedDevis(fromClient: unknown, fromS3: unknown): unknown[] {
  const clientArr = Array.isArray(fromClient) ? fromClient : [];
  const s3Arr = Array.isArray(fromS3) ? fromS3 : [];
  const byId = new Map<string, unknown>();
  const idOf = (item: unknown): string | null => {
    if (item && typeof item === "object" && "id" in item && (item as { id: unknown }).id != null) {
      return String((item as { id: unknown }).id);
    }
    return null;
  };
  for (const item of s3Arr) {
    const id = idOf(item);
    if (id) byId.set(id, item);
  }
  for (const item of clientArr) {
    const id = idOf(item);
    if (id) byId.set(id, item);
  }
  return [...byId.values()];
}

export async function POST(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;
  try {
    const body = await req.json();
    const suppressNewTripEmail = Boolean(body.suppressNewTripEmail);
    const tripId = body.id;
    const innerData = body.data?.data || {}; 
    const title = innerData.title || "Titre introuvable";
    const destination = innerData.destination || "Destination introuvable";
    const objectToSave = body.data; 
    if (!objectToSave.imageUrl) {
      try {
        const catalogSummary = IMAGE_CATALOG.map(i => `${i.id} (${i.label})`).join(", ");
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`
          },
          body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [
              { 
                role: "system", 
                content: `Choisis l'ID exact parmis : ${catalogSummary}. Réponds uniquement par l'ID. Sinon "img_default".` 
              },
              { 
                role: "user", 
                content: `DONNÉES À ANALYSER : - TITRE : "${title}" - LIEU : "${destination}"` 
              }
            ],
            temperature: 0
          })
        });
        const resData = await response.json();
        const mistralChoice = resData.choices?.[0]?.message?.content?.trim();
        const matchedImage = IMAGE_CATALOG.find(img => 
          img.id.toLowerCase().replace(/[^a-z0-9]/g, '') === mistralChoice?.toLowerCase().replace(/[^a-z0-9]/g, '')
        ) || IMAGE_CATALOG.find(img => img.id === "img_default") || IMAGE_CATALOG[0];
        objectToSave.imageUrl = matchedImage.url;
        objectToSave.imageConfigId = matchedImage.id;
      } catch (err) { console.error("Erreur IA:", err)}
    }
    const tripRel = `travels/${tripId}.json`;
    const existingHit = await getTenantJson<Record<string, unknown>>(orgId, tripRel);
    const existingOnS3 = existingHit?.data ?? null;
    if (existingOnS3 && Array.isArray(existingOnS3.receivedDevis)) {
      objectToSave.receivedDevis = mergeReceivedDevis(
        objectToSave.receivedDevis,
        existingOnS3.receivedDevis
      );
    }
    const previousStatus = existingOnS3 && typeof existingOnS3.status === "string" ? existingOnS3.status : null;
    const newStatus = typeof objectToSave.status === "string" ? objectToSave.status : "";
    if (previousStatus === "VALIDE" && newStatus !== "VALIDE" && newStatus !== previousStatus) {
      if (!isValidTravelsReopenFromValideStatus(newStatus)) {
        return NextResponse.json({ error: "Étape de réouverture invalide." }, { status: 400 });
      }
      const me = await currentUser();
      const innerForPerm = (objectToSave.data as { etablissement?: string } | undefined) || {};
      const etab =
        typeof innerForPerm.etablissement === "string"
          ? innerForPerm.etablissement
          : typeof (existingOnS3?.data as { etablissement?: string } | undefined)?.etablissement === "string"
            ? (existingOnS3!.data as { etablissement: string }).etablissement
            : null;
      if (!(await canSignTravelsDirectionForEtabTenant(me, orgId, etab))) {
        return NextResponse.json(
          { error: "Seule la direction de l'établissement concerné peut réouvrir un dossier finalisé." },
          { status: 403 },
        );
      }
    }
    await putTenantJson(orgId, tripRel, objectToSave);
    const indexHit = await getTenantJson<unknown[]>(orgId, "travels/index.json");
    let currentIndex: unknown[] = Array.isArray(indexHit?.data) ? indexHit.data : [];
    const tripSummary = {
      id: tripId,
      ownerName: objectToSave.ownerName,
      status: objectToSave.status,
      type: objectToSave.type,
      createdAt: objectToSave.createdAt || new Date().toISOString(),
      data: {
        title: title,
        destination: destination,
        imageUrl: objectToSave.imageUrl,
        nbEleves: innerData.nbEleves,
        nbAccompagnateurs: innerData.nbAccompagnateurs,
        nomsAccompagnateurs: innerData.nomsAccompagnateurs || [],
        classes: innerData.classes || [],
        piqueNique: innerData.piqueNique || false,
        piqueNiqueDetails: innerData.piqueNiqueDetails || null,
        date: innerData.date || null, 
        startDate: innerData.startDate || innerData.date || null,
        endDate: innerData.endDate || innerData.date || null,
        startTime: innerData.startTime || null,
        endTime: innerData.endTime || null,
        needsBus: innerData.needsBus || false,
        transportRequest: innerData.transportRequest || null,
        objectifs: innerData.objectifs || innerData.pedagogicalObjectives || null,
        coutTotal: innerData.coutTotal,
        etablissement: innerData.etablissement || null,
        recurrenceSeriesId: innerData.recurrenceSeriesId || null,
        recurrenceIndex: innerData.recurrenceIndex ?? null,
        recurrenceTotal: innerData.recurrenceTotal ?? null,
      }
    };
    const existingIndex = currentIndex.findIndex((t: any) => t.id === tripId);
    const isNewProject = existingIndex === -1;
    if (existingIndex > -1) { currentIndex[existingIndex] = tripSummary;
    } else { currentIndex.push(tripSummary);
    }
    await putTenantJson(orgId, "travels/index.json", currentIndex);
    if (newStatus === "EN_ATTENTE_COMPTA" && previousStatus !== "EN_ATTENTE_COMPTA") {
      try {
        await notifyComptaTravelsPhase({
          orgId,
          tripId,
          trip: objectToSave as TravelsTripForNotify,
          previousStatus,
        });
      } catch (mailErr) {
        console.error("Erreur notification compta Travels:", mailErr);
      }
    }
    if (isNewProject && !suppressNewTripEmail) {
      try {
        const director = await resolveDirectorFromTenant(orgId, innerData.etablissement);
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        const creatorName = objectToSave.ownerName || "Enseignant";
        const dateInfo = innerData.startDate || innerData.endDate ? `du ${innerData.startDate || innerData.date || "—"} au ${innerData.endDate || innerData.date || "—"}` : (innerData.date || "—");
        await transporter.sendMail({
          from: `"Plateforme Voyages" <${process.env.SMTP_USER}>`,
          to: director.email,
          subject: `Nouvelle demande de sortie — ${innerData.etablissement || "Groupe Scolaire"} — ${title}`,
          text: [
            `Bonjour ${director.directrice},`,
            ``,
            `Un nouveau projet de sortie a été créé sur DocsLapro et nécessite votre suivi.`,
            ``,
            `Établissement ciblé : ${innerData.etablissement || "Groupe Scolaire"}`,
            `Créé par : ${creatorName}`,
            `Titre : ${title}`,
            `Destination : ${destination}`,
            `Dates : ${dateInfo}`,
            `Effectif : ${innerData.nbEleves || "—"} élèves / ${innerData.nbAccompagnateurs || "—"} accompagnateurs`,
            ``,
            `Vous pouvez consulter le dossier dans l'espace sortie scolaire de DocsLapro.`,
            ``,
            `Cordialement,`,
            `Plateforme Voyages`,
          ].join("\n"),
        });
      } catch (mailErr) { console.error("Erreur notification direction:", mailErr)}
    }
    return NextResponse.json({
      success: true,
      imageUrl: objectToSave.imageUrl,
      imageConfigId: objectToSave.imageConfigId,
    });
  } catch (error) {
    console.error("ERREUR S3:", error);
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
}