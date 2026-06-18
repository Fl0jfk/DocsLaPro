/**

 * Grille tarifaire Scola — logique partagée site + futur Stripe Billing.

 * Stripe : activer quand la société et le compte Stripe seront créés (voir STRIPE_BILLING).

 */



import { MARKETING } from "@/app/lib/marketing-site";



/** Tarif de référence : €/élève/mois */

export const PRICE_PER_STUDENT_MONTHLY_EUR = 0.3;



/** Réduction paiement annuel (à la rentrée) */

export const ANNUAL_UPFRONT_DISCOUNT = 0.1;



export type BillingMode = "monthly" | "annual_upfront";



export type PricingBreakdown = {

  studentCount: number;

  mode: BillingMode;

  pricePerStudentMonth: number;

  pricePerStudentYear: number;

  monthlyTotal: number;

  annualTotal: number;

  discountPercent: number;

};



export function clampStudentCount(value: number): number {

  if (!Number.isFinite(value) || value < 0) return 0;

  return Math.round(value);

}



export function computePricing(studentCount: number, mode: BillingMode): PricingBreakdown {

  const students = clampStudentCount(studentCount);

  const baseMonthly = PRICE_PER_STUDENT_MONTHLY_EUR;

  const annualFull = baseMonthly * 12 * students;



  if (mode === "monthly") {

    return {

      studentCount: students,

      mode,

      pricePerStudentMonth: baseMonthly,

      pricePerStudentYear: baseMonthly * 12,

      monthlyTotal: baseMonthly * students,

      annualTotal: annualFull,

      discountPercent: 0,

    };

  }



  const annualDiscounted = annualFull * (1 - ANNUAL_UPFRONT_DISCOUNT);

  return {

    studentCount: students,

    mode,

    pricePerStudentMonth: annualDiscounted / (12 * Math.max(students, 1)),

    pricePerStudentYear: annualDiscounted / Math.max(students, 1),

    monthlyTotal: annualDiscounted / 12,

    annualTotal: annualDiscounted,

    discountPercent: Math.round(ANNUAL_UPFRONT_DISCOUNT * 100),

  };

}



export function formatEur(amount: number, opts?: { decimals?: number }): string {

  const decimals = opts?.decimals ?? (amount < 10 ? 2 : 0);

  return new Intl.NumberFormat("fr-FR", {

    style: "currency",

    currency: "EUR",

    minimumFractionDigits: decimals,

    maximumFractionDigits: decimals,

  }).format(amount);

}



export const BILLING_OPTIONS = [

  {

    id: "monthly" as const,

    mode: "monthly" as BillingMode,

    name: "Mensuel",

    badge: "Sans engagement",

    highlighted: true,

    priceLine: `${formatEur(PRICE_PER_STUDENT_MONTHLY_EUR, { decimals: 2 })} / élève / mois`,

    summary: "Comme un abonnement classique : vous payez au mois, vous résiliez quand vous voulez.",

    perks: [

      "Résiliation à tout moment",

      "Facturation au mois selon l'effectif",

      "Idéal pour tester ou démarrer en cours d'année",

    ],

  },

  {

    id: "annual_upfront" as const,

    mode: "annual_upfront" as BillingMode,

    name: "Annuel",

    badge: "−10 %",

    highlighted: false,

    priceLine: `${formatEur(PRICE_PER_STUDENT_MONTHLY_EUR * 12 * (1 - ANNUAL_UPFRONT_DISCOUNT), { decimals: 2 })} / élève / an`,

    summary: "Un seul paiement à la rentrée — l'équivalent de 0,27 € par élève et par mois.",

    perks: [

      "10 % de réduction sur l'année",

      "Paiement unique (virement ou CB à l'activation)",

      "Budget annuel simplifié pour l'OGEC",

    ],

  },

] as const;



/**

 * Préparation Stripe — à brancher après création de la société.

 *

 * Variables d'environnement prévues :

 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

 * - STRIPE_SECRET_KEY (serveur uniquement)

 * - STRIPE_PRICE_ID_MONTHLY_PER_STUDENT (metered or per-unit quantity)

 * - STRIPE_PRICE_ID_ANNUAL_PER_STUDENT

 * - STRIPE_WEBHOOK_SECRET

 */

export const STRIPE_BILLING = {

  isConfigured: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()),

  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",

  priceIds: {

    monthlyPerStudent: process.env.STRIPE_PRICE_ID_MONTHLY_PER_STUDENT?.trim() ?? "",

    annualPerStudent: process.env.STRIPE_PRICE_ID_ANNUAL_PER_STUDENT?.trim() ?? "",

  },

} as const;



export function getSubscribeCta(mode: BillingMode): { label: string; href: string; stripeReady: boolean } {

  const stripeReady = STRIPE_BILLING.isConfigured;

  if (stripeReady) {

    return {

      label: "S'abonner en ligne",

      href: `/api/billing/checkout?mode=${mode}`,

      stripeReady: true,

    };

  }

  return {

    label: "Nous contacter pour souscrire",

    href: `mailto:${MARKETING.contactEmail}?subject=${encodeURIComponent(`Abonnement Scola — ${BILLING_OPTIONS.find((o) => o.mode === mode)?.name ?? mode}`)}`,

    stripeReady: false,

  };

}


