import { NextResponse } from "next/server";
import {
  getEasytransacTransactionStatus,
  isEasytransacPaymentFailed,
  isEasytransacPaymentSuccess,
} from "@/app/lib/billing/easytransac";
import { emailPaymentCompleted } from "@/app/lib/platform-signup-email";
import { loadSignupRequest, saveSignupRequest } from "@/app/lib/platform-signup-request";
import {
  parseTenantBillingOrderId,
  recordTenantPaymentFailure,
  recordTenantPaymentSuccess,
} from "@/app/lib/tenant-billing";

async function verifyWebhookAuth(req: Request): Promise<boolean> {
  const secret = process.env.EASYTRANSAC_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const header = req.headers.get("x-easytransac-secret") || req.headers.get("authorization");
  return header === secret || header === `Bearer ${secret}`;
}

async function handleSignupPayment(
  signupId: string,
  tid?: string,
  orderId?: string,
): Promise<NextResponse> {
  const request = await loadSignupRequest(signupId);
  if (!request) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const status = await getEasytransacTransactionStatus({
    tid: tid || request.easytransac?.paymentPageRequestId,
    orderId,
  });

  if (isEasytransacPaymentSuccess(status.status)) {
    if (request.status === "payment_completed" || request.status === "active") {
      return NextResponse.json({ ok: true, already: true });
    }
    const updated = await saveSignupRequest(
      {
        ...request,
        status: "payment_completed",
        easytransac: {
          ...request.easytransac,
          paymentPageRequestId: status.tid,
          lastPaymentStatus: status.status,
          lastPaymentAt: new Date().toISOString(),
        },
      },
      { action: "payment_webhook", detail: status.tid },
    );
    void emailPaymentCompleted(updated);
    return NextResponse.json({ ok: true, signup: signupId });
  }

  if (isEasytransacPaymentFailed(status.status)) {
    await saveSignupRequest(
      {
        ...request,
        status: "pending_payment",
        easytransac: {
          ...request.easytransac,
          paymentPageRequestId: status.tid,
          lastPaymentStatus: status.status,
        },
      },
      { action: "payment_failed", detail: status.tid },
    );
    return NextResponse.json({ ok: true, failed: true, status: status.status });
  }

  return NextResponse.json({ ok: true, status: status.status });
}

async function handleTenantPayment(
  slug: string,
  tid?: string,
  orderId?: string,
): Promise<NextResponse> {
  const status = await getEasytransacTransactionStatus({ tid, orderId });

  if (isEasytransacPaymentSuccess(status.status)) {
    await recordTenantPaymentSuccess(slug, { tid: status.tid, status: status.status });
    return NextResponse.json({ ok: true, tenant: slug, paid: true });
  }

  if (isEasytransacPaymentFailed(status.status)) {
    await recordTenantPaymentFailure(slug, { tid: status.tid, status: status.status });
    return NextResponse.json({ ok: true, tenant: slug, failed: true });
  }

  return NextResponse.json({ ok: true, tenant: slug, status: status.status });
}

/** Webhook / notification serveur Easytransac (signup ou tenant récurrent). */
export async function POST(req: Request) {
  let body: { tid?: string; orderId?: string; signupId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  if (!(await verifyWebhookAuth(req))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const orderId = body.orderId?.trim() || "";
  const tid = body.tid?.trim();
  const parsed = orderId ? parseTenantBillingOrderId(orderId) : null;

  try {
    if (parsed?.kind === "tenant") {
      return await handleTenantPayment(parsed.slug, tid, orderId);
    }

    let signupId = body.signupId?.trim();
    if (!signupId && parsed?.kind === "signup") signupId = parsed.signupId;
    if (!signupId && orderId.startsWith("scola-")) {
      signupId = orderId.split("-")[1];
    }
    if (!signupId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    return await handleSignupPayment(signupId, tid, orderId);
  } catch (e) {
    console.error("[easytransac/webhook]", e);
    return NextResponse.json({ error: "Traitement impossible." }, { status: 500 });
  }
}
