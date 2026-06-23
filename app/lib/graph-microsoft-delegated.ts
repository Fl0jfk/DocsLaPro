import { getTenant } from "@/app/lib/tenant-context";
import { getTenantSecrets } from "@/app/lib/tenant-registry";

const GRAPH_SCOPES = "https://graph.microsoft.com/Files.ReadWrite offline_access User.Read";

/** Échange un refresh token Microsoft contre un access token Graph (dépôt OneDrive serveur). */
export async function getMicrosoftAccessTokenFromRefresh(
  refreshToken: string,
): Promise<{ accessToken: string } | { error: string }> {
  const token = refreshToken.trim();
  if (!token) return { error: "Refresh token vide." };

  const tenant = await getTenant();
  const secrets = await getTenantSecrets(tenant.slug);
  const ms = secrets?.microsoft;
  if (!ms?.tenantId || !ms?.clientId) {
    return { error: "Microsoft non configuré pour ce tenant." };
  }

  const params = new URLSearchParams({
    client_id: ms.clientId,
    refresh_token: token,
    grant_type: "refresh_token",
    scope: GRAPH_SCOPES,
  });
  if (ms.clientSecret) {
    params.set("client_secret", ms.clientSecret);
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${ms.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return { error: `Refresh token Microsoft : ${err.slice(0, 200)}` };
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) return { error: "Réponse token sans access_token." };
  return { accessToken: data.access_token };
}
