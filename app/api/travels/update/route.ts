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
  },
  { 
    id: "Assemblée Nationale", 
    label: "Assemblée Nationale", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/assemblee-nationale-2.jpg",
    keywords: "assemblee, nationale, paris" 
  },
  { 
    id: "Basilique Montligeon", 
    label: "Basilique Montligeon", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/basilique-montligeon-800.webp",
    keywords: "basilique, montligeon" 
  },
  { 
    id: "Cathédrale Bayeux", 
    label: "Cathédrale Bayeux", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/cath%C3%A9drale+bayeux.webp",
    keywords: "cathédrale, bayeux" 
  },
  { 
    id: "Cimetière Américain Colleville", 
    label: "Cimetière Américain Colleville", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/cimetiere_americain_colleville.jpg",
    keywords: "cimetière, américain, colleville" 
  },
  { 
    id: "Musée de la Monnaie de Paris", 
    label: "Musée de la Monnaie de Paris", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/monnaie-de-paris.jpg",
    keywords: "musée, monnaie, paris" 
  },
  { 
    id: "Musée Grévin", 
    label: "Musée Grévin", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Musee+Grevin.jpg",
    keywords: "musée, grevin, paris" 
  },
  { 
    id: "Musée Somme Albert 1914", 
    label: "Musée Somme Albert 1914", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Musee+Somme+Albert+1916.png",
    keywords: "musée, somme, albert 1916, 1ere guerre mondiale" 
  },
  { 
    id: "Musée des Beaux Arts de Rouen", 
    label: "Musée des Beaux Arts de Rouen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Mus%C3%A9e_Beaux_Arts_-_Rouen.jpg",
    keywords: "musée, beaux-arts, rouen" 
  },
  { 
    id: "Cinéma Omnia Rouen", 
    label: "Cinéma Omnia Rouen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/OMNIA-ROUEN.jpg",
    keywords: "cinéma, omnia, rouen" 
  },
  { 
    id: "Opéra Garnier Paris", 
    label: "Opéra Garnier Paris", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Opera+Garnier.jpg",
    keywords: "opéra, garnier, paris" 
  },
  { 
    id: "Parc du Bocasse", 
    label: "Parc du Bocasse", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Parc+du+bocasse.jpg",
    keywords: "parc, bocasse, attractions" 
  },
  { 
    id: "Station de ski Riouclar Meolans", 
    label: "Station de ski Riouclar Meolans", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Riouclar+Meolans.jpg",
    keywords: "station, ski, riouclar, meolan" 
  },
  { 
    id: "Tokyo", 
    label: "Tokyo", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Tokyo.avif",
    keywords: "tokyo, japon" 
  },
  { 
    id: "Trampoline Park Tourville-La-Rivière", 
    label: "Trampoline Park Tourville-La-Rivière", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Trampoline+Park.jpg",
    keywords: "trampoline, park, tourville-la-rivière" 
  },
  { 
    id: "Accrobranche", 
    label: "Accrobranche", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Accrobranche.webp",
    keywords: "accrobranche, parc, nature" 
  },
  { 
    id: "Assemblée Nationale", 
    label: "Assemblée Nationale", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/assemblee-nationale-2.jpg",
    keywords: "assemblee, nationale, paris" 
  },
  { 
    id: "Atrium", 
    label: "Atrium", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Atrium.jpg",
    keywords: "atrium, paris" 
  },
  { 
    id: "Basilique Montligeon", 
    label: "Basilique Montligeon", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/basilique-montligeon-800.webp",
    keywords: "basilique, montligeon" 
  },
  { 
    id: "Bowling Grand-Quevilly", 
    label: "Bowling Grand-Quevilly", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Bowling+GQ.webp",
    keywords: "bowling, grand-quevilly" 
  },
  { 
    id: "Cathédrale Bayeux", 
    label: "Cathédrale Bayeux", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/cath%C3%A9drale+bayeux.webp",
    keywords: "cathédrale, bayeux" 
  },
  { 
    id: "Parc animalier Cerza", 
    label: "Parc animalier Cerza", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/CERZA.png",
    keywords: "parc, animalier, cerza" 
  },
  { 
    id: "Chapelle Corneille Rouen", 
    label: "Chapelle Corneille Rouen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Chappelle+Corneille+Rouen.jpg",
    keywords: "chapelle, corneille, rouen" 
  },
  { 
    id: "Chateaux de la Loire", 
    label: "Chateaux de la Loire", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Chateaux+de+la+Loire.webp",
    keywords: "chateaux, loire" 
  },
  { 
    id: "Cimetière Américain Colleville", 
    label: "Cimetière Américain Colleville", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Cimetiere+Americain+Colleville.jpg",
    keywords: "cimetière, américain, colleville" 
  },
  { 
    id: "Cité Viking", 
    label: "Cité Viking", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Cit%C3%A9+viking.jpg",
    keywords: "cité, viking, rouen" 
  },
  { 
    id: "Cologne Noël", 
    label: "Cologne Noël", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Cologne+Noel.webp",
    keywords: "cologne, noel, allemagne" 
  },
  { 
    id: "Conservatoire de Rouen", 
    label: "Conservatoire de Rouen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Conservatoire_de_Rouen.jpg",
    keywords: "conservatoire, rouen" 
  },
  { 
    id: "Dock's 76", 
    label: "Dock's 76", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Docks+76.jpg",
    keywords: "docks, 76, rouen, dock's" 
  },
  { 
    id: "Falaise d'Etretat", 
    label: "Falaise d'Etretat", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Etretat.webp",
    keywords: "falaise, etretat" 
  },
  { 
    id: "EVA Rouen VR", 
    label: "EVA Rouen VR", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/EVA+Rouen.jpg",
    keywords: "eva, rouen, vr, réalité, virtuelle" 
  },
  { 
    id: "Foire-Saint-Romain", 
    label: "Foire-Saint-Romain", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Foire+saint+romain.jpg",
    keywords: "foire, saint-romain, rouen, manèges, attractions, saint, romain" 
  },
  { 
    id: "Forêt de brocéliande", 
    label: "Forêt de brocéliande", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Foret+de+broceliande.jpg",
    keywords: "forêt, brocéliande, bretagne" 
  },
  { 
    id: "Fujiya Sushi Le Mesnil-Esnard", 
    label: "Fujiya Sushi Le Mesnil-Esnard", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Fujiya+Sushi+LME.jpg",
    keywords: "fujiya, sushi, le mesnil-esnard, japon" 
  },
  { 
    id: "Futuroscope", 
    label: "Futuroscope", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Futuroscope.jpg",
    keywords: "futuroscope, parc, manèges, attractions" 
  },
  { 
    id: "Historial Jeanne d'Arc Rouen", 
    label: "Historial Jeanne d'Arc Rouen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Historial+Jeanne+d'Arc.jpg",
    keywords: "historial, jeanne d'arc, rouen" 
  },
  { 
    id: "Honfleur", 
    label: "Honfleur", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/honfleur.jpgg",
    keywords: "honfleur, port" 
  },
  { 
    id: "Hôtel de Ville Rouen", 
    label: "Hôtel de Ville Rouen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Hotel-de-ville-de-rouen.jpg",
    keywords: "hôtel de ville, rouen, mairie" 
  },
  { 
    id: "Laser Game", 
    label: "Laser Game", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Laser+Game.jpg",
    keywords: "laser game, rouen, jeu de tir" 
  },
  { 
    id: "Lillebonne Juliobona", 
    label: "Lillebonne Juliobona", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Lillebonne+Juliobona.jpg",
    keywords: "lillebonne, juliobona, romain" 
  },
  { 
    id: "Madagascar", 
    label: "Madagascar", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Madagascar.jpg",
    keywords: "madagascar, parc, animaux, st2s, social, afrique" 
  },
  { 
    id: "Marché de Noël Rouen", 
    label: "Marché de Noël Rouen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/March%C3%A9+noel+rouen.webp",
    keywords: "marché, noel, rouen" 
  },
  { 
    id: "Mémorial de Caen", 
    label: "Mémorial de Caen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Memorial+de+Caen.jpg",
    keywords: "mémorial, caen, normandie, 2eme guerre mondiale" 
  },
  { 
    id: "Mémorial de Caen", 
    label: "Mémorial de Caen", 
    url: "https://docslaproimage.s3.eu-west-3.amazonaws.com/travels/Memorial+de+Caen.jpg",
    keywords: "mémorial, caen, normandie, 2eme guerre mondiale" 
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