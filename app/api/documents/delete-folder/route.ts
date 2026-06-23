import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { deleteFolderAsOwner, type DocumentScope } from "@/app/lib/documents-cloud";

export async function POST(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const scope = (body.scope || "personal") as DocumentScope;
  const shareId = body.shareId ? String(body.shareId) : null;
  const folderPath = String(body.folderPath ?? "");
  const confirm = String(body.confirm ?? "");

  const result = await deleteFolderAsOwner(
    gate.ctx.userId,
    scope,
    shareId,
    folderPath,
    confirm,
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, shareDeleted: result.shareDeleted === true });
}
