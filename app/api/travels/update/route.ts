import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import IMAGE_CATALOG from "./image-catalog.json";
import { SCHOOL } from "@/app/lib/school";

const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_\s-]+/g, "");

const resolveDirectorByEtab = (etablissement?: string | null) => {
  const e = norm(etablissement || "");
  if (e === "ecole") return { label: SCHOOL.ecole.label, directrice: SCHOOL.ecole.directrice, email: SCHOOL.ecole.email };
  if (e === "college") return { label: SCHOOL.college.label, directrice: SCHOOL.college.directrice, email: SCHOOL.college.email };
  if (e === "lycee") return { label: SCHOOL.lycee.label, directrice: SCHOOL.lycee.directrice, email: SCHOOL.lycee.email };
  return { label: "Groupe Scolaire", directrice: SCHOOL.lycee.directrice, email: SCHOOL.lycee.email };
};

export async function POST(req: Request) {
  const { userId } = await auth(); 
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  try {
    const body = await req.json();
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
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `travels/${tripId}.json`,
      Body: JSON.stringify(objectToSave),
      ContentType: "application/json",
    }));
    const INDEX_KEY = 'travels/index.json';
    let currentIndex = [];
    try {
      const getIndexCommand = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: INDEX_KEY,
      });
      const indexRes = await s3Client.send(getIndexCommand);
      const indexBody = await indexRes.Body?.transformToString();
      if (indexBody) currentIndex = JSON.parse(indexBody);
    } catch (e) {
    }
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
      }
    };
    const existingIndex = currentIndex.findIndex((t: any) => t.id === tripId);
    const isNewProject = existingIndex === -1;
    if (existingIndex > -1) { currentIndex[existingIndex] = tripSummary;
    } else { currentIndex.push(tripSummary);
    }
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: INDEX_KEY,
      Body: JSON.stringify(currentIndex),
      ContentType: "application/json",
    }));
    if (isNewProject) {
      try {
        const director = resolveDirectorByEtab(innerData.etablissement);
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
            `Un nouveau projet de sortie a été créé sur Travels et nécessite votre suivi.`,
            ``,
            `Établissement ciblé : ${innerData.etablissement || "Groupe Scolaire"}`,
            `Créé par : ${creatorName}`,
            `Titre : ${title}`,
            `Destination : ${destination}`,
            `Dates : ${dateInfo}`,
            `Effectif : ${innerData.nbEleves || "—"} élèves / ${innerData.nbAccompagnateurs || "—"} accompagnateurs`,
            ``,
            `Vous pouvez consulter le dossier dans l'espace administratif Travels.`,
            ``,
            `Cordialement,`,
            `Plateforme Voyages`,
          ].join("\n"),
        });
      } catch (mailErr) { console.error("Erreur notification direction:", mailErr)}
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERREUR S3:", error);
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
}