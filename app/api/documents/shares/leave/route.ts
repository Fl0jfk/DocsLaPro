import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { leaveSharedFolder } from "@/app/lib/documents-cloud";

export async function POST(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const shareId = String(body.shareId ?? "").trim();
  if (!shareId) {
    return NextResponse.json({ error: "shareId requis." }, { status: 400 });
  }

  const result = await leaveSharedFolder(gate.ctx.userId, shareId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  return NextResponse.json({ success: true });
}
