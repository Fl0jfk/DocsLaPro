import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { deleteDocumentItem, type DocumentScope } from "@/app/lib/documents-cloud";

export async function DELETE(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "personal") as DocumentScope;
  const shareId = searchParams.get("shareId");
  const sourcePath = searchParams.get("path") || "";
  const itemType = searchParams.get("itemType") === "folder" ? "folder" : "file";

  if (!sourcePath) {
    return NextResponse.json({ error: "Chemin requis." }, { status: 400 });
  }

  const result = await deleteDocumentItem(
    gate.ctx.userId,
    scope,
    shareId,
    sourcePath,
    itemType,
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
