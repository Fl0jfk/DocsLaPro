import { NextResponse } from "next/server";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { emailMicrosoftApproved } from "@/app/lib/platform-signup-email";
import { loadSignupRequest, saveSignupRequest } from "@/app/lib/platform-signup-request";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const request = await loadSignupRequest(id);
  if (!request) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  if (request.status !== "pending_microsoft" && request.status !== "submitted") {
    return NextResponse.json({ error: "Ce dossier n'est pas en attente Microsoft." }, { status: 400 });
  }

  const user = await safeCurrentUser();
  const now = new Date().toISOString();
  const updated = await saveSignupRequest(
    {
      ...request,
      status: "microsoft_approved",
      microsoftApprovedAt: now,
      microsoftApprovedBy: user?.id || undefined,
    },
    { action: "microsoft_approved", by: user?.id || undefined },
  );

  void emailMicrosoftApproved(updated);
  return NextResponse.json({ ok: true, request: updated });
}
