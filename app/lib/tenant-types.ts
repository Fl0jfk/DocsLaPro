/** Un tenant = un client (groupe scolaire ou école seule) avec son sous-domaine. */

export const TENANT_SLUG_HEADER = "x-tenant-slug";

export type TenantKind = "groupe" | "standalone";

export type TenantConfig = {
  slug: string;
  kind: TenantKind;
  label: string;
  hostnames: string[];
  dataBucket: string;
  appUrl: string;
  clerkPublishableKey: string;
  clerkSecretKey: string;
};

export type TenantRegistryFile = {
  version?: number;
  tenants: TenantConfig[];
};
