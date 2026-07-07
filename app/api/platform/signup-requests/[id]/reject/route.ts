import { NextResponse } from "next/server";
import { requirePlatformMaster } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { emailSignupRejected } from "@/app/lib/platform-signup-email";
import { loadSignupRequest, saveSignupRequest } from "@/app/lib/platform-signup-request";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await requirePlatformMaster();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const request = await loadSignupRequest(id);
  if (!request) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  if (request.status === "active" || request.status === "rejected") {
    return NextResponse.json({ error: "Ce dossier ne peut plus être refusé." }, { status: 400 });
  }

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const user = await safeCurrentUser();
  const updated = await saveSignupRequest(
    {
      ...request,
      status: "rejected",
      rejectedReason: body.reason?.trim() || "Dossier non retenu.",
    },
    { action: "rejected", by: user?.id || undefined, detail: body.reason },
  );

  void emailSignupRejected(updated);
  return NextResponse.json({ ok: true, request: updated });
}
