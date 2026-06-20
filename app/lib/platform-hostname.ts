import { normalizeHostname } from "@/app/lib/tenant-registry";

const DEFAULT_PLATFORM_HOSTS = ["scola.fr", "www.scola.fr"];

function parseHostnameList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((h) => normalizeHostname(h))
    .filter(Boolean);
}

function hostnamesFromAppUrlEnv(): string[] {
  const out: string[] = [];
  for (const raw of [
    process.env.PLATFORM_APP_URL,
    process.env.NEXT_PUBLIC_PLATFORM_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const withScheme = value.startsWith("http") ? value : `https://${value}`;
      out.push(normalizeHostname(new URL(withScheme).hostname));
    } catch {
      /* ignore */
    }
  }
  return out;
}

/** Hostnames de la vitrine plateforme (scola.fr), distincts des tenants établissements. */
export function platformHostnames(): string[] {
  const fromEnv = parseHostnameList(process.env.PLATFORM_HOSTNAMES);
  const devHosts = parseHostnameList(process.env.PLATFORM_DEV_HOSTNAMES);
  const fromAppUrl = hostnamesFromAppUrlEnv();
  const base = fromEnv.length > 0 ? fromEnv : DEFAULT_PLATFORM_HOSTS;
  return [...new Set([...base, ...devHosts, ...fromAppUrl])];
}

export function isPlatformHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return false;
  return platformHostnames().includes(host);
}
