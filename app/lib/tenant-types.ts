/** Un tenant = un client (groupe scolaire ou école seule) avec son sous-domaine. */

export const TENANT_SLUG_HEADER = "x-tenant-slug";

export type TenantKind = "groupe" | "standalone";

/** Entrée dans tenants/index.json — pas de secrets lourds (option B). */
export type TenantIndexEntry = {
  slug: string;
  kind: TenantKind;
  label: string;
  hostnames: string[];
  dataBucket: string;
  appUrl: string;
  clerkPublishableKey: string;
  /** Rétrocompat : si présent dans l'index, pas de fichier secrets requis. */
  clerkSecretKey?: string;
};

/** tenants/secrets/{slug}.json — sensible, un fichier par client. */
export type TenantSecrets = {
  clerkSecretKey: string;
  mistral?: { apiKey: string };
  smtp?: { user: string; pass: string; host?: string };
  microsoft?: { tenantId: string; clientId: string; clientSecret?: string };
  /** Données S3 : roleArn (recommandé) ou clés dédiées ; sinon repli IAM plateforme Amplify. */
  aws?: {
    roleArn?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    imageBucket?: string;
  };
};

/** Config complète après fusion index + secrets. */
export type TenantConfig = TenantIndexEntry & {
  clerkSecretKey: string;
  secrets?: Omit<TenantSecrets, "clerkSecretKey">;
};

export type TenantRegistryFile = {
  version?: number;
  tenants: TenantIndexEntry[];
};

export type TenantSecretsMap = Record<string, TenantSecrets>;
