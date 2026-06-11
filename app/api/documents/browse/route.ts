import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { browseDocuments, type DocumentScope } from "@/app/lib/documents-cloud";

export async function GET(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "personal") as DocumentScope;
  const shareId = searchParams.get("shareId");
  const path = searchParams.get("path") || "";

  if (scope !== "personal" && scope !== "shared") {
    return NextResponse.json({ error: "Scope invalide." }, { status: 400 });
  }

  const result = await browseDocuments(gate.ctx.userId, scope, shareId, path);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  return NextResponse.json({ items: result.items, scope, shareId, path });
}
