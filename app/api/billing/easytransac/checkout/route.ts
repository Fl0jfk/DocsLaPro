import { NextResponse } from "next/server";
import {
  easytransacReturnUrl,
  EASYTRANSAC_BILLING,
  initEasytransacOpenBankingPayment,
} from "@/app/lib/billing/easytransac";
import {
  computePricingWithA3Extras,
  normalizeExtraA3Count,
  type BillingMode,
} from "@/app/lib/pricing";
import {
  loadSignupRequestByToken,
  saveSignupRequest,
} from "@/app/lib/platform-signup-request";

export async function POST(req: Request) {
  if (!EASYTRANSAC_BILLING.isConfigured) {
    return NextResponse.json(
      {
        error: "Paiement en ligne indisponible",
        message: "Easytransac n'est pas encore configuré. Contactez le support.",
      },
      { status: 503 },
    );
  }

  let body: { token?: string; mode?: BillingMode; extraA3Count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const token = String(body.token || "").trim();
  const mode: BillingMode = body.mode === "annual_upfront" ? "annual_upfront" : "monthly";
  const extraA3Count = normalizeExtraA3Count(Number(body.extraA3Count ?? 0));
  if (!token) return NextResponse.json({ error: "token requis." }, { status: 400 });

  const request = await loadSignupRequestByToken(token);
  if (!request) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  if (request.status !== "microsoft_approved" && request.status !== "pending_payment") {
    return NextResponse.json(
      { error: "Ce dossier n'est pas encore éligible au paiement." },
      { status: 400 },
    );
  }

  const pricing = computePricingWithA3Extras(
    request.establishment.estimatedStudentCount,
    mode,
    extraA3Count,
  );
  const amountEur =
    mode === "monthly" ? pricing.totalMonthlyWithExtras : pricing.totalAnnualWithExtras;
  const amountCents = Math.max(100, Math.round(amountEur * 100));
  const orderId = `scola-${request.id}-${mode}`;

  try {
    const payment = await initEasytransacOpenBankingPayment({
      amountCents,
      email: request.adminContact.email,
      firstName: request.adminContact.firstName,
      lastName: request.adminContact.lastName,
      orderId,
      description: `Abonnement Scola ${mode === "monthly" ? "mensuel" : "annuel"} — ${request.establishment.legalName}${extraA3Count > 0 ? ` (+${extraA3Count} A3)` : ""}`,
      returnUrl: easytransacReturnUrl(request.id, token),
      address: request.establishment.postalAddress.street,
      zipCode: request.establishment.postalAddress.zip,
      city: request.establishment.postalAddress.city,
    });

    await saveSignupRequest(
      {
        ...request,
        status: "pending_payment",
        billingMode: mode,
        extraA3Count,
        easytransac: {
          ...request.easytransac,
          paymentPageRequestId: payment.tid,
          lastPaymentStatus: payment.status,
        },
      },
      { action: "payment_initiated", detail: payment.tid },
    );

    return NextResponse.json({
      ok: true,
      redirectUrl: payment.redirectUrl,
      amountEur,
      mode,
      extraA3Count,
    });
  } catch (e) {
    console.error("[easytransac/checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Impossible d'initialiser le paiement." },
      { status: 502 },
    );
  }
}
