import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadAppConfig, getEstablishmentByLabel } from "@/app/lib/app-config";
import { resolveDirectionSignatureImageUrl } from "@/app/lib/stage-config";

export type HseEtablissement = "École" | "Collège" | "Lycée";

export type HseAcceptanceRecord = {
  id: string;
  createdAt: string;
  decidedAt?: string;
  createdBy: { name: string; email: string };
  etablissement: HseEtablissement;
  resumeDemande: string;
  motif?: string;
  nombreHeures?: number;
  classe: string;
  details: string;
  directionNote?: string;
  decidedBy?: { name: string };
};

function sanitizePdfText(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = sanitizePdfText(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function formatNombreHeures(h: number): string {
  const text = Number.isInteger(h) ? String(h) : h.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
  return `${text} h`;
}

function hseEtabToLevelHint(etab: HseEtablissement): string {
  if (etab === "École") return "école";
  if (etab === "Collège") return "collège";
  return "lycée";
}

type PdfCtx = {
  doc: PDFDocument;
  page: ReturnType<PDFDocument["addPage"]>;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  margin: number;
  y: number;
};

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y - needed < 120) {
    ctx.page = ctx.doc.addPage([595.28, 841.89]);
    ctx.y = 800;
  }
}

function drawLine(ctx: PdfCtx, text: string, size = 10, f?: PdfCtx["font"], indent = 0) {
  ensureSpace(ctx, size + 8);
  ctx.page.drawText(sanitizePdfText(text), {
    x: ctx.margin + indent,
    y: ctx.y,
    size,
    font: f || ctx.font,
    color: rgb(0.08, 0.08, 0.08),
  });
  ctx.y -= size + 5;
}

function drawParagraph(ctx: PdfCtx, text: string, size = 10, indent = 0) {
  for (const line of wrapText(text, 92)) {
    drawLine(ctx, line, size, ctx.font, indent);
  }
}

function drawField(ctx: PdfCtx, label: string, value: string) {
  drawLine(ctx, `${label} :`, 9, ctx.bold, 4);
  drawParagraph(ctx, value || "—", 9, 10);
  ctx.y -= 2;
}

async function loadSignatureBytes(url: string): Promise<{ bytes: Uint8Array; isJpg: boolean } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.length) return null;
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
    return { bytes, isJpg };
  } catch {
    return null;
  }
}

export async function buildHseAcceptancePdf(record: HseAcceptanceRecord): Promise<Uint8Array> {
  const bundle = await loadAppConfig();
  const schoolName = bundle.identity.name || "Établissement scolaire";
  const schoolAddress = bundle.identity.address?.full || bundle.identity.address?.fullCompact || "";
  const est = getEstablishmentByLabel(bundle, record.etablissement);
  const directorName = est?.directorName?.trim() || record.decidedBy?.name || "La direction";
  const decidedAt = record.decidedAt ? new Date(record.decidedAt) : new Date();
  const createdAt = new Date(record.createdAt);

  const sigUrl = await resolveDirectionSignatureImageUrl(hseEtabToLevelHint(record.etablissement));
  const sigLoaded = sigUrl ? await loadSignatureBytes(sigUrl) : null;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ctx: PdfCtx = {
    doc,
    page: doc.addPage([595.28, 841.89]),
    font,
    bold,
    margin: 48,
    y: 800,
  };

  drawLine(ctx, "REPUBLIQUE FRANCAISE", 8, font);
  drawLine(ctx, "Ministere de l'Education nationale", 8, font);
  drawLine(ctx, schoolName, 13, bold);
  if (schoolAddress) drawLine(ctx, schoolAddress, 8, font);
  ctx.y -= 8;

  drawLine(ctx, "ATTESTATION D'ACCEPTATION", 14, bold);
  drawLine(ctx, "Heures supplementaires exceptionnelles (HSE)", 11, bold);
  drawLine(ctx, `Reference : ${record.id}`, 9, font);
  drawLine(ctx, `Demande deposee le ${createdAt.toLocaleDateString("fr-FR")}`, 9, font);
  drawLine(ctx, `Decision du ${decidedAt.toLocaleDateString("fr-FR")}`, 9, font);
  ctx.y -= 10;

  drawLine(
    ctx,
    "La direction de l'etablissement atteste avoir examine la demande ci-dessous et l'ACCEPTE.",
    10,
    bold,
  );
  ctx.y -= 6;

  drawField(ctx, "Demandeur", `${record.createdBy.name} (${record.createdBy.email})`);
  drawField(ctx, "Etablissement", record.etablissement);
  if (record.nombreHeures != null) {
    drawField(ctx, "Nombre d'heures accordees", formatNombreHeures(record.nombreHeures));
  }
  drawField(ctx, "Objet de la demande", record.resumeDemande);
  if (record.motif && record.motif !== record.resumeDemande) {
    drawField(ctx, "Motif", record.motif);
  }
  drawField(ctx, "Classe / contexte pedagogique", record.classe);
  if (record.details?.trim()) {
    drawField(ctx, "Precisions", record.details);
  }
  if (record.directionNote?.trim()) {
    drawField(ctx, "Message de la direction", record.directionNote);
  }

  ctx.y -= 12;
  ensureSpace(ctx, 130);
  drawLine(ctx, "Pour la direction,", 10, font);
  ctx.y -= 4;

  const sigW = 150;
  const sigH = 58;
  if (sigLoaded) {
    const sigImage = sigLoaded.isJpg
      ? await doc.embedJpg(sigLoaded.bytes)
      : await doc.embedPng(sigLoaded.bytes);
    ensureSpace(ctx, sigH + 40);
    ctx.page.drawImage(sigImage, {
      x: ctx.margin,
      y: ctx.y - sigH,
      width: sigW,
      height: sigH,
    });
    ctx.y -= sigH + 8;
  } else {
    ensureSpace(ctx, 40);
    ctx.page.drawRectangle({
      x: ctx.margin,
      y: ctx.y - 28,
      width: sigW,
      height: 28,
      borderColor: rgb(0.75, 0.75, 0.75),
      borderWidth: 0.5,
    });
    ctx.y -= 36;
  }

  drawLine(ctx, directorName, 10, bold);
  drawLine(ctx, `Directrice / Directeur — ${record.etablissement}`, 9, font);
  if (record.decidedBy?.name && record.decidedBy.name !== directorName) {
    drawLine(ctx, `Decision enregistree par ${record.decidedBy.name}`, 8, font);
  }

  const footer = sanitizePdfText(
    `Document genere par l'intranet — ${new Date().toLocaleString("fr-FR")} — HSE ${record.id}`,
  );
  const pages = doc.getPages();
  for (const p of pages) {
    p.drawText(footer, {
      x: ctx.margin,
      y: 28,
      size: 7,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
  }

  return doc.save();
}

export function hseAcceptancePdfFilename(record: HseAcceptanceRecord): string {
  const slug = record.createdBy.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  const date = (record.decidedAt || record.createdAt).slice(0, 10);
  return `attestation_hse_${slug || "demande"}_${date}_${record.id.slice(-8)}.pdf`;
}
