import { NextRequest, NextResponse } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { createFolder, type DocumentScope } from "@/app/lib/documents-cloud";

export async function POST(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const scope = (body.scope || "personal") as DocumentScope;
  const shareId = body.shareId ? String(body.shareId) : null;
  const path = String(body.path ?? "");
  const name = String(body.name ?? "");

  if (scope !== "personal" && scope !== "shared") {
    return NextResponse.json({ error: "Scope invalide." }, { status: 400 });
  }

  const result = await createFolder(gate.ctx.userId, scope, shareId, path, name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
