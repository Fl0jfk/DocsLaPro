import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { canViewAward } from "@/app/lib/certificates-auth";
import { loadAward, loadProgram, saveAward } from "@/app/lib/certificates-storage";
import { issueAwardPdf } from "@/app/lib/certificates-workflow";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { tenantCanonicalOrigin, tenantOrigin } from "@/app/lib/tenant-auth-urls";
import { getTenant } from "@/app/lib/tenant-context";
import { isPlatformHostname } from "@/app/lib/platform-hostname";
import { normalizeHostname } from "@/app/lib/tenant-registry";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  const { id } = await params;
  const award = await loadAward(id);
  if (!award) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
  const program = await loadProgram(award.programId);
  if (!program) return NextResponse.json({ error: "Parcours introuvable." }, { status: 404 });
  if (!canViewAward(award, program, gate.ctx.userId, user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const tenant = await getTenant();
  const reqUrl = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || reqUrl.host;
  const canonicalOrigin = tenantCanonicalOrigin(tenant);
  const canonicalHost = normalizeHostname(new URL(canonicalOrigin).host);
  const requestHost = normalizeHostname(host);
  const requestIsTenantHost = tenant.hostnames.some((h) => normalizeHostname(h) === requestHost);
  const canonicalLooksPlatform = isPlatformHostname(canonicalHost);
  const origin =
    canonicalLooksPlatform && requestIsTenantHost
      ? tenantOrigin(tenant, host)
      : canonicalOrigin;
  const result = await issueAwardPdf(award, origin);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  await saveAward(result);
  return NextResponse.json({ award: result });
}
