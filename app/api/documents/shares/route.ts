import { NextRequest, NextResponse } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import {
  createSharedFolder,
  listAccessibleShares,
  updateSharedMembers,
} from "@/app/lib/documents-cloud";

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  const shares = await listAccessibleShares(gate.ctx.userId);
  return NextResponse.json({
    shares: shares.map((s) => ({
      ...s,
      isOwner: s.ownerId === gate.ctx.userId,
    })),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map(String) : [];

  if (!name) {
    return NextResponse.json({ error: "Nom du dossier requis." }, { status: 400 });
  }

  const meta = await createSharedFolder(gate.ctx.userId, name, memberIds);
  return NextResponse.json({ success: true, share: meta });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const shareId = String(body.shareId ?? "").trim();
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map(String) : [];

  if (!shareId) {
    return NextResponse.json({ error: "shareId requis." }, { status: 400 });
  }

  const result = await updateSharedMembers(gate.ctx.userId, shareId, memberIds);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  return NextResponse.json({ success: true, share: result.meta });
}
