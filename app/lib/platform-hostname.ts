import { normalizeHostname } from "@/app/lib/tenant-registry";

const DEFAULT_PLATFORM_HOSTS = ["scola.fr", "www.scola.fr"];

function parseHostnameList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((h) => normalizeHostname(h))
    .filter(Boolean);
}

/** Hostnames de la vitrine plateforme (scola.fr), distincts des tenants établissements. */
export function platformHostnames(): string[] {
  const fromEnv = parseHostnameList(process.env.PLATFORM_HOSTNAMES);
  const devHosts = parseHostnameList(process.env.PLATFORM_DEV_HOSTNAMES);
  const base = fromEnv.length > 0 ? fromEnv : DEFAULT_PLATFORM_HOSTS;
  return [...new Set([...base, ...devHosts])];
}

export function isPlatformHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return false;
  return platformHostnames().includes(host);
}
