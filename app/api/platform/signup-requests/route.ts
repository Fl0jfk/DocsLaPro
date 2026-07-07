import { NextResponse } from "next/server";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import {
  emailSignupReceivedMaster,
  emailSignupReceivedProspect,
} from "@/app/lib/platform-signup-email";
import {
  createSignupRequest,
  listSignupRequests,
  type CreateSignupRequestInput,
} from "@/app/lib/platform-signup-request";
import { isPlatformStorageWritable } from "@/app/lib/platform-storage";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hit = RATE_LIMIT.get(ip);
  if (!hit || hit.resetAt < now) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (hit.count >= RATE_MAX) return false;
  hit.count += 1;
  return true;
}

export async function GET() {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  try {
    const requests = await listSignupRequests();
    return NextResponse.json({ requests });
  } catch (e) {
    console.error("[signup-requests GET]", e);
    return NextResponse.json({ error: "Impossible de charger les dossiers." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isPlatformStorageWritable()) {
    return NextResponse.json(
      { error: "Inscriptions temporairement indisponibles." },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }

  let body: CreateSignupRequestInput & { honeypot?: string; consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  if (body.honeypot?.trim()) {
    return NextResponse.json({ ok: true, token: "ignored" });
  }
  if (!body.consent) {
    return NextResponse.json({ error: "Consentement RGPD requis." }, { status: 400 });
  }

  try {
    const request = await createSignupRequest({
      establishment: body.establishment,
      adminContact: body.adminContact,
    });
    void emailSignupReceivedProspect(request);
    void emailSignupReceivedMaster(request);
    return NextResponse.json({
      ok: true,
      token: request.accessToken,
      id: request.id,
      status: request.status,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Création impossible";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
