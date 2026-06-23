import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import {
  createOrUpdateFileShare,
  listIncomingFileShares,
  listOutgoingFileShares,
  updateFileShareMembers,
} from "@/app/lib/documents-cloud";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const [incoming, outgoing] = await Promise.all([
    listIncomingFileShares(gate.ctx.userId),
    listOutgoingFileShares(gate.ctx.userId),
  ]);
  return NextResponse.json({ shares: incoming, incoming, outgoing });
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const sourcePath = String(body.sourcePath ?? "").trim();
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map(String) : [];

  if (!sourcePath) {
    return NextResponse.json({ error: "Chemin du fichier requis." }, { status: 400 });
  }

  const result = await createOrUpdateFileShare(gate.ctx.userId, sourcePath, memberIds);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true, share: result.meta });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const fileShareId = String(body.fileShareId ?? "").trim();
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map(String) : [];

  if (!fileShareId) {
    return NextResponse.json({ error: "fileShareId requis." }, { status: 400 });
  }

  const result = await updateFileShareMembers(gate.ctx.userId, fileShareId, memberIds);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  return NextResponse.json({ success: true, share: result.meta });
}
