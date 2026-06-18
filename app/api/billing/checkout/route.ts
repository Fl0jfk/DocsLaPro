import { NextResponse } from "next/server";
import { STRIPE_BILLING } from "@/app/lib/pricing";

/**
 * Checkout Stripe — squelette prêt à brancher.
 * Actuellement désactivé tant que STRIPE_SECRET_KEY n'est pas configuré.
 *
 * TODO (après création société + compte Stripe) :
 * 1. import Stripe from "stripe"
 * 2. Créer une Checkout Session (mode: subscription)
 * 3. line_items avec price + quantity = studentCount
 * 4. success_url / cancel_url vers /tarifs
 */
export async function GET(req: Request) {
  if (!STRIPE_BILLING.isConfigured || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json(
      {
        error: "Paiement en ligne pas encore disponible",
        message: "Contactez-nous par e-mail pour souscrire en attendant l'activation Stripe.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "monthly";

  return NextResponse.json(
    {
      error: "Checkout non implémenté",
      mode,
      hint: "Brancher Stripe Checkout dans app/api/billing/checkout/route.ts",
    },
    { status: 501 },
  );
}
