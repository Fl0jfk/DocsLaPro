import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { jsPDF } from 'jspdf';
import { 
  TextractClient, 
  StartDocumentTextDetectionCommand, 
  GetDocumentTextDetectionCommand 
} from "@aws-sdk/client-textract";

const textractClient = new TextractClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  }
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  try {
    const { tripData } = await req.json();
    console.log("--- DÉBUT GÉNÉRATION CIRCULAIRE ---");
    console.log("DEBUG TRIP DATA RECEIVED:", tripData);
    const d = tripData.data;
    const professorName = tripData.ownerName || "l'enseignant";
    const costPerStudent = d.costPerStudent || (d.coutTotal && d.nbEleves ? (d.coutTotal / d.nbEleves).toFixed(2) : 'À préciser');
    let ocrCombinedText = "";
    const documents = tripData.data?.attachments; 
    if (documents && Array.isArray(documents)) {
      console.log(`NB DOCUMENTS À ANALYSER : ${documents.length}`);
      
      for (const doc of documents) {
        try {
          let docKey = doc.key;
          if (!docKey && doc.url) {
            const urlParts = doc.url.split(`${process.env.BUCKET_NAME}.s3.eu-west-3.amazonaws.com/`);
            docKey = urlParts.length > 1 ? urlParts[1].split('?')[0] : doc.url.split('/').pop();
          }
          if (!docKey) continue;
          console.log(`[OCR] Lancement du job pour : ${doc.name || docKey}`);
          const startCommand = new StartDocumentTextDetectionCommand({
            DocumentLocation: {
              S3Object: {
                Bucket: process.env.BUCKET_NAME,
                Name: docKey,
              },
            },
          });
          const startResponse = await textractClient.send(startCommand);
          const jobId = startResponse.JobId;
          console.log(`[OCR] JobId reçu : ${jobId}. Attente du traitement...`);
          let finished = false;
          let attempts = 0;
          const maxAttempts = 240;

          while (!finished && attempts < maxAttempts) {
            const getCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
            const getResponse = await textractClient.send(getCommand);
            const status = getResponse.JobStatus;

            if (status === "SUCCEEDED") {
              console.log(`[OCR] Succès pour ${doc.name} ! Extraction du texte...`);
              const extractedText = getResponse.Blocks?.filter(b => b.BlockType === "LINE")
                .map(b => b.Text)
                .join(" ");
              
              ocrCombinedText += `\n--- Contenu du document [${doc.name || docKey}] ---\n${extractedText}\n`;
              finished = true;
            } else if (status === "FAILED") {
              console.error(`[OCR] Le job a échoué pour ${doc.name}`);
              finished = true;
            } else {
              attempts+=2;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (attempts >= maxAttempts) {
            console.warn(`[OCR] Timeout pour le document ${doc.name}`);
          }

        } catch (ocrErr) {
          console.error(`Erreur OCR sur le document ${doc.name}:`, ocrErr);
        }
      }
    }
    
    console.log("OCR TEXT FINAL RÉCUPÉRÉ :", ocrCombinedText ? "OUI (longueur: " + ocrCombinedText.length + ")" : "NON (vide)");

    console.log("[MISTRAL] Envoi du contexte pour rédaction...");
    const superContext = `
      DONNÉES DU FORMULAIRE :
      - Titre : ${d.title}
      - Destination : ${d.destination}
      - Organisateur : ${professorName}
      - Dates : du ${d.startDate || d.date} au ${d.endDate || d.date}
      - Coût par élève : ${costPerStudent} €
      - Transport coché : ${d.needsBus ? 'Autocar' : 'Non coché (voir documents)'}

      CONTENU DES PIÈCES JOINTES (ANALYSE OCR) :
      ${ocrCombinedText || "Aucun document joint n'a pu être analysé."}
    `;

    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
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
            content: `Tu es un assistant de communication scolaire. Ton but est de rédiger une circulaire qui donne envie aux parents et les rassure.
            SOURCES : On te donne un formulaire et des extraits OCR de documents.
            CONSIGNES :
            1. NE GARDE QUE ce qui est utile aux parents : Horaires, lieu de rendez-vous, équipement à prévoir (sac de couchage, pique-nique), activités phares.
            2. IGNORE TOUT LE RESTE : Détails d'assurance, clauses juridiques, contrats internes, montants financiers HT/TTC globaux, ou documents sans rapport (pranks). Les parents s'en foutent des détails de l'assurance voyage.
            3. TON : Enthousiaste, clair et professionnel.
            4. FORMAT : Pas de Markdown (pas de # ni de *), pas de texte entre crochets. Juste du texte brut aéré.` 
          },
          { 
            role: "user", 
            content: `Rédige la circulaire pour les parents à partir de ce dossier : ${superContext}`
          }
        ],
        temperature: 0.5
      })
    });
    const resData = await mistralResponse.json();
    let generatedText = resData.choices?.[0]?.message?.content || "Détails du voyage à venir...";
    generatedText = generatedText.replace(/[*#]/g, '').trim();
    console.log("[MISTRAL] Texte généré avec succès.");
    const docPdf = new jsPDF();
    const pageWidth = docPdf.internal.pageSize.getWidth();
    const pageHeight = docPdf.internal.pageSize.getHeight();
    
    let currentY = 15;
    if (tripData.imageUrl) {
      try {
        const response = await fetch(tripData.imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imgData = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        
        const imgProps = docPdf.getImageProperties(imgData);
        const maxW = pageWidth - 40; 
        const maxH = 50; 
        const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);
        const newWidth = imgProps.width * ratio;
        const newHeight = imgProps.height * ratio;
        
        docPdf.addImage(imgData, 'JPEG', (pageWidth - newWidth) / 2, currentY, newWidth, newHeight);
        currentY += newHeight + 10;
      } catch (e) {
        console.error("Erreur image PDF:", e);
        currentY = 20;
      }
    } else {
        currentY = 20;
    }

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(11);
    docPdf.setTextColor(40, 40, 40);
    const splitText = docPdf.splitTextToSize(generatedText, pageWidth - 40);
    docPdf.text(splitText, 20, currentY);

    // --- 4. COUPON RÉPONSE ---
    const couponStartY = pageHeight - 75; 
    docPdf.setDrawColor(200);
    docPdf.setLineDashPattern([2, 2], 0);
    docPdf.line(10, couponStartY, pageWidth - 10, couponStartY); 
    
    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(0, 0, 0);
    docPdf.text("COUPON RÉPONSE - À retourner impérativement", 20, couponStartY + 10);
    
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(9);
    docPdf.text(`Je soussigné(e), ................................................., responsable légal de l'élève : .................................`, 20, couponStartY + 20);
    docPdf.text(`autorise mon enfant à participer au voyage "${d.title}" organisé par ${professorName},`, 20, couponStartY + 28);
    docPdf.text(`et m'engage à régler la somme de ${costPerStudent} € correspondant aux frais de participation.`, 20, couponStartY + 36);
    docPdf.text(`Fait à : ....................................  le : ..../..../20...   Signature :`, 20, couponStartY + 46);

    const pdfBase64 = docPdf.output('datauristring');
    console.log("--- FIN GÉNÉRATION CIRCULAIRE (SUCCÈS) ---");
    return NextResponse.json({ pdf: pdfBase64 });

  } catch (error) {
    console.error("Erreur générale dans la route :", error);
    return NextResponse.json({ error: "Échec génération" }, { status: 500 });
  }
}