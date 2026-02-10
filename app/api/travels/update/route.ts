import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const IMAGE_CATALOG = [
  { 
    id: "Mc'Donalds Rouen", 
    label: "Sortie McDonald's / Fast Food", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/mcdo+rouen.webp",
    keywords: "burger, frites, mcdo, repas, rouen, mcdonalds" 
  },
  { 
    id: "Mont-Saint-Michel", 
    label: "Mont Saint-Michel", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Mont-Saint-Michel_vu_du_ciel.jpg",
    keywords: "abbaye, normandie, histoire, mont-saint-michel" 
  },
  { 
    id: "Disneyland Paris", 
    label: "Disneyland Paris", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/disneyland-paris.jpg",
    keywords: "disney, disneyland, paris, parc, attractions" 
  },
  { 
    id: "Parc Astérix", 
    label: "Parc Astérix", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Parc+Asterix.webp",
    keywords: "asterix, paris, parc, attractions" 
  }
];

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
                content: `DONNÉES À ANALYSER :
                - TITRE DE LA SORTIE : "${title}"
                - LIEU PRÉVU : "${destination}"
                
                IDENTIFIANT À EXTRAIRE DU CATALOGUE :` 
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
      } catch (err) {
        console.error("Erreur IA:", err);
      }
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
      console.log("Premier voyage : l'index va être créé.", e);
    }
    const tripSummary = {
      id: tripId,
      ownerName: objectToSave.ownerName,
      status: objectToSave.status,
      type: objectToSave.type,
      createdAt: objectToSave.createdAt || new Date().toISOString(),
      data: {
        title: innerData.title,
        destination: innerData.destination,
        imageUrl: objectToSave.imageUrl,
        nbEleves: innerData.nbEleves,
        coutTotal: innerData.coutTotal,
        date: innerData.date || null, 
        startDate: innerData.startDate || null,
        endDate: innerData.endDate || null,
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingIndex = currentIndex.findIndex((t: any) => t.id === tripId);
    if (existingIndex > -1) {
      currentIndex[existingIndex] = tripSummary;
    } else {
      currentIndex.push(tripSummary);
    }

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: INDEX_KEY,
      Body: JSON.stringify(currentIndex),
      ContentType: "application/json",
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERREUR S3:", error);
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
}