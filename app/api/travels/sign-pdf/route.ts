import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_DIRECTION_SIGNATURE_URLS } from "@/app/lib/stage-config";
import {
  findAllDevisSignatureZones,
  textractSignatureBBoxToPdfLibDrawCoords,
} from "@/app/lib/travel-devis-ocr";
import { fetchTravelsPdfBytes } from "@/app/lib/travels-s3";

const SIG_W = 150;
const SIG_H = 75;

export async function POST(req: Request) {
  try {
    const { quoteUrl, signatureType } = await req.json();
    const selectedSigUrl = DEFAULT_DIRECTION_SIGNATURE_URLS[String(signatureType || "").trim()];
    if (!selectedSigUrl) {
      return NextResponse.json(
        { error: "Type de signature invalide ou non configuré" },
        { status: 400 },
      );
    }

    const pdfBuffer = await fetchTravelsPdfBytes(quoteUrl);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const sigImageRes = await fetch(selectedSigUrl);
    if (!sigImageRes.ok) {
      throw new Error(`Impossible de récupérer la signature pour : ${signatureType}`);
    }
    const sigImageBytes = await sigImageRes.arrayBuffer();
    const isJpg =
      selectedSigUrl.toLowerCase().endsWith(".jpg") ||
      selectedSigUrl.toLowerCase().endsWith(".jpeg");
    const sigImage = isJpg
      ? await pdfDoc.embedJpg(sigImageBytes)
      : await pdfDoc.embedPng(sigImageBytes);

    const pages = pdfDoc.getPages();

    // Détection multi-zones (plusieurs devis / plusieurs pages dans le même PDF)
    const zones = await findAllDevisSignatureZones(pdfBuffer);

    let stampedCount = 0;

    if (zones.length > 0) {
      for (const bbox of zones) {
        const pageIndex = Math.min(Math.max(1, bbox.pageNumber), pages.length) - 1;
        const page = pages[pageIndex]!;
        const { width: pw, height: ph } = page.getSize();
        const { x, y } = textractSignatureBBoxToPdfLibDrawCoords(
          pw,
          ph,
          bbox,
          SIG_W,
          SIG_H,
        );
        page.drawImage(sigImage, { x, y, width: SIG_W, height: SIG_H });
        stampedCount += 1;
      }
      console.log(
        `[sign-pdf] ${stampedCount} signature(s) apposée(s) sur ${zones.length} zone(s) détectée(s)`,
      );
    } else {
      // Fallback : bas droite de la dernière page (comportement historique)
      const lastPage = pages[pages.length - 1]!;
      const { width } = lastPage.getSize();
      lastPage.drawImage(sigImage, {
        x: width - 210,
        y: 60,
        width: SIG_W,
        height: SIG_H,
      });
      stampedCount = 1;
      console.warn("[sign-pdf] Aucune zone Vision — fallback bas-droite dernière page");
    }

    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });
    return NextResponse.json({
      success: true,
      signedPdfData: pdfBase64,
      fileName: `devis_signe_${signatureType}.pdf`,
      stampedCount,
      zonesDetected: zones.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur technique signature";
    console.error("Erreur signature API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
