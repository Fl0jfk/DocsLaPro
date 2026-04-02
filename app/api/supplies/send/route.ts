import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import fs from "fs/promises";
import path from "path";

type Stage = "ecole" | "college" | "lycee";
type LangueSeconde = "Espagnol" | "Allemand";
type CollegeNiveau = "6e" | "5e" | "4e" | "3e";
type EcoleNiveau = "JE1" | "JE2" | "JE3" | "JE4" | "CP" | "CE1" | "CE2" | "CM1" | "CM2";
type LyceeNiveau = "2nde" | "1re" | "Terminale";
type LyceeTrack = "General" | "ST2S";
type LyceeSpecialite = "Maths" | "Physique-Chimie" | "SVT" | "SES" | "HG-GEO-GEOPOL";

type Child =
  | { id: string; stage: "ecole"; niveau: EcoleNiveau }
  | {
      id: string;
      stage: "college";
      niveau: CollegeNiveau;
      ebp: boolean;
      langue: LangueSeconde;
      optionBilingueAllemand: boolean;
      optionLatin: boolean;
    }
  | {
      id: string;
      stage: "lycee";
      niveau: LyceeNiveau;
      track: LyceeTrack;
      langue: LangueSeconde;
      anglaisEuro?: boolean;
      specialites: LyceeSpecialite[];
      latin: boolean;
    };

function isValidEmail(value: string) {
  const v = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function formatChildLabel(child: Child) {
  if (child.stage === "ecole") {
    const ecoleLabels: Record<EcoleNiveau, string> = {
      JE1: "J.E.1 (Mme BAYEL Christine)",
      JE2: "J.E.2 (Mme CARTIER Céline)",
      JE3: "J.E.3 (Mme DOUGHTY Sylvie)",
      JE4: "J.E.4",
      CP: "CP",
      CE1: "CE1",
      CE2: "CE2",
      CM1: "CM1",
      CM2: "CM2",
    };
    return `École — ${ecoleLabels[child.niveau] ?? child.niveau}`;
  }
  if (child.stage === "college") {
    if (child.niveau === "6e") return `Collège — 6e (bilingue allemand: ${child.optionBilingueAllemand ? "oui" : "non"})`;
    return `Collège — ${child.niveau} (${child.langue}${child.ebp ? " • E.B.P" : ""}${child.optionLatin ? " • Latin" : ""})`;
  }
  return `Lycée — ${child.niveau} (${child.track === "ST2S" ? "ST2S" : "Général"} • ${child.langue})`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim();
    const children = (body?.children || []) as Child[];

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!Array.isArray(children) || children.length === 0) {
      return NextResponse.json({ error: "Ajoutez au moins un enfant." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let logoDataUri: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png");
      const logoBuffer = await fs.readFile(logoPath);
      logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch {}

    const doc = new jsPDF({ compress: true });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const ML = 14;
    const MR = W - 14;

    const drawHeader = () => {
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, W, 20, "F");
      if (logoDataUri) {
        doc.addImage(logoDataUri, "PNG", ML, 3.5, 13, 13);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Liste de fournitures scolaires", ML + 18, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text(new Date().toLocaleDateString("fr-FR"), MR, 12, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(ML, 24, MR, 24);
    };

    const checkbox = (x: number, y: number) => {
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.35);
      doc.rect(x, y - 2.6, 3.3, 3.3);
    };

    drawHeader();

    let y = 32;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Email destinataire : ${email}`, ML, y);
    y += 8;

    for (let ci = 0; ci < children.length; ci++) {
      const child = children[ci]!;

      if (y > H - 30) {
        doc.addPage();
        drawHeader();
        y = 32;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(formatChildLabel(child), ML, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);

      const supplies = (body?.suppliesByChild?.[child.id] as Array<{ title: string; items: string[] }>) || null;
      // On préfère recevoir les listes depuis le client (source unique de vérité),
      // mais on reste robuste si ce n'est pas fourni.
      const sections = Array.isArray(supplies) ? supplies : [{ title: "Fournitures", items: ["(liste non transmise)"] }];

      for (const sec of sections) {
        if (y > H - 24) {
          doc.addPage();
          drawHeader();
          y = 32;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(37, 99, 235);
        doc.text(sec.title, ML, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        for (const item of sec.items || []) {
          const text = String(item || "").trim();
          if (!text) continue;
          if (y > H - 14) {
            doc.addPage();
            drawHeader();
            y = 32;
          }
          checkbox(ML, y);
          const lines = doc.splitTextToSize(text, MR - (ML + 6));
          doc.text(lines, ML + 6, y);
          y += lines.length * 4.5 + 1.5;
        }
        y += 3;
      }

      if (ci < children.length - 1) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(ML, y, MR, y);
        y += 8;
      }
    }

    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    await transporter.sendMail({
      from: `"Simulateur Fournitures" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Votre liste de fournitures (PDF)",
      html: `<div style="font-family:Arial,sans-serif;color:#334155;line-height:1.5">
        <p>Bonjour,</p>
        <p>Vous trouverez en pièce jointe la liste des fournitures sélectionnées sur le simulateur.</p>
        <p>Cordialement,</p>
        <p><strong>${process.env.SMTP_USER}</strong></p>
      </div>`,
      attachments: [
        {
          filename: `liste_fournitures_${new Date().toISOString().slice(0, 10)}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("supplies/send error:", error?.message || error);
    return NextResponse.json({ error: "Échec de l'envoi.", details: error?.message || String(error) }, { status: 500 });
  }
}

