// app/api/absence/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readStore, removeEntry, AbsenceEntry } from "@/app/utils/jsonStore";
import { PDFDocument, rgb } from "pdf-lib";

const RECIPIENTS: Record<string, string[]> = {
  direction_ecole:   ["florian.hacqueville-mathi@ac-normandie.fr"],
  direction_college: ["florian.hacqueville-mathi@ac-normandie.fr"],
  direction_lycee:   ["florian.hacqueville-mathi@ac-normandie.fr"],
  rh:                ["valerie.vasseur@ac-normandie.fr"],
  default:           ["secretariat@ecole.com"],
  secretariat: [
    "florian.hacqueville-mathi@ac-normandie.fr",
    "pauline.leblond@ac-normandie.fr",
    "sarah.buno@ac-normandie.fr",
  ],
};

const SIGNATURES: Record<"directrice_ecole"|"directrice_college"|"directrice_lycee", string> = {
  directrice_ecole:   "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
  directrice_college: "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
  directrice_lycee:   "https://docslaproimage.s3.eu-west-3.amazonaws.com/signatures/signas.png",
};

// map par défaut selon la cible si `demande.directrice` n'est pas fourni
const DEFAULT_DIRECTRICE_BY_CIBLE: Record<AbsenceEntry["cible"], keyof typeof SIGNATURES> = {
  direction_ecole:   "directrice_ecole",
  direction_college: "directrice_college",
  direction_lycee:   "directrice_lycee",
};

async function fetchSignatureBytes(url: string): Promise<Uint8Array> {
  if (!url) return new Uint8Array();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (err) {
    console.error("Erreur récupération signature HTTP:", err);
    return new Uint8Array();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, statut } = await req.json() as { id: string; statut: "validee" | "refusee" };

    if (!id || !statut) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const absences = await readStore();
    const demande = absences.find(a => a.id === id);
    if (!demande) {
      return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    }

    // Prépare destinataires et message
    let destinataire: string | string[];
    let mailSujet: string;
    let mailTexte: string;

    if ((demande.type === "prof" || demande.type === "salarie") && statut === "validee") {
      destinataire = RECIPIENTS.rh;
      mailSujet = `Déclaration d'absence ${demande.type} validée`;
      mailTexte = `Absence validée de ${demande.nom} (${demande.email})
Du ${demande.date_debut} au ${demande.date_fin}
Motif: ${demande.motif}`;
    } else if (statut === "refusee") {
      destinataire = demande.email;
      mailSujet = "Votre demande a été refusée";
      mailTexte = "Malheureusement, votre demande d'absence a été refusée par la direction.";
    } else {
      // fallback
      destinataire = RECIPIENTS.default;
      mailSujet = "Déclaration d'absence traitée";
      mailTexte = `La demande d'absence de ${demande.nom} a été traitée.`;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Génération du PDF si validée
    let pdfBuffer: Buffer | undefined = undefined;
    if (statut === "validee") {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 portrait

      page.drawText("Déclaration d'absence validée", { x: 50, y: 800, size: 18, color: rgb(0, 0, 0) });
      page.drawText(`Établissement : ${demande.cible}`, { x: 50, y: 770 });
      page.drawText(`Nom : ${demande.nom}`, { x: 50, y: 740 });
      page.drawText(`Email : ${demande.email}`, { x: 50, y: 720 });
      page.drawText(`Type : ${demande.type}`, { x: 50, y: 700 });
      page.drawText(`Période : ${demande.date_debut} au ${demande.date_fin}`, { x: 50, y: 680 });
      page.drawText(`Motif : ${demande.motif}`, { x: 50, y: 660 });
      if (demande.commentaire) {
        page.drawText(`Commentaire : ${demande.commentaire}`, { x: 50, y: 640 });
      }
      page.drawText(`Absence validée par la direction le ${new Date().toLocaleDateString()}`, {
        x: 50, y: 600, size: 12, color: rgb(0, 0, 1),
      });

      // Signature : choisie via `demande.directrice` sinon via cible
      const directriceKey =
        demande.directrice ||
        DEFAULT_DIRECTRICE_BY_CIBLE[demande.cible] ||
        "directrice_ecole";
      const sigUrl = SIGNATURES[directriceKey];
      const sigBytes = await fetchSignatureBytes(sigUrl);

      if (sigBytes.length > 0) {
        // PNG vs JPG
        let sigImage;
        if (sigUrl.toLowerCase().endsWith(".png")) {
          sigImage = await pdfDoc.embedPng(sigBytes);
        } else {
          sigImage = await pdfDoc.embedJpg(sigBytes);
        }
        // Taille raisonnable
        const scale = 0.5;
        const sigDims = { width: sigImage.width * scale, height: sigImage.height * scale };

        // zone bas droite
        page.drawImage(sigImage, {
          x: 595 - 50 - sigDims.width,
          y: 80,
          width: sigDims.width,
          height: sigDims.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      pdfBuffer = Buffer.from(pdfBytes);
    }

    // Pièces jointes justificatifs (max 5 déjà côté création)
    const pjJustificatifs =
      (demande.justificatifs || []).slice(0, 5).map(f => ({
        filename: f.filename,
        content: Buffer.from(f.buffer, "base64"),
        contentType: f.type,
      }));

    const attachments = [
      ...(pdfBuffer
        ? [{ filename: "attestation-validation.pdf", content: pdfBuffer, contentType: "application/pdf" }]
        : []),
      ...pjJustificatifs,
    ];

    // 1) Email principal (RH ou demandeur si refus)
    await fetch(`${appUrl}/api/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: Array.isArray(destinataire) ? destinataire : [destinataire],
        subject: mailSujet,
        text: mailTexte,
        attachments,
      }),
    });

    // 2) Email au demandeur si validée (attestation)
    if (statut === "validee" && demande.email) {
      await fetch(`${appUrl}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: demande.email,
          subject: "Votre déclaration d'absence a bien été validée",
          text:
            "Votre demande d'absence a été traitée et validée par la direction.\n\n" +
            "Vous trouverez en pièce jointe l'attestation PDF.",
          attachments: pdfBuffer
            ? [{ filename: "attestation-validation.pdf", content: pdfBuffer, contentType: "application/pdf" }]
            : undefined,
        }),
      });
    }

    // 3) Email au secrétariat si PROF et validée (pour impression)
    if (demande.type === "prof" && statut === "validee") {
      await fetch(`${appUrl}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: RECIPIENTS.secretariat,
          subject: "Déclaration d'absence d'un professeur",
          text:
            `L'absence de ${demande.nom} (${demande.email}) a été validée par la direction.\n` +
            `Du ${demande.date_debut} au ${demande.date_fin}\nMotif: ${demande.motif}\n\n` +
            `Voir PJ pour impression (PDF attestation + justificatifs).`,
          attachments,
        }),
      });
    }

    // Nettoyage du store
    await removeEntry(id);

    return NextResponse.json({ success: true, message: "Traitement effectué et notification(s) transmise(s)." });
  } catch (err) {
    console.error("Erreur /api/absence/validate:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
