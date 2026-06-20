import { NextResponse } from "next/server";
import { resolveSession } from "@/app/lib/intranet-session";

import { getTransportProviders } from "@/app/lib/transport-providers";
import { getJson, putJson } from "@/app/lib/s3-storage";
import { loadBusProgramAttachments } from "@/app/lib/travels-bus-program";
import { buildTransportQuotePdf } from "@/app/lib/travels-transport-quote-pdf";
import {
  createTenantTransporter,
  getTenantSmtpConfig,
} from "@/app/lib/tenant-mail";

export async function POST(req: Request) {
  const session = await resolveSession();
  const userId = session?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { tripData, userName } = body;
    const { data } = tripData;
    const transporteurs = await getTransportProviders();
    if (transporteurs.length === 0) {
      return NextResponse.json({ error: "Aucun transporteur configuré." }, { status: 400 });
    }

    const buildDemandePDF = async (transporteurName: string) =>
      buildTransportQuotePdf({
        tripId: String(tripData.id),
        data,
        userName,
        transporteurName,
        mode: "initial",
      });

    const pdfBuffer = await buildDemandePDF("(tous transporteurs)");
    const busProgramExtra = await loadBusProgramAttachments(data);
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [
      {
        filename: `Demande_Transport_${data.destination.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
      ...busProgramExtra,
    ];

    const smtp = await getTenantSmtpConfig();
    if (!smtp) {
      return NextResponse.json({ error: "SMTP non configuré" }, { status: 503 });
    }
    const transporter = await createTenantTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "SMTP non configuré" }, { status: 503 });
    }

    for (const transporteur of transporteurs) {
      try {
        const personalPdf = await buildDemandePDF(transporteur.name);
        const personalAttachments = [
          {
            filename: `Demande_Transport_${data.destination.replace(/\s+/g, "_")}.pdf`,
            content: personalPdf,
            contentType: "application/pdf",
          },
          ...attachments.slice(1),
        ];
        await transporter.sendMail({
          from: `"Plateforme Voyages" <${smtp.user}>`,
          to: transporteur.email,
          subject: `🚗 DEMANDE DE DEVIS - ${data.destination.toUpperCase()} - ${userName}`,
          html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #334155;">
            <h2>Bonjour ${transporteur.name},</h2>
            <p>Veuillez trouver ci-joint une demande de devis pour un transport scolaire à destination de <strong>${data.destination}</strong>.</p>
            <p>Le récapitulatif complet ainsi que le programme éventuel sont joints à cet email.</p>
            <div style="margin: 24px 0; padding: 16px; border-radius: 12px; background-color: #f0fdf4; border: 1px solid #86efac;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #166534;">Réponse par e-mail</p>
              <p style="margin: 0; font-size: 14px; color: #14532d;">Répondez à cet e-mail ou écrivez à la boîte dédiée aux devis de l'établissement en <strong>joignant votre devis en PDF</strong>. Indiquez dans l'<strong>objet</strong> la référence : <strong>Réf. ${tripData.id}</strong> — elle figure aussi sur le PDF joint.</p>
            </div>
            <p>Cordialement,<br/>L'administration.</p>
          </div>
        `,
          attachments: personalAttachments,
        });
      } catch (sendErr: unknown) {
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        console.error(`Erreur envoi à ${transporteur.name}:`, msg);
      }
    }

    const tripId = String(tripData.id || "");
    if (tripId) {
      try {
        const hit = await getJson<Record<string, unknown>>(`travels/${tripId}.json`);
        const existing = hit?.data;
        if (existing && typeof existing === "object") {
          const inner = (existing as { data?: Record<string, unknown> }).data || {};
          const now = new Date().toISOString();
          const updated = {
            ...existing,
            data: {
              ...inner,
              transportQuoteSnapshot: {
                nbEleves: Number(data.nbEleves) || 0,
                nbAccompagnateurs: Number(data.nbAccompagnateurs) || 0,
                sentAt: now,
                type: "initial",
              },
            },
          };
          await putJson(`travels/${tripId}.json`, updated);
        }
      } catch (snapErr) {
        console.error("[send-transport] snapshot", snapErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erreur API Gmail/Transport:", msg);
    return NextResponse.json({ error: "Échec de l'envoi", details: msg }, { status: 500 });
  }
}
