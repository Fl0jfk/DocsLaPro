import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { leaveFileShare } from "@/app/lib/documents-cloud";

export async function POST(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const fileShareId = String(body.fileShareId ?? "").trim();
  if (!fileShareId) {
    return NextResponse.json({ error: "fileShareId requis." }, { status: 400 });
  }

  const result = await leaveFileShare(gate.ctx.userId, fileShareId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  return NextResponse.json({ success: true });
}
