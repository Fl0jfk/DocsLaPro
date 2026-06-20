import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadAppConfig } from "@/app/lib/app-config";
import { formatDaySlotLabel } from "@/app/lib/stage-schedule";
import {
  STAGE_CONVENTION_STATUS_LABELS,
  STAGE_OFFER_KIND_LABELS,
  STAGE_SIGNER_ROLE_LABELS,
  type StageConvention,
} from "@/app/lib/stage-types";

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

type PdfCtx = {
  doc: PDFDocument;
  page: ReturnType<PDFDocument["addPage"]>;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  margin: number;
  y: number;
};

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y - needed < 70) {
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

function drawSectionTitle(ctx: PdfCtx, num: string, title: string) {
  ensureSpace(ctx, 28);
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: ctx.y - 4,
    width: 495,
    height: 18,
    color: rgb(0.93, 0.95, 0.93),
    borderColor: rgb(0.2, 0.42, 0.29),
    borderWidth: 0.5,
  });
  drawLine(ctx, `${num} — ${title}`, 11, ctx.bold);
  ctx.y -= 4;
}

function drawField(ctx: PdfCtx, label: string, value: string) {
  drawLine(ctx, `${label} : ${value || "—"}`, 9, ctx.font, 6);
}

function drawFieldBlock(ctx: PdfCtx, fields: Array<{ label: string; value: string }>) {
  for (const f of fields) drawField(ctx, f.label, f.value);
  ctx.y -= 4;
}

export async function buildStageConventionPdf(convention: StageConvention): Promise<Uint8Array> {
  const bundle = await loadAppConfig();
  const schoolName = bundle.identity.name || "Établissement scolaire";
  const schoolAddress = bundle.identity.address?.full || bundle.identity.address?.fullCompact || "";

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ctx: PdfCtx = {
    doc,
    page: doc.addPage([595.28, 841.89]),
    font,
    bold,
    margin: 45,
    y: 800,
  };

  drawLine(ctx, "REPUBLIQUE FRANCAISE", 8, font);
  drawLine(ctx, "Ministere de l'Education nationale", 8, font);
  drawLine(ctx, schoolName, 13, bold);
  if (schoolAddress) drawLine(ctx, schoolAddress, 8, font);
  ctx.y -= 6;
  drawLine(ctx, "CONVENTION DE STAGE EN MILIEU PROFESSIONNEL", 14, bold);
  drawLine(ctx, "(Modele type CERFA — PFMP / stage d'observation)", 9, font);
  drawLine(ctx, `Annee scolaire ${convention.schoolYear} — Ref. ${convention.id}`, 9, font);
  drawLine(ctx, `Statut : ${STAGE_CONVENTION_STATUS_LABELS[convention.status]}`, 9, font);
  ctx.y -= 8;

  const kindLabel =
    convention.internshipKind in STAGE_OFFER_KIND_LABELS
      ? STAGE_OFFER_KIND_LABELS[convention.internshipKind as keyof typeof STAGE_OFFER_KIND_LABELS]
      : convention.internshipKind;

  drawSectionTitle(ctx, "I", "L'ELEVE");
  drawFieldBlock(ctx, [
    { label: "Nom et prenom", value: `${convention.student.lastName} ${convention.student.firstName}` },
    { label: "Classe / niveau", value: `${convention.student.className} — ${convention.student.level}` },
    { label: "E-mail", value: convention.student.email || "" },
    { label: "Type de stage", value: kindLabel },
  ]);

  drawSectionTitle(ctx, "II", "L'ETABLISSEMENT D'ENSEIGNEMENT");
  drawFieldBlock(ctx, [
    { label: "Etablissement", value: schoolName },
    { label: "Professeur referent", value: `${convention.teacherReferent.name} (${convention.teacherReferent.email})` },
  ]);

  drawSectionTitle(ctx, "III", "L'ENTREPRISE D'ACCUEIL");
  drawFieldBlock(ctx, [
    { label: "Raison sociale", value: convention.company.name },
    { label: "Adresse", value: convention.company.address },
    { label: "SIRET", value: convention.company.siret || "" },
    { label: "Activite", value: convention.company.activity },
    { label: "Tuteur", value: `${convention.company.tutorName} — ${convention.company.tutorEmail}` },
    { label: "RH (si applicable)", value: convention.company.rhEmail || "" },
  ]);

  drawSectionTitle(ctx, "IV", "ORGANISATION DU STAGE");
  drawFieldBlock(ctx, [
    { label: "Periode", value: `Du ${convention.schedule.periodStart} au ${convention.schedule.periodEnd}` },
    {
      label: "Mode horaire",
      value: convention.schedule.mode === "uniform_week" ? "Identique lun–ven" : "Horaires par jour",
    },
  ]);
  for (const d of convention.schedule.days) {
    for (const line of wrapText(formatDaySlotLabel(d), 90)) {
      drawLine(ctx, line, 9, font, 10);
    }
  }
  ctx.y -= 6;

  drawSectionTitle(ctx, "V", "SIGNATURES DES PARTIES");
  drawLine(ctx, "Chaque partie atteste avoir pris connaissance des dispositions legales relatives au stage.", 8, font, 4);
  ctx.y -= 4;

  for (const sig of convention.signatures) {
    const status =
      sig.status === "signe"
        ? `Signe le ${sig.signedAt ? new Date(sig.signedAt).toLocaleDateString("fr-FR") : "—"} — ${sig.signedBy || "—"}`
        : "En attente de signature";
    drawLine(ctx, `${STAGE_SIGNER_ROLE_LABELS[sig.role]} : ${status}`, 9, font, 6);
    ensureSpace(ctx, 36);
    ctx.page.drawRectangle({
      x: ctx.margin + 6,
      y: ctx.y - 28,
      width: 200,
      height: 24,
      borderColor: rgb(0.75, 0.75, 0.75),
      borderWidth: 0.5,
    });
    ctx.y -= 32;
  }

  if (convention.adminReview) {
    ctx.y -= 6;
    drawSectionTitle(ctx, "VI", "VALIDATION ADMINISTRATIVE");
    drawFieldBlock(ctx, [
      {
        label: "Valide par",
        value: `${convention.adminReview.byName} le ${new Date(convention.adminReview.at).toLocaleDateString("fr-FR")}`,
      },
      { label: "Note", value: convention.adminReview.note || "" },
    ]);
  }

  const footer = sanitizePdfText(
    `Document genere par Scola — ${new Date().toLocaleString("fr-FR")} — Convention ${convention.id}`,
  );
  ctx.page.drawText(footer, {
    x: ctx.margin,
    y: 28,
    size: 7,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
}

export function conventionPdfFilename(convention: StageConvention): string {
  const name = `${convention.student.lastName}_${convention.student.firstName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  return `convention_stage_${name}_${convention.id.slice(-8)}.pdf`;
}
