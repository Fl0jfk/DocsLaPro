import { NextRequest, NextResponse } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { moveDocumentItem, type DocumentScope } from "@/app/lib/documents-cloud";

export async function POST(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const scope = (body.scope || "personal") as DocumentScope;
  const shareId = body.shareId ? String(body.shareId) : null;
  const sourcePath = String(body.sourcePath ?? "");
  const destParentPath = String(body.destParentPath ?? "");
  const itemType = body.itemType === "folder" ? "folder" : "file";

  if (!sourcePath) {
    return NextResponse.json({ error: "Chemin source requis." }, { status: 400 });
  }

  const result = await moveDocumentItem(
    gate.ctx.userId,
    scope,
    shareId,
    sourcePath,
    destParentPath,
    itemType,
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
