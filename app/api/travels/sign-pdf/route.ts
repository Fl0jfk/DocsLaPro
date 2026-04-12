import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { findSignatureFieldBBoxFromTextract,textractSignatureBBoxToPdfLibDrawCoords} from "@/app/lib/travel-devis-ocr";

const FALLBACK_SIG_W = 150;
const FALLBACK_SIG_H = 75;

export async function POST(req: Request) {
  try {
    const { quoteUrl, signatureType } = await req.json();
    const sigMapping: Record<string, string> = {
      ecole: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/Sans+titre.jpg",
      college: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
      lycee: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signature_AMD.png"
    };
    const selectedSigUrl = sigMapping[signatureType as keyof typeof sigMapping];
    if (!selectedSigUrl) { return NextResponse.json({ error: "Type de signature invalide ou non configuré" }, { status: 400 })}
    const response = await fetch(quoteUrl);
    if (!response.ok) throw new Error("Impossible de récupérer le PDF du devis.");
    const pdfBytes = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const sigImageRes = await fetch(selectedSigUrl);
    if (!sigImageRes.ok) throw new Error(`Impossible de récupérer la signature sur AWS pour : ${signatureType}`);
    const sigImageBytes = await sigImageRes.arrayBuffer();
    const isJpg = selectedSigUrl.toLowerCase().endsWith('.jpg') || selectedSigUrl.toLowerCase().endsWith('.jpeg');
    let sigImage;
    if (isJpg) { sigImage = await pdfDoc.embedJpg(sigImageBytes)
    } else { sigImage = await pdfDoc.embedPng(sigImageBytes)}
    const pages = pdfDoc.getPages();
    const bbox = await findSignatureFieldBBoxFromTextract(pdfBuffer);
    let targetPage = pages[pages.length - 1];
    let drawX: number;
    let drawY: number;
    if (bbox && pages.length > 0) {
      const pageIndex = Math.min(Math.max(1, bbox.pageNumber), pages.length) - 1;
      targetPage = pages[pageIndex];
      const { width: pw, height: ph } = targetPage.getSize();
      const coords = textractSignatureBBoxToPdfLibDrawCoords(pw, ph, bbox, FALLBACK_SIG_W, FALLBACK_SIG_H);
      drawX = coords.x;
      drawY = coords.y;
    } else {
      const { width } = targetPage.getSize();
      drawX = width - 210;
      drawY = 60;
    }
    targetPage.drawImage(sigImage, {
      x: drawX,
      y: drawY,
      width: FALLBACK_SIG_W,
      height: FALLBACK_SIG_H,
    });
    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });
    return NextResponse.json({ 
      success: true, 
      signedPdfData: pdfBase64,
      fileName: `devis_signe_${signatureType}.pdf`
    });
  } catch (error: any) {
    console.error("Erreur signature API:", error.message);
    return NextResponse.json({ error: error.message || "Erreur technique signature" }, { status: 500 });
  }
}