import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { TenantConfig, TenantRegistryFile } from "@/app/lib/tenant-types";

const REGISTRY_KEY = process.env.TENANT_REGISTRY_KEY?.trim() || "tenants/index.json";
const CACHE_MS = 60_000;

/** Registry S3 ou JSON inline — sinon mono-tenant via variables d'environnement. */
export function isMultiTenantEnabled(): boolean {
  return Boolean(
    process.env.REGISTRY_BUCKET?.trim() || process.env.TENANT_INDEX_JSON?.trim(),
  );
}

let registryCache: { at: number; tenants: TenantConfig[] } | null = null;

function getRegistryS3Client(): S3Client {
  return new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

export function normalizeHostname(host: string): string {
  const raw = (host || "").trim().toLowerCase();
  if (!raw) return "";
  const noPort = raw.replace(/:\d+$/, "");
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

function parseTenant(raw: unknown): TenantConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const slug = typeof o.slug === "string" ? o.slug.trim() : "";
  const dataBucket = typeof o.dataBucket === "string" ? o.dataBucket.trim() : "";
  const clerkPublishableKey =
    typeof o.clerkPublishableKey === "string" ? o.clerkPublishableKey.trim() : "";
  const clerkSecretKey =
    typeof o.clerkSecretKey === "string" ? o.clerkSecretKey.trim() : "";
  if (!slug || !dataBucket || !clerkPublishableKey || !clerkSecretKey) return null;

  const kind = o.kind === "standalone" ? "standalone" : "groupe";
  const label = typeof o.label === "string" && o.label.trim() ? o.label.trim() : slug;
  const appUrl =
    typeof o.appUrl === "string" && o.appUrl.trim()
      ? o.appUrl.trim().replace(/\/$/, "")
      : "";
  const hostnames = Array.isArray(o.hostnames)
    ? o.hostnames.map((h) => normalizeHostname(String(h))).filter(Boolean)
    : [];

  return {
    slug,
    kind,
    label,
    hostnames,
    dataBucket,
    appUrl,
    clerkPublishableKey,
    clerkSecretKey,
  };
}

export function defaultTenantFromEnv(): TenantConfig {
  const dataBucket = process.env.BUCKET_NAME?.trim();
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!dataBucket || !clerkPublishableKey || !clerkSecretKey) {
    throw new Error(
      "Configuration tenant manquante (BUCKET_NAME, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY).",
    );
  }

  const slug = process.env.DEFAULT_TENANT_SLUG?.trim() || "default";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  const extraHosts = (process.env.TENANT_DEV_HOSTNAMES || "localhost,127.0.0.1")
    .split(",")
    .map((h) => normalizeHostname(h))
    .filter(Boolean);

  let hostnames = [...extraHosts];
  if (appUrl) {
    try {
      const u = new URL(appUrl.startsWith("http") ? appUrl : `https://${appUrl}`);
      hostnames.push(normalizeHostname(u.hostname));
    } catch {
      /* ignore */
    }
  }
  hostnames = [...new Set(hostnames)];

  return {
    slug,
    kind: "groupe",
    label: process.env.DEFAULT_TENANT_LABEL?.trim() || "Instance par défaut",
    hostnames,
    dataBucket,
    appUrl,
    clerkPublishableKey,
    clerkSecretKey,
  };
}

function parseRegistryJson(raw: string): TenantConfig[] {
  const parsed = JSON.parse(raw) as TenantRegistryFile | TenantConfig[];
  const list = Array.isArray(parsed) ? parsed : parsed.tenants;
  if (!Array.isArray(list)) return [];
  return list.map(parseTenant).filter((t): t is TenantConfig => Boolean(t));
}

function loadInlineRegistry(): TenantConfig[] | null {
  const inline = process.env.TENANT_INDEX_JSON?.trim();
  if (!inline) return null;
  try {
    const tenants = parseRegistryJson(inline);
    return tenants.length > 0 ? tenants : null;
  } catch {
    return null;
  }
}

async function loadRegistryFromS3(): Promise<TenantConfig[] | null> {
  const bucket = process.env.REGISTRY_BUCKET?.trim();
  if (!bucket) return null;
  try {
    const res = await getRegistryS3Client().send(
      new GetObjectCommand({ Bucket: bucket, Key: REGISTRY_KEY }),
    );
    const raw = await res.Body?.transformToString();
    if (!raw) return null;
    const tenants = parseRegistryJson(raw);
    return tenants.length > 0 ? tenants : null;
  } catch (err) {
    console.error("[tenant-registry] lecture S3:", err);
    return null;
  }
}

export async function loadAllTenants(): Promise<TenantConfig[]> {
  if (registryCache && Date.now() - registryCache.at < CACHE_MS) {
    return registryCache.tenants;
  }

  const fromS3 = await loadRegistryFromS3();
  const fromInline = loadInlineRegistry();
  const tenants = fromS3 ?? fromInline ?? [defaultTenantFromEnv()];

  registryCache = { at: Date.now(), tenants };
  return tenants;
}

export function invalidateTenantRegistryCache() {
  registryCache = null;
}

export async function resolveTenantBySlug(slug: string): Promise<TenantConfig | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const tenants = await loadAllTenants();
  return tenants.find((t) => t.slug.toLowerCase() === normalized) ?? null;
}

export async function resolveTenantByHostname(hostname: string): Promise<TenantConfig> {
  const host = normalizeHostname(hostname);
  const tenants = await loadAllTenants();

  if (host) {
    const hit = tenants.find((t) => t.hostnames.some((h) => h === host));
    if (hit) return hit;
  }

  if (tenants.length === 1) return tenants[0];

  const fallback = process.env.DEFAULT_TENANT_SLUG?.trim();
  if (fallback) {
    const bySlug = tenants.find((t) => t.slug === fallback);
    if (bySlug) return bySlug;
  }

  if (!process.env.REGISTRY_BUCKET?.trim() && !process.env.TENANT_INDEX_JSON?.trim()) {
    return defaultTenantFromEnv();
  }

  throw new Error(`Aucun tenant pour le domaine « ${host || "?"} ».`);
}

/** Résolution synchrone pour le middleware (cache mémoire uniquement). */
export function resolveTenantByHostnameSync(hostname: string): TenantConfig | null {
  const host = normalizeHostname(hostname);
  const tenants = registryCache?.tenants;
  if (!tenants?.length) return null;
  if (host) {
    const hit = tenants.find((t) => t.hostnames.some((h) => h === host));
    if (hit) return hit;
  }
  if (tenants.length === 1) return tenants[0];
  const fallback = process.env.DEFAULT_TENANT_SLUG?.trim();
  if (fallback) {
    return tenants.find((t) => t.slug === fallback) ?? null;
  }
  return null;
}

export async function warmTenantRegistry(): Promise<void> {
  await loadAllTenants();
}
