import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import fs from "fs/promises";
import path from "path";
import {
  createTenantTransporter,
  getTenantSmtpConfig,
} from "@/app/lib/tenant-mail";
import { getToolboxConfig } from "@/app/lib/toolbox-config";
import type { FournituresChild } from "@/app/lib/fournitures-types";
import { formatChildLabel, formatSuppliesPdfFilename } from "@/app/lib/fournitures-engine";

function isValidEmail(value: string) {
  const v = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const toolbox = await getToolboxConfig();
    if (!toolbox.tools["simulateur-fournitures"].enabled) {
      return NextResponse.json({ error: "Simulateur fournitures désactivé." }, { status: 404 });
    }

    const body = await req.json();
    const email = String(body?.email || "").trim();
    const children = (body?.children || []) as FournituresChild[];

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!Array.isArray(children) || children.length === 0) {
      return NextResponse.json({ error: "Ajoutez au moins un enfant." }, { status: 400 });
    }

    const smtp = await getTenantSmtpConfig();
    if (!smtp) {
      return NextResponse.json({ error: "SMTP non configuré." }, { status: 503 });
    }
    const transporter = await createTenantTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "SMTP non configuré." }, { status: 503 });
    }

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
      if (logoDataUri) { doc.addImage(logoDataUri, "PNG", ML, 3.5, 13, 13)}
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
    const styleListItem = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
    };
    const newContentPage = () => {
      doc.addPage();
      drawHeader();
      y = 32;
    };
    drawHeader();
    let y = 32;

    for (let ci = 0; ci < children.length; ci++) {
      const child = children[ci]!;

      if (y > H - 30) {
        newContentPage();
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(formatChildLabel(child), ML, y);
      y += 6;

      const supplies = (body?.suppliesByChild?.[child.id] as Array<{ title: string; items: string[] }>) || null;
      const sections = Array.isArray(supplies) ? supplies : [{ title: "Fournitures", items: ["(liste non transmise)"] }];
      for (const sec of sections) {
        if (y > H - 24) {
          newContentPage();
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(37, 99, 235);
        doc.text(sec.title, ML, y);
        y += 5;

        styleListItem();
        for (const item of sec.items || []) {
          const text = String(item || "").trim();
          if (!text) continue;
          if (y > H - 14) {
            newContentPage();
            styleListItem();
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
    const pdfFilename = formatSuppliesPdfFilename(children);

    await transporter.sendMail({
      from: `"Simulateur Fournitures" <${smtp.user}>`,
      to: email,
      subject: "Votre liste de fournitures (PDF)",
      html: `<div style="font-family:Arial,sans-serif;color:#334155;line-height:1.5">
        <p>Bonjour,</p>
        <p>Vous trouverez en pièce jointe la liste des fournitures sélectionnées sur le simulateur.</p>
        <p>Cordialement,</p>
      </div>`,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true, filename: pdfFilename });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("supplies/send error:", message);
    return NextResponse.json({ error: "Échec de l'envoi.", details: message }, { status: 500 });
  }
}
