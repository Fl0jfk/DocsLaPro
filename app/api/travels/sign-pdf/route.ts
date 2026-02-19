import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const { quoteUrl, signatureType } = await req.json();
    const sigMapping: Record<string, string> = {
      ecole: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/Sans+titre.jpg",
      college: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
      lycee: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signature_AMD.png"
    };
    const selectedSigUrl = sigMapping[signatureType as keyof typeof sigMapping];
    if (!selectedSigUrl) {
      return NextResponse.json({ error: "Type de signature invalide ou non configuré" }, { status: 400 });
    }
    const response = await fetch(quoteUrl);
    if (!response.ok) throw new Error("Impossible de récupérer le PDF du devis.");
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const sigImageRes = await fetch(selectedSigUrl);
    if (!sigImageRes.ok) throw new Error(`Impossible de récupérer la signature sur AWS pour : ${signatureType}`);
    const sigImageBytes = await sigImageRes.arrayBuffer();
    const isJpg = selectedSigUrl.toLowerCase().endsWith('.jpg') || selectedSigUrl.toLowerCase().endsWith('.jpeg');
    let sigImage;
    if (isJpg) {
      sigImage = await pdfDoc.embedJpg(sigImageBytes);
    } else {
      sigImage = await pdfDoc.embedPng(sigImageBytes);
    }
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width } = lastPage.getSize();
    lastPage.drawImage(sigImage, {
      x: width - 210, 
      y: 60,
      width: 150,
      height: 75,
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