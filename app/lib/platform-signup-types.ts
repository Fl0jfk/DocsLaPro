import type { TenantKind } from "@/app/lib/tenant-types";

export type TenantSignupStatus =
  | "submitted"
  | "pending_microsoft"
  | "microsoft_approved"
  | "pending_payment"
  | "payment_completed"
  | "provisioning"
  | "active"
  | "rejected";

export const SIGNUP_STATUS_LABELS: Record<TenantSignupStatus, string> = {
  submitted: "Reçu",
  pending_microsoft: "En attente validation Microsoft",
  microsoft_approved: "Microsoft validé — en attente de paiement",
  pending_payment: "Paiement en cours",
  payment_completed: "Payé — en attente de provisioning",
  provisioning: "Mise en service en cours",
  active: "Actif",
  rejected: "Refusé",
};

export type TenantSignupPostalAddress = {
  street: string;
  zip: string;
  city: string;
};

export type TenantSignupEstablishment = {
  legalName: string;
  rne: string;
  kind: TenantKind;
  postalAddress: TenantSignupPostalAddress;
  estimatedStudentCount: number;
  wantsMicrosoftLicenses: boolean;
  microsoftCurrentManagement:
    | "internal_establishment"
    | "external_provider"
    | "none";
  microsoftTargetMode: "scola_takeover" | "scola_independent";
  microsoftDecisionContact?: {
    fullName: string;
    role?: string;
    email: string;
    phone?: string;
  };
};

export type TenantSignupAdminContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
};

export type CreateSignupRequestInput = {
  establishment: TenantSignupEstablishment;
  adminContact: TenantSignupAdminContact;
};

export type TenantSignupEasytransac = {
  subscriptionId?: string;
  customerId?: string;
  paymentPageRequestId?: string;
  lastPaymentStatus?: string;
  lastPaymentAt?: string;
};

export type TenantSignupAuditEntry = {
  at: string;
  action: string;
  by?: string;
  detail?: string;
};

export type TenantSignupRequest = {
  id: string;
  accessToken: string;
  status: TenantSignupStatus;
  createdAt: string;
  updatedAt: string;
  establishment: TenantSignupEstablishment;
  adminContact: TenantSignupAdminContact;
  masterNotes?: string;
  rejectedReason?: string;
  microsoftApprovedAt?: string;
  microsoftApprovedBy?: string;
  billingMode?: "monthly" | "annual_upfront";
  extraA3Count?: number;
  easytransac?: TenantSignupEasytransac;
  provisionedTenantSlug?: string;
  auditLog: TenantSignupAuditEntry[];
};

/** Slug DNS suggéré à partir du nom légal (client-safe). */
export function slugifyEstablishmentName(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
