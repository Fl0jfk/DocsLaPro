import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs/promises';
import path from 'path';

const CUISINE_DAYS = [
  { key: "lundi",    label: "Lundi"    },
  { key: "mardi",    label: "Mardi"    },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi",    label: "Jeudi"    },
  { key: "vendredi", label: "Vendredi" },
];

const CUISINE_ROWS = [
  { key: "picnicTotal",  label: "Pique-nique (total)"    },
  { key: "picnicNoPork", label: "  dont Sans porc"        },
  { key: "picnicVeg",    label: "  dont Végétarien"       },
  { key: "selfAdults",   label: "Repas au self (adultes)" },
  { key: "selfStudents", label: "Repas au self (élèves)"  },
  { key: "coffee",       label: "Café / thé / chocolat"  },
  { key: "juice",        label: "Jus de fruits"           },
  { key: "cakes",        label: "Petits gâteaux"          },
  { key: "pastries",     label: "Viennoiserie"            },
  { key: "other",        label: "Autre"                   },
];

const moisFR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const moisIndexByName: Record<string, number> = {
  janvier:0,janv:0,february:1,fév:1,février:1,fevrier:1,fev:1,mars:2,march:2,avril:3,april:3,mai:4,
  june:5,juin:5,july:6,juillet:6,août:7,aout:7,august:7,septembre:8,sep:8,sept:8,october:9,oct:9,
  octobre:9,novembre:10,nov:10,november:10,décembre:11,decembre:11,dec:11,december:11,
};

function formatDateFR(input?: string | null): string {
  if (!input) return "—";
  const raw = String(input).trim();
  const isoFull = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoFull) {
    const [, y, mm, dd] = isoFull;
    return `${Number(dd)} ${moisFR[Number(mm) - 1]} ${y}`;
  }
  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
  if (isoMonth) {
    const [, y, mm] = isoMonth;
    return `1 ${moisFR[Number(mm) - 1]} ${y}`;
  }
  const monthYear = raw.match(/^([A-Za-zÀ-ÿœŒ]+)\s+(\d{4})$/);
  if (monthYear) {
    const [, m, y] = monthYear;
    const key = m.toLowerCase().replace(/\./g, "");
    const idx = moisIndexByName[key];
    return `1 ${typeof idx === "number" ? moisFR[idx] : key} ${y}`;
  }
  return raw;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });

  try {
    const { tripData, userEmail, userName } = await req.json();
    const details = tripData.data.piqueNiqueDetails;
    if (!details || !details.active) {
      return NextResponse.json({ error: "Aucune commande cuisine à envoyer" }, { status: 400 });
    }

    // ── Logo (PNG from filesystem) ───────────────────────────────────────────
    let logoDataUri: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "logo-nicolas-barre-ecole-college-lycee-laprovidence-1.png");
      const logoBuffer = await fs.readFile(logoPath);
      logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (e) {
      console.error("Logo load error:", e);
    }

    // ── Build PDF ────────────────────────────────────────────────────────────
    const doc = new jsPDF({ compress: true });
    const W  = doc.internal.pageSize.getWidth();
    const ML = 15;
    const MR = W - 15;

    const dateStr     = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const startDateFR = formatDateFR(tripData.data.startDate ?? tripData.data.date);
    const endDateFR   = formatDateFR(tripData.data.endDate);
    const dateRange   = endDateFR && endDateFR !== "—" && endDateFR !== startDateFR
      ? `du ${startDateFR} au ${endDateFR}`
      : `le ${startDateFR}`;

    // ── LETTERHEAD ───────────────────────────────────────────────────────────
    if (logoDataUri) doc.addImage(logoDataUri, "PNG", ML, 6, 24, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text("La Providence Nicolas Barré", MR, 13, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Groupe scolaire catholique sous contrat", MR, 19, { align: "right" });
    doc.text("6, rue de Neuvillette — 76240 Le Mesnil-Esnard", MR, 24.5, { align: "right" });
    doc.text("02 32 86 50 90", MR, 30, { align: "right" });

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 35, W, 1.8, "F");
    doc.setFillColor(16, 185, 129);  // emerald
    doc.rect(0, 36.8, W, 0.6, "F");

    // ── TITLE BLOCK ──────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text("BON DE COMMANDE CUISINE", W / 2, 48, { align: "center" });

    doc.setFillColor(240, 253, 244);
    doc.roundedRect(ML, 52, W - 30, 7, 2, 2, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text("À déposer 15 jours avant la date au chef en cuisine ou envoyer par mail : chef.0056isi@newrest.eu", W / 2, 57, { align: "center" });

    // ── INFO GRID ────────────────────────────────────────────────────────────
    let y = 67;
    const infoRows: [string, string][] = [
      ["Classe(s)",         tripData.data.classes      || "—"],
      ["Date(s) de sortie", dateRange],
      ["Organisateur",      userName                   || "—"],
      ["Lieu récupération", `${details.deliveryPlace || "—"} à ${details.deliveryTime || "—"}`],
      ["Nb élèves",         String(tripData.data.nbEleves          || "—")],
      ["Nb adultes",        String(tripData.data.nbAccompagnateurs || "—")],
    ];

    doc.setFontSize(8);
    const colW = (W - 30) / 2;
    infoRows.forEach(([label, value], i) => {
      const col = i % 2 === 0 ? ML : ML + colW + 5;
      if (i % 2 === 0 && i > 0) y += 9;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(label + " :", col, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(value, col + 32, y);
    });
    y += 13;

    // ── SEPARATOR ────────────────────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.line(ML, y, MR, y);
    y += 6;

    // ── TABLE — quantities per day ────────────────────────────────────────────
    const selectedDays = CUISINE_DAYS.filter(d =>
      (details.daysSelection as Record<string, boolean>)[d.key]
    );

    const head = [["Désignation", ...selectedDays.map(d => d.label)]];
    const orders = (details.orders || {}) as Record<string, Record<string, string>>;

    const body = CUISINE_ROWS.map(({ key: rowKey, label }) => {
      const cells = selectedDays.map(d => {
        const val = orders[d.key]?.[rowKey];
        return val && val !== "" ? String(val) : "—";
      });
      return [label, ...cells];
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold", fontSize: 8, halign: "center" },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: "normal" },
        ...Object.fromEntries(selectedDays.map((_, i) => [i + 1, { halign: "center", cellWidth: (W - 30 - 60) / (selectedDays.length || 1) }])),
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { cellPadding: 3 },
    });

    // ── FOOTER NOTE ───────────────────────────────────────────────────────────
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Fournir la liste des élèves et adultes au moment de la commande (15 jours avant). Affiner la liste 24h avant.",
      ML, finalY
    );
    doc.text("Toute absence non signalée 24h avant sera facturée.", ML, finalY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180, 190, 200);
    doc.text(`Document généré le ${dateStr}`, W / 2, 292, { align: "center" });

    const pdfBase64 = doc.output("datauristring").split(",")[1];

    // ── SEND EMAIL ────────────────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const selectedDayNames = selectedDays.map(d => d.label).join(", ");

    await transporter.sendMail({
      from: `"Gestion Sorties La Providence" <${process.env.EMAIL_USER}>`,
      to: "florian.hacqueville-mathi@ac-normandie.fr",
      cc: userEmail,
      subject: `Bon de commande cuisine — ${userName} — ${tripData.data.title}`,
      text: [
        `Bonjour,`,
        ``,
        `Veuillez trouver ci-joint le bon de commande de restauration pour le projet "${tripData.data.title}" (${dateRange}).`,
        ``,
        `Organisateur : ${userName}`,
        `Jour(s) de sortie : ${selectedDayNames || "—"}`,
        `Lieu de récupération : ${details.deliveryPlace || "—"} à ${details.deliveryTime || "—"}`,
        ``,
        `Merci de bien vouloir préparer les quantités indiquées dans le tableau ci-joint.`,
        `La liste définitive des élèves et adultes vous sera fournie 15 jours avant la sortie et affinée 24h avant.`,
        ``,
        `Cordialement,`,
        userName,
      ].join("\n"),
      attachments: [
        {
          filename: `Commande_Cuisine_${tripData.id || "sortie"}.pdf`,
          content: pdfBase64,
          encoding: "base64",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi mail cuisine:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi du mail" }, { status: 500 });
  }
}
