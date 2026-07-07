import { NextResponse } from "next/server";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import {
  loadSignupRequest,
  publicSignupStatusView,
  saveSignupRequest,
} from "@/app/lib/platform-signup-request";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const request = await loadSignupRequest(id);
  if (!request) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  return NextResponse.json({ request });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const request = await loadSignupRequest(id);
  if (!request) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  let body: { masterNotes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const user = await safeCurrentUser();
  const updated = await saveSignupRequest(
    { ...request, masterNotes: body.masterNotes ?? request.masterNotes },
    { action: "notes_updated", by: user?.id || undefined },
  );
  return NextResponse.json({ request: updated });
}
