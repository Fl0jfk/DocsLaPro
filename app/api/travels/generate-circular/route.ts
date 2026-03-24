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
      - Classes concernées : ${d.classes || "—"}
      - Objectifs pédagogiques : ${d.objectifs || "—"}
      - Destination : ${d.destination}
      - Organisateur : ${professorName}
      - Dates : du ${d.startDate || d.date} au ${d.endDate || d.date}
      - Effectif : ${d.nbEleves || "—"} élèves / ${d.nbAccompagnateurs || "—"} accompagnateurs
      - Coût par élève : ${costPerStudent} €
      - Transport : ${d.needsBus ? "Autocar" : "Non coché (voir documents)"}
      - Lieu de RDV : ${d.transportRequest?.pickupPoint || "—"}
      - Bus sur place pour les visites : ${d.transportRequest?.stayOnSite ? "Oui" : "Non"}
      - Infos complémentaires transport : ${d.transportRequest?.freeText || "—"}
      - Pique-nique : ${(d.piqueNiqueDetails?.active || d.piqueNique) ? "Oui" : "Non"}
      - Pique-nique (détails) : ${
        d.piqueNiqueDetails?.active
          ? `Livraison à ${d.piqueNiqueDetails.deliveryPlace} (${d.piqueNiqueDetails.deliveryTime || "heure à préciser"})`
          : "—"
      }

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

    const marginX = 20;
    const contentWidth = pageWidth - marginX * 2;
    const headerBarHeight = 18;
    const footerReserve = 95; // reserve area for coupon (avoid overlap)

    const renderTopBar = () => {
      docPdf.setFillColor(24, 170, 226);
      docPdf.rect(0, 0, pageWidth, headerBarHeight, "F");
      docPdf.setTextColor(255, 255, 255);
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(13);
      docPdf.text("CIRCULAIRE PARENTS", marginX, 13);
      docPdf.setTextColor(40, 40, 40);
      docPdf.setFont("helvetica", "normal");
    };

    const transportLine = d.needsBus
      ? `Transport : Autocar (RDV : ${d.transportRequest?.pickupPoint || "À préciser"})`
      : `Transport : Non coché (voir documents)`;

    const startDate = d.startDate || d.date || "";
    const endDate = d.endDate || d.date || "";
    const dateLine = d.endDate
      ? `Dates : du ${startDate} au ${endDate}`
      : `Date : ${startDate}`;

    renderTopBar();
    let currentY = headerBarHeight + 6;

    // Optional header image
    if (tripData.imageUrl) {
      try {
        const response = await fetch(tripData.imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imgData = `data:image/jpeg;base64,${buffer.toString("base64")}`;

        const imgProps = docPdf.getImageProperties(imgData);
        const maxW = contentWidth;
        const maxH = 48;
        const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);
        const newWidth = imgProps.width * ratio;
        const newHeight = imgProps.height * ratio;

        const imgX = marginX + (contentWidth - newWidth) / 2;
        docPdf.setDrawColor(226, 232, 240);
        docPdf.rect(imgX - 6, currentY - 4, newWidth + 12, newHeight + 8);
        docPdf.addImage(imgData, "JPEG", imgX, currentY, newWidth, newHeight);
        currentY += newHeight + 10;
      } catch (e) {
        console.error("Erreur image PDF:", e);
        currentY += 8;
      }
    }

    // Key facts box (parents-friendly)
    const boxY = currentY;
    const boxH = 52;
    docPdf.setFillColor(248, 250, 252);
    docPdf.setDrawColor(226, 232, 240);
    docPdf.rect(marginX - 3, boxY - 2, contentWidth + 6, boxH, "FD");

    docPdf.setTextColor(24, 170, 226);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(12);
    docPdf.text(String(d.title || "Voyage"), marginX, boxY + 8);

    docPdf.setTextColor(40, 40, 40);
    docPdf.setFontSize(9);
    docPdf.setFont("helvetica", "normal");

    docPdf.text(`Organisateur : ${professorName}`, marginX, boxY + 16);
    docPdf.text(`Destination : ${d.destination || "—"}`, marginX, boxY + 23);
    docPdf.text(dateLine, marginX, boxY + 30);
    if (d.needsBus) {
      docPdf.text(transportLine, marginX, boxY + 37);
      docPdf.text(`Coût par élève : ${costPerStudent} €`, marginX, boxY + 44);
    } else {
      docPdf.text(`Coût par élève : ${costPerStudent} €`, marginX, boxY + 37);
    }

    currentY = boxY + boxH + 10;

    // --- Body text (Mistral output), paginated to avoid footer overlap ---
    docPdf.setTextColor(55, 65, 81);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(11);
    docPdf.text("Programme et informations pour votre enfant", marginX, currentY);
    currentY += 7;
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);

    const paragraphs = generatedText
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);

    const mainEndY = pageHeight - footerReserve;
    const lineHeight = 5;

    const renderParagraph = (p: string) => {
      const lines = docPdf.splitTextToSize(p, contentWidth);
      for (const line of lines) {
        if (currentY + lineHeight > mainEndY) {
          docPdf.addPage();
          renderTopBar();
          currentY = headerBarHeight + 12;
        }
        docPdf.text(String(line), marginX, currentY);
        currentY += lineHeight;
      }
    };

    for (const p of paragraphs) {
      renderParagraph(p);
      // Small spacing between paragraphs
      if (currentY + lineHeight < mainEndY) currentY += 2;
    }

    // --- COUPON RÉPONSE (on the last page where we ended) ---
    const couponStartY = pageHeight - 78;
    docPdf.setDrawColor(245, 158, 11);
    docPdf.setTextColor(0, 0, 0);
    docPdf.setFillColor(255, 251, 235);
    docPdf.rect(marginX - 3, couponStartY - 2, contentWidth + 6, 74, "FD");

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.text("COUPON RÉPONSE - À retourner impérativement", marginX, couponStartY + 10);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(9);
    docPdf.setTextColor(40, 40, 40);

    const couponLines: string[] = [
      `Je soussigné(e), ................................................., responsable légal de l'élève : ........................................`,
      `autorise mon enfant à participer au voyage "${d.title}" organisé par ${professorName},`,
      `et m'engage à régler la somme de ${costPerStudent} € correspondant aux frais de participation.`,
      `Fait à : ....................................  le : ..../..../20...   Signature : ....................................`,
    ];

    let couponY = couponStartY + 20;
    for (const line of couponLines) {
      const wrapped = docPdf.splitTextToSize(line, contentWidth);
      for (const wl of wrapped) {
        docPdf.text(String(wl), marginX, couponY);
        couponY += 6;
      }
    }

    const pdfBase64 = docPdf.output('datauristring');
    console.log("--- FIN GÉNÉRATION CIRCULAIRE (SUCCÈS) ---");
    return NextResponse.json({ pdf: pdfBase64 });

  } catch (error) {
    console.error("Erreur générale dans la route :", error);
    return NextResponse.json({ error: "Échec génération" }, { status: 500 });
  }
}